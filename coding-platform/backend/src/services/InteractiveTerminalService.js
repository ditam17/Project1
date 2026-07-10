// Line 1
const { spawn, exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

/**
 * InteractiveTerminalService
 * Manages persistent Docker containers that run student code interactively.
 * Uses docker exec to send stdin and receive stdout/stderr in real-time.
 * OPTIMIZED: Faster container startup, buffered input, captured output.
 */
class InteractiveTerminalService {
  constructor() {
    this.baseTempDir = os.tmpdir();
    // Map: sessionId -> { containerId, tempDir, process, language, isRunning, outputBuffer, allOutput }
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
      await fs.writeFile(path.join(tempDir, "input.txt"), "");

      // OPTIMIZATION: Use alpine-based images for faster startup
      // Start container with sleep to keep it alive
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
      // Use 'script' to get a PTY for interactive programs
      const programProcess = spawn(
        "docker",
        [
          "exec",
          "-i",
          trimmedContainerId,
          "sh",
          "-c",
          `script -q /dev/null -c "${runCmd}"`,
        ],
        {
          stdio: ["pipe", "pipe", "pipe"],
        },
      );

      // Store session with output tracking
      this.sessions.set(sessionId, {
        containerId: trimmedContainerId,
        tempDir,
        process: programProcess,
        language,
        isRunning: true,
        outputBuffer: "",
        allOutput: "", // NEW: Accumulates ALL output for teacher view
        inputBuffer: "", // NEW: Buffers input until Enter
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
   * NEW: Buffers input until newline, then sends complete line
   */
  sendInput(sessionId, input) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isRunning) {
      return { success: false, error: "Session not found or not running" };
    }

    try {
      // Buffer the input
      session.inputBuffer += input;

      // Check if Enter was pressed (\r or \n)
      if (input.includes("\r") || input.includes("\n")) {
        // Send the complete buffered line
        const lineToSend = session.inputBuffer;
        session.inputBuffer = ""; // Clear buffer
        session.process.stdin.write(lineToSend);
        return { success: true, sent: lineToSend };
      }

      // Input is still being buffered (user hasn't pressed Enter yet)
      return { success: true, buffered: true };
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
          // Send buffered input + newline
          if (session.inputBuffer) {
            session.process.stdin.write(session.inputBuffer + "\n");
            session.inputBuffer = "";
          } else {
            session.process.stdin.write("\n");
          }
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
   * Get output from a session
   */
  getOutput(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, output: "", error: "Session not found" };
    }

    const output = session.outputBuffer;
    session.outputBuffer = "";
    return { success: true, output, isRunning: session.isRunning };
  }

  /**
   * Get ALL accumulated output (for teacher view)
   */
  getAllOutput(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, allOutput: "", error: "Session not found" };
    }
    return {
      success: true,
      allOutput: session.allOutput,
      isRunning: session.isRunning,
    };
  }

  /**
   * Set up output listeners for a session
   */
  setupOutputListeners(sessionId, onOutput, onError, onExit) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const { process } = session;

    process.stdout.on("data", (data) => {
      const text = data.toString();
      session.outputBuffer += text;
      session.allOutput += text; // Accumulate ALL output
      if (onOutput) onOutput(text);
    });

    process.stderr.on("data", (data) => {
      const text = data.toString();
      session.outputBuffer += text;
      session.allOutput += text; // Accumulate ALL output
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
   * Kill a session
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
   * Clean up a session
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
}

module.exports = new InteractiveTerminalService();
