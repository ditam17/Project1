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
   * Writes student-attached files into the session's /code directory so
   * fopen()/ifstream-style file I/O has something real to read. Filenames
   * are reduced to their basename (path.basename) to prevent traversal,
   * and reserved names can't be clobbered. Returns the list of filenames
   * actually written, so the caller can track them for read-back after run.
   */
  async writeAttachedFiles(tempDir, files) {
    const reserved = new Set([
      "main.c",
      "main.cpp",
      "Main.java",
      "main.py",
      "program",
      "input.txt",
    ]);
    const written = [];
    for (const file of files || []) {
      const safeName = path.basename(file.name);
      if (!safeName || reserved.has(safeName)) continue;
      await fs.writeFile(path.join(tempDir, safeName), file.content ?? "");
      written.push(safeName);
    }
    return written;
  }

  /**
   * Reads back the current on-disk content of every attached file for a
   * session, so the caller can show the student what their program wrote
   * (fopen(..., "w")/"a" etc). Must be called BEFORE cleanupSession, which
   * deletes tempDir. A file the program itself deleted is reported with
   * content: null rather than thrown.
   */
  async readAttachedFileContents(session) {
    const names = session.attachedFiles || [];
    const outputs = [];
    for (const name of names) {
      try {
        const content = await fs.readFile(
          path.join(session.tempDir, name),
          "utf8",
        );
        outputs.push({ name, content });
      } catch (err) {
        outputs.push({ name, content: null, error: "File no longer exists" });
      }
    }
    return outputs;
  }

  /**
   * Start a session, reusing an already-running container when possible.
   * If `reuseSessionId` points at a live container for the same language,
   * skip `docker run` entirely and just recompile + respawn inside it —
   * this is what actually removes the per-Run latency, since container
   * startup (not compilation) was the dominant cost.
   */
  async startSession(code, language, reuseSessionId = null, files = []) {
    if (reuseSessionId) {
      const existing = this.sessions.get(reuseSessionId);
      if (existing && existing.language === language) {
        return this.restartInContainer(reuseSessionId, code, language, files);
      }
      // Language changed or session died — tear down before making a new one.
      if (existing) await this.killSession(reuseSessionId);
    }
    return this.startSession_fresh(code, language, files);
  }

  /**
   * Recompile and respawn inside an already-running container. No
   * docker run/rm round trip — just an exec, cutting per-run latency down
   * to roughly the compile time.
   */
  async restartInContainer(sessionId, code, language, files = []) {
    const session = this.sessions.get(sessionId);
    if (!session)
      return { success: false, sessionId: null, error: "Session not found" };

    // Kill any process still running from the previous run.
    if (session.process && session.isRunning) {
      try {
        session.process.kill("SIGKILL");
      } catch (_) {}
    }

    const { filename, compileCmd, runCmd } = this.commandsFor(language);
    await fs.writeFile(path.join(session.tempDir, filename), code);
    session.attachedFiles = await this.writeAttachedFiles(
      session.tempDir,
      files,
    );

    if (compileCmd) {
      const compileResult = await this.execPromise(
        `docker exec ${session.containerId} sh -c "${compileCmd}"`,
      );
      if (
        compileResult.stdout.includes("error:") ||
        compileResult.stderr.includes("error:")
      ) {
        return {
          success: false,
          sessionId: null,
          error:
            "Compilation Error: " +
            (compileResult.stdout || compileResult.stderr),
        };
      }
    }

    const programProcess = spawn(
      "docker",
      // stty -echo: the frontend already echoes typed characters locally
      // (xterm's onData writes each keystroke immediately for responsive
      // feedback). Without this, the PTY that `script` allocates ALSO
      // echoes stdin back to stdout on its own — a kernel tty-driver
      // behavior, unrelated to the student's program — so every typed
      // character showed up twice.
      [
        "exec",
        "-i",
        session.containerId,
        "sh",
        "-c",
        `script -q /dev/null -c "stty -echo; ${runCmd}"`,
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );

    session.process = programProcess;
    session.isRunning = true;
    session.outputBuffer = "";
    session.allOutput = "";
    session.inputBuffer = "";

    return { success: true, sessionId, error: null };
  }

  /**
   * Language -> filename/compile/run command mapping, factored out so both
   * fresh-container and warm-reuse paths stay in sync.
   */
  commandsFor(language) {
    switch (language) {
      case "c":
        return {
          filename: "main.c",
          compileCmd: "gcc -o program main.c -O2 -Wall 2>&1",
          runCmd: "./program",
        };
      case "cpp":
        return {
          filename: "main.cpp",
          compileCmd: "g++ -o program main.cpp -O2 -Wall -std=c++17 2>&1",
          runCmd: "./program",
        };
      case "python":
        return {
          filename: "main.py",
          compileCmd: null,
          runCmd: "python3 main.py",
        };
      case "java":
        return {
          filename: "Main.java",
          compileCmd: "javac Main.java 2>&1",
          runCmd: "java Main",
        };
      default:
        throw new Error("Unsupported language");
    }
  }

  /**
   * Original path: create a brand-new container. Used for the first run of
   * a terminal session, or when the previous container needed replacing.
   */
  async startSession_fresh(code, language, files = []) {
    const sessionId = uuidv4();
    const tempDir = path.join(this.baseTempDir, `coding_${sessionId}`);

    try {
      await fs.ensureDir(tempDir);

      const { filename, compileCmd, runCmd } = this.commandsFor(language);
      const dockerImage = {
        c: "gcc:latest",
        cpp: "gcc:latest",
        python: "python:3.11-slim",
        java: "eclipse-temurin:17-jdk-alpine",
      }[language];

      // Write source code
      await fs.writeFile(path.join(tempDir, filename), code);
      await fs.writeFile(path.join(tempDir, "input.txt"), "");
      const attachedFiles = await this.writeAttachedFiles(tempDir, files);

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

      // Start the program using docker exec with stdin attached.
      // Use 'script' to get a PTY for interactive programs.
      // stty -echo: see the matching comment in restartInContainer() —
      // the frontend already echoes keystrokes locally, so the PTY's own
      // echo was causing every typed character to appear twice.
      const programProcess = spawn(
        "docker",
        [
          "exec",
          "-i",
          trimmedContainerId,
          "sh",
          "-c",
          `script -q /dev/null -c "stty -echo; ${runCmd}"`,
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
        attachedFiles, // NEW: filenames written for this run, for readback after exit
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

    process.on("close", async (code) => {
      session.isRunning = false;
      // Read back attached files while the container/tempDir still exist.
      const fileOutputs = await this.readAttachedFileContents(session).catch(
        () => [],
      );
      if (onExit) onExit(code, fileOutputs);
      // NOTE: deliberately NOT calling cleanupSession here. The container's
      // PID1 is an idle `sleep` loop, independent of the student program
      // that just exited via `docker exec` — the container itself is still
      // alive and healthy. Destroying it here defeats container reuse
      // (every next Run would be forced back onto the slow docker-run path)
      // for no reason: the program finishing is not the same as the
      // session ending. The container is torn down explicitly instead, via
      // killSession(), on: kill button, disconnect, or language switch.
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
