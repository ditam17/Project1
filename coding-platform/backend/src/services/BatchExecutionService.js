const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
// Printed by the inner container shell ONLY when the compile step itself
// exits non-zero (see runSingleTest below). Previously compile failures
// were detected by searching the program's combined stdout for the literal
// substring "error:", which false-flagged any C/C++/Java/Python program
// whose own (correct) output happened to contain that text — e.g. a
// student printing "error: invalid input" as normal program behavior was
// misclassified as a Compilation Error. This marker can only ever be
// emitted by our own script, immediately after a non-zero compiler exit
// code, so it can't collide with legitimate program output.
const COMPILE_ERROR_MARKER = "@@COMPILE_FAILED_7f3a@@";
const { v4: uuidv4 } = require("uuid");

/**
 * BatchExecutionService
 * Handles non-interactive, batch-mode execution for auto-grading submissions.
 * This is the original execution logic, preserved for the Submit/Grade flow.
 */
class BatchExecutionService {
  constructor() {
    this.baseTempDir = os.tmpdir();
  }

  async executeWithTests(
    code,
    language,
    testCases,
    timeLimit = 2,
    memoryLimit = 64,
  ) {
    const results = [];
    let totalPassed = 0;
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
        testCase.input_files || {},
        testCase.expected_files || {},
        timeLimit,
        memoryLimit,
      );

      const executionTime = Date.now() - startTime;
      totalExecutionTime += executionTime;

      if (result.passed) totalPassed++;

      results.push({
        testCaseIndex: i,
        input: testCase.input,
        expectedOutput: testCase.expected_output,
        actualOutput: result.output,
        passed: result.passed,
        executionTimeMs: executionTime,
        error: result.error || null,
        fileResults: result.fileResults || null,
      });

