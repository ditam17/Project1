const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

class CodeExecutionService {
  constructor() {
    // Use OS temp directory (cross-platform)
    this.baseTempDir = os.tmpdir();
  }

  /**
   * Execute code against all test cases and return detailed results
   */
  async executeWithTests(
    code,
    language,
    testCases,
    timeLimit = 2,
    memoryLimit = 64,
  ) {
    const results = [];
    let totalPassed = 0;
    let totalScore = 0;
    let totalExecutionTime = 0;
    let allOutputs = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const startTime = Date.now();

      const result = await this.runSingleTest(
        code,
        language,
        testCase.input || "",
        testCase.expected_output || "",
        timeLimit,
        memoryLimit,
      );

      const executionTime = Date.now() - startTime;
      totalExecutionTime += executionTime;

      if (result.passed) {
        totalPassed++;
      }

      results.push({
        testCaseIndex: i,
        input: testCase.input,
        expectedOutput: testCase.expected_output,
        actualOutput: result.output,
        passed: result.passed,
        executionTimeMs: executionTime,
        error: result.error || null,
      });

      allOutputs.push(result.output);
    }

    // Calculate score based on percentage of tests passed
    const score =
      testCases.length > 0
        ? Math.round((totalPassed / testCases.length) * 100)
        : 0;

    return {
      success: totalPassed === testCases.length,
      score,
      totalPassed,
      totalTests: testCases.length,
      executionTimeMs: totalExecutionTime,
      results,
      combinedOutput: allOutputs.join("\n"),
    };
  }

  /**
   * Run a single test case
   */
  async runSingleTest(
    code,
    language,
    input,
    expectedOutput,
    timeLimit,
    memoryLimit,
  ) {
    const jobId = uuidv4();
    const tempDir = path.join(this.baseTempDir, `coding_${jobId}`);

    try {
      await fs.ensureDir(tempDir);

      const filename =
        language === "c"
          ? "main.c"
          : language === "cpp"
            ? "main.cpp"
            : "main.py";
      const compiler =
        language === "c" ? "gcc" : language === "cpp" ? "g++" : "python3";
      const compileCmd =
        language === "c" || language === "cpp"
          ? `${compiler} -o program ${filename} -O2 -Wall 2>&1`
          : null;

      await fs.writeFile(path.join(tempDir, filename), code);

      // Write input to file for stdin piping
      if (input) {
        await fs.writeFile(path.join(tempDir, "input.txt"), input);
      }

      // Build Docker command with proper stdin handling
      let dockerCmd;
      if (language === "c" || language === "cpp") {
        dockerCmd = `docker run --rm \
          --network none \
          --memory="${memoryLimit}m" \
          --memory-swap="${memoryLimit}m" \
          --cpus="0.5" \
          --pids-limit 20 \
          --read-only \
          --security-opt no-new-privileges:true \
          --cap-drop ALL \
          --user 1000:1000 \
          -v "${tempDir}:/code:rw" \
          -w /code \
          gcc:latest \
          sh -c "${compileCmd} && timeout ${timeLimit} ./program < input.txt 2>&1" 2>&1`;
      } else if (language === "python") {
        dockerCmd = `docker run --rm \
          --network none \
          --memory="${memoryLimit}m" \
          --memory-swap="${memoryLimit}m" \
          --cpus="0.5" \
          --pids-limit 20 \
          --read-only \
          --security-opt no-new-privileges:true \
          --cap-drop ALL \
          --user 1000:1000 \
          -v "${tempDir}:/code:rw" \
          -w /code \
          python:3.11-slim \
          sh -c "timeout ${timeLimit} python3 ${filename} < input.txt 2>&1" 2>&1`;
      } else {
        return { passed: false, output: "", error: "Unsupported language" };
      }

      return new Promise((resolve) => {
        exec(
          dockerCmd,
          {
            timeout: (timeLimit + 5) * 1000, // Extra buffer for Docker overhead
            maxBuffer: 1024 * 1024,
            killSignal: "SIGKILL",
          },
          (error, stdout, stderr) => {
            fs.remove(tempDir).catch(() => {});

            const output = (stdout || "").trim();
            const errorOutput = (stderr || "").trim();

            // Check for compilation errors
            if (output.includes("error:") || errorOutput.includes("error:")) {
              resolve({
                passed: false,
                output: output || errorOutput,
                error: "Compilation Error",
              });
              return;
            }

            // Check for runtime errors (TLE, SIGKILL, etc.)
            if (error) {
              if (
                error.killed ||
                error.signal === "SIGTERM" ||
                error.signal === "SIGKILL"
              ) {
                resolve({
                  passed: false,
                  output: "",
                  error: "Time Limit Exceeded",
                });
              } else {
                resolve({
                  passed: false,
                  output: output || errorOutput,
                  error: "Runtime Error",
                });
              }
              return;
            }

            // Compare output (normalize whitespace)
            const normalizedOutput = this.normalizeOutput(output);
            const normalizedExpected = this.normalizeOutput(expectedOutput);
            const passed = normalizedOutput === normalizedExpected;

            resolve({
              passed,
              output: output,
              error: passed ? null : "Wrong Answer",
            });
          },
        );
      });
    } catch (err) {
      await fs.remove(tempDir).catch(() => {});
      return { passed: false, output: "", error: err.message };
    }
  }

  /**
   * Simple compile-and-run (for the "Run Code" button without grading)
   */
  async execute(code, language) {
    const result = await this.runSingleTest(code, language, "", "", 2, 64);
    return {
      success: !result.error,
      output: result.output || result.error || "No output",
    };
  }

  /**
   * Normalize output for comparison (trim whitespace, normalize newlines)
   */
  normalizeOutput(output) {
    return output.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  }
}

module.exports = new CodeExecutionService();
