const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

/**
 * InteractiveTerminalService
 * Manages persistent Docker containers that run student code interactively.
 * Uses docker exec to send stdin and receive stdout/stderr in real-time.
 */
class InteractiveTerminalService {
  constructor() {
    this.baseTempDir = os.tmpdir();
    // Map: sessionId -> { containerId, tempDir, process, language, isRunning }
    this.sessions = new Map();
  }

  /**
   * Start a new interactive session
   * Compiles the code, starts a Docker container, and returns a session ID
   */
  async startSession(code, language) {
    const sessionId = uuidv4();
    const tempDir = path.join(this.baseTempDir, `coding_${sessionId}`);

    try {
      await fs.ensureDir(tempDir);

      let filename, compileCmd, dockerImage, runCmd;

      switch (language) {
        case "c":
          filename = "main.c";
          compileCmd = `gcc -o program ${filename} -O2 -Wall 2>&1`;
          dockerImage = "gcc:latest";
          runCmd = `./program`;
          break;
        case "cpp":
          filename = "main.cpp";
          compileCmd = `g++ -o program ${filename} -O2 -Wall -std=c++17 2>&1`;
          dockerImage = "gcc:latest";
          runCmd = `./program`;
          break;
        case "python":
          filename = "main.py";
          compileCmd = null;
          dockerImage = "python:3.11-slim";
          runCmd = `python3 ${filename}`;
          break;
        case "java":
          filename = "Main.java";
          compileCmd = `javac ${filename} 2>&1`;
          dockerImage = "eclipse-temurin:17-jdk-alpine";
          runCmd = `java Main`;
          break;
        default:
          throw new Error("Unsupported language");
      }

      // Write source code
      await fs.writeFile(path.join(tempDir, filename), code);

      // Create empty input.txt (for compatibility with existing tests)
      await fs.writeFile(path.join(tempDir, "input.txt"), "");

      // Start a persistent Docker container with a sleep command to keep it alive
      const containerName = `coding_session_${sessionId}`;
      const startContainerCmd = `docker run -d \
        --name ${containerName} \
        --network none \
        --memory="64m" \
        --memory-swap="64m" \
        --cpus="0.5" \
        --pids-limit 20 \
        --security-opt no-new-privileges:true \
        --cap-drop ALL \
        --user 1000:1000 \
        -v "${tempDir}:/code:rw" \
        -w /code \
        ${dockerImage} \
        sh -c "while true; do sleep 1000; done"`;

      const { stdout: containerId } = await this.execPromise(startContainerCmd);
      const trimmedContainerId = containerId.trim();

      // Compile if needed (C, C++, Java)
      if (compileCmd) {
        const compileResult = await this.execPromise(
          `docker exec ${trimmedContainerId} sh -c "${compileCmd}"`,
        );
        if (
          compileResult.stdout.includes("error:") ||
          compileResult.stderr.includes("error:")
        ) {
          // Compilation failed - kill container and return error
          await this.killContainer(trimmedContainerId);
          await fs.remove(tempDir).catch(() => {});
          return {
            success: false,
            sessionId: null,
            error:
              "Compilation Error: " +
              (compileResult.stdout || compileResult.stderr),
          };
        }
      }

      // Start the program using docker exec with stdin attached
      // We use 'script' to get a PTY, which allows interactive input
      const programProcess = spawn(
        "docker",
        [
          "exec",
          "-i", // -i = interactive (keep stdin open)
          trimmedContainerId,
          "sh",
          "-c",
          `script -q /dev/null -c "${runCmd}"`, // PTY wrapper for interactive programs
        ],
        {
          stdio: ["pipe", "pipe", "pipe"], // stdin, stdout, stderr all piped
        },
      );

      // Store session
      this.sessions.set(sessionId, {
        containerId: trimmedContainerId,
        tempDir,
        process: programProcess,
        language,
        isRunning: true,
        outputBuffer: "",
      });

      return {
        success: true,
        sessionId,
        error: null,
      };
    } catch (err) {
      await fs.remove(tempDir).catch(() => {});
      return {
        success: false,
        sessionId: null,
        error: err.message,
      };
    }
  }

  /**
   * Send input to a running session
   */
  sendInput(sessionId, input) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isRunning) {
      return { success: false, error: "Session not found or not running" };
    }

    try {
      // Send input to the program's stdin
      // Add newline if not present (most interactive programs expect Enter key)
      const data = input.endsWith("\n") ? input : input + "\n";
      session.process.stdin.write(data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Send a special key (like Ctrl+C, Ctrl+D, etc.)
   */
  sendSpecialKey(sessionId, key) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isRunning) {
      return { success: false, error: "Session not found or not running" };
    }

    try {
      switch (key) {
        case "CTRL_C":
          session.process.kill("SIGINT");
          break;
        case "CTRL_D":
          session.process.stdin.end();
          break;
        case "ENTER":
          session.process.stdin.write("\n");
          break;
        default:
          session.process.stdin.write(key);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get output from a session (non-blocking, returns accumulated output)
   */
  getOutput(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, output: "", error: "Session not found" };
    }

    const output = session.outputBuffer;
    session.outputBuffer = ""; // Clear after reading
    return { success: true, output, isRunning: session.isRunning };
  }

  /**
   * Set up output listeners for a session
   * This should be called after startSession to capture stdout/stderr
   */
  setupOutputListeners(sessionId, onOutput, onError, onExit) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const { process } = session;

    process.stdout.on("data", (data) => {
      const text = data.toString();
      session.outputBuffer += text;
      if (onOutput) onOutput(text);
    });

    process.stderr.on("data", (data) => {
      const text = data.toString();
      session.outputBuffer += text;
      if (onError) onError(text);
    });

    process.on("close", (code) => {
      session.isRunning = false;
      this.cleanupSession(sessionId);
      if (onExit) onExit(code);
    });

    process.on("error", (err) => {
      session.isRunning = false;
      if (onError) onError(err.message);
    });
  }

  /**
   * Kill a session (stop the container and clean up)
   */
  async killSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, error: "Session not found" };

    try {
      session.process.kill("SIGKILL");
      await this.killContainer(session.containerId);
      await fs.remove(session.tempDir).catch(() => {});
      this.sessions.delete(sessionId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Clean up a session without killing (called when program exits naturally)
   */
  async cleanupSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      await this.killContainer(session.containerId);
      await fs.remove(session.tempDir).catch(() => {});
      this.sessions.delete(sessionId);
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  }

  /**
   * Helper: Execute a command and return promise
   */
  execPromise(command) {
    return new Promise((resolve, reject) => {
      const { exec } = require("child_process");
      exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error && !stdout) {
          reject({ error, stdout, stderr });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  /**
   * Helper: Kill a Docker container
   */
  async killContainer(containerId) {
    try {
      await this.execPromise(`docker stop -t 0 ${containerId}`);
      await this.execPromise(`docker rm ${containerId}`);
    } catch (err) {
      // Container might already be gone
    }
  }

  /**
   * For auto-grading: batch execution with test cases (existing functionality)
   * This keeps the old behavior for submissions
   */
  async executeWithTests(
    code,
    language,
    testCases,
    timeLimit = 2,
    memoryLimit = 64,
  ) {
    // Import the old batch execution logic
    const BatchService = require("./BatchExecutionService");
    return BatchService.executeWithTests(
      code,
      language,
      testCases,
      timeLimit,
      memoryLimit,
    );
  }
}

module.exports = new InteractiveTerminalService();