      allOutputs.push(result.output);
    }

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

  async runSingleTest(
    code,
    language,
    input,
    expectedOutput,
    inputFiles,
    expectedFiles,
    timeLimit,
    memoryLimit,
  ) {
    const jobId = uuidv4();
    const tempDir = path.join(this.baseTempDir, `coding_${jobId}`);

    try {
      await fs.ensureDir(tempDir);

      let filename, compileCmd, dockerImage, runCmd;

      switch (language) {
        case "c":
          filename = "main.c";
          compileCmd = `gcc -o program ${filename} -O2 -Wall 2>&1`;
          dockerImage = "gcc:latest";
          runCmd = `timeout ${timeLimit} ./program < input.txt 2>&1`;
          break;
        case "cpp":
          filename = "main.cpp";
          compileCmd = `g++ -o program ${filename} -O2 -Wall -std=c++17 2>&1`;
          dockerImage = "gcc:latest";
          runCmd = `timeout ${timeLimit} ./program < input.txt 2>&1`;
          break;
        case "python":
          filename = "main.py";
          compileCmd = null;
          dockerImage = "python:3.11-slim";
          runCmd = `timeout ${timeLimit} python3 ${filename} < input.txt 2>&1`;
          break;
        case "java":
          filename = "Main.java";
          compileCmd = `javac ${filename} 2>&1`;
          dockerImage = "eclipse-temurin:17-jdk-alpine";
          runCmd = `timeout ${timeLimit} java Main < input.txt 2>&1`;
          break;
        default:
          return { passed: false, output: "", error: "Unsupported language" };
      }

      await fs.writeFile(path.join(tempDir, filename), code);
      await fs.writeFile(path.join(tempDir, "input.txt"), input || "");

      for (const [fileName, fileContent] of Object.entries(inputFiles)) {
        const safeName = path.basename(fileName);
        await fs.writeFile(path.join(tempDir, safeName), fileContent);
      }

      // For compiled languages, run the compile step, check ITS exit
      // status explicitly (\$? — escaped so the outer host shell passes it
      // through literally to the inner container shell instead of
      // expanding it itself), and only emit the sentinel + bail out if
      // compilation actually failed. This replaces the old `compileCmd &&
      // runCmd` chaining + post-hoc "error:" text search, which couldn't
      // distinguish a real compiler error from the program's own stdout.
      const compileThenRun = `${compileCmd}; if [ \\$? -ne 0 ]; then echo '${COMPILE_ERROR_MARKER}'; exit 1; fi; ${runCmd}`;

      let dockerCmd;
      if (language === "c" || language === "cpp") {
        dockerCmd = `docker run --rm \
          --network none \
          --memory="${memoryLimit}m" \
          --memory-swap="${memoryLimit}m" \
          --cpus="0.5" \
          --pids-limit 20 \
          --security-opt no-new-privileges:true \
          --cap-drop ALL \
          --user 1000:1000 \
          -v "${tempDir}:/code:rw" \
          -w /code \
          ${dockerImage} \
          sh -c "${compileThenRun}" 2>&1`;
      } else if (language === "python") {
        dockerCmd = `docker run --rm \
          --network none \
          --memory="${memoryLimit}m" \
          --memory-swap="${memoryLimit}m" \
          --cpus="0.5" \
          --pids-limit 20 \
          --security-opt no-new-privileges:true \
          --cap-drop ALL \
          --user 1000:1000 \
          -v "${tempDir}:/code:rw" \
          -w /code \
          ${dockerImage} \
          sh -c "${runCmd}" 2>&1`;
      } else if (language === "java") {
        dockerCmd = `docker run --rm \
          --network none \
          --memory="${memoryLimit}m" \
          --memory-swap="${memoryLimit}m" \
          --cpus="0.5" \
          --pids-limit 20 \
          --security-opt no-new-privileges:true \
          --cap-drop ALL \
          --user 1000:1000 \
          -v "${tempDir}:/code:rw" \
          -w /code \
          ${dockerImage} \
          sh -c "${compileThenRun}" 2>&1`;
      }

      return new Promise((resolve) => {
        exec(
          dockerCmd,
          {
            timeout: (timeLimit + 5) * 1000,
            maxBuffer: 1024 * 1024,
            killSignal: "SIGKILL",
          },
          async (error, stdout, stderr) => {
            const fileResults = {};
            let fileCheckPassed = true;

            for (const [fileName, expectedContent] of Object.entries(
              expectedFiles,
            )) {
              try {
                const safeName = path.basename(fileName);
                const actualPath = path.join(tempDir, safeName);

                let actualContent = "";
                if (await fs.pathExists(actualPath)) {
                  actualContent = await fs.readFile(actualPath, "utf-8");
                }
                const normalizedActual = this.normalizeOutput(actualContent);
                const normalizedExpected =
                  this.normalizeOutput(expectedContent);
                const filePassed = normalizedActual === normalizedExpected;
                fileResults[fileName] = {
                  expected: expectedContent,
                  actual: actualContent,
                  passed: filePassed,
                };
                if (!filePassed) fileCheckPassed = false;
              } catch (readErr) {
                fileResults[fileName] = {
                  expected: expectedContent,
                  actual: "",
                  passed: false,
                  error: readErr.message,
                };
                fileCheckPassed = false;
              }
            }

            fs.remove(tempDir).catch(() => {});

            let output = (stdout || "").trim();
            const errorOutput = (stderr || "").trim();

            if (
              output.includes(COMPILE_ERROR_MARKER) ||
              errorOutput.includes(COMPILE_ERROR_MARKER)
            ) {
              // Strip the sentinel itself out before surfacing the
              // compiler's own error text to the student.
              const cleanedOutput = output
                .replace(COMPILE_ERROR_MARKER, "")
                .trim();
              resolve({
                passed: false,
                output: cleanedOutput || errorOutput,
                error: "Compilation Error",
                fileResults,
              });
              return;
            }

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
                  fileResults,
                });
              } else {
                resolve({
                  passed: false,
                  output: output || errorOutput,
                  error: "Runtime Error",
                  fileResults,
                });
              }
              return;
            }

            const normalizedOutput = this.normalizeOutput(output);
            const normalizedExpected = this.normalizeOutput(expectedOutput);
            let passed = true;
            if (expectedOutput !== "")
              passed = normalizedOutput === normalizedExpected;
            if (Object.keys(expectedFiles).length > 0)
              passed = passed && fileCheckPassed;

            resolve({
              passed,
              output,
              error: passed ? null : "Wrong Answer",
              fileResults,
            });
          },
        );
      });
    } catch (err) {
      await fs.remove(tempDir).catch(() => {});
      return { passed: false, output: "", error: err.message, fileResults: {} };
    }
  }

  normalizeOutput(output) {
    return output.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  }
}

module.exports = new BatchExecutionService();
