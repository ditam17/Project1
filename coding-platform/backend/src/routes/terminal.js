const express = require("express");
const {
  verifyToken,
  requireRole,
  requireSemesterLanguage,
  SEMESTER_LANGUAGE,
} = require("../middleware/auth");
const {
  codeExecutionLimiter,
  submissionLimiter,
} = require("../middleware/rateLimiter");
const InteractiveTerminalService = require("../services/InteractiveTerminalService");
const BatchExecutionService = require("../services/BatchExecutionService");
const PlagiarismDetector = require("../utils/similarity");
const pool = require("../config/database");
const router = express.Router();

// Security: Input validation
const validateCode = (code, language) => {
  if (!code || typeof code !== "string") return "Code is required";
  if (code.length > 10000) return "Code too long (max 10KB)";
  if (!language || !["c", "cpp", "python", "java"].includes(language)) {
    return "Invalid language. Supported: c, cpp, python, java";
  }
  const dangerous = [
    /system\s*\(/i,
    /exec\s*\(/i,
    /popen\s*\(/i,
    /fork\s*\(/i,
    /remove\s*\(/i,
    /unlink\s*\(/i,
    /socket\s*\(/i,
    /connect\s*\(/i,
  ];
  for (const pattern of dangerous) {
    if (pattern.test(code)) {
      return "Code contains forbidden system calls. Remove system(), exec(), fork(), or network calls.";
    }
  }
  return null;
};

/**
 * Setup Socket.IO for interactive terminal
 */
function setupSocketIO(httpServer) {
  const { Server } = require("socket.io");
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    },
    path: "/socket.io",
  });

  const terminalNamespace = io.of("/terminal");

  terminalNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  terminalNamespace.on("connection", (socket) => {
    console.log(`Terminal client connected: ${socket.id}`);
    let currentSessionId = null;

    socket.on("start", async (data) => {
      const { code, language } = data;
      if (socket.user.role !== "student") {
        socket.emit("error", { message: "Only students can use the terminal" });
        return;
      }
      const allowedLanguage = SEMESTER_LANGUAGE[socket.user.semester];
      if (!allowedLanguage || language !== allowedLanguage) {
        socket.emit("error", {
          message: allowedLanguage
            ? `Semester ${socket.user.semester} students can only use ${allowedLanguage.toUpperCase()}.`
            : "No semester assigned to this account",
        });
        return;
      }
      const validationError = validateCode(code, language);
      if (validationError) {
        socket.emit("error", { message: validationError });
        return;
      }
      if (currentSessionId) {
        await InteractiveTerminalService.killSession(currentSessionId);
      }
      const result = await InteractiveTerminalService.startSession(
        code,
        language,
      );
      if (!result.success) {
        socket.emit("error", { message: result.error });
        return;
      }
      currentSessionId = result.sessionId;
      socket.emit("started", { sessionId: result.sessionId });
      InteractiveTerminalService.setupOutputListeners(
        result.sessionId,
        (output) => socket.emit("output", { data: output }),
        (error) => socket.emit("output", { data: error, isError: true }),
        (exitCode) => {
          socket.emit("exit", { code: exitCode });
          currentSessionId = null;
        },
      );
    });

    socket.on("input", (data) => {
      if (!currentSessionId) {
        socket.emit("error", { message: "No active session" });
        return;
      }
      const result = InteractiveTerminalService.sendInput(
        currentSessionId,
        data.input,
      );
      if (!result.success) socket.emit("error", { message: result.error });
    });

    socket.on("special_key", (data) => {
      if (!currentSessionId) return;
      InteractiveTerminalService.sendSpecialKey(currentSessionId, data.key);
    });

    socket.on("kill", async () => {
      if (currentSessionId) {
        await InteractiveTerminalService.killSession(currentSessionId);
        currentSessionId = null;
        socket.emit("killed");
      }
    });

    socket.on("disconnect", async () => {
      if (currentSessionId) {
        await InteractiveTerminalService.killSession(currentSessionId);
      }
      console.log(`Terminal client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// REST API routes

// Get questions by language
router.get(
  "/questions/:language",
  verifyToken,
  requireRole("student"),
  requireSemesterLanguage,
  async (req, res, next) => {
    try {
      const { language } = req.params;
      if (!["c", "cpp", "python", "java"].includes(language)) {
        return res.status(400).json({ error: "Invalid language" });
      }
      const result = await pool.query(
        `SELECT id, title, description, starter_code, language, points, time_limit, memory_limit
         FROM questions WHERE language = $1 AND is_active = true ORDER BY id`,
        [language],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// Get progress
router.get(
  "/progress",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const studentId = req.user.userId;
      const result = await pool.query(
        `SELECT COUNT(DISTINCT s.question_id) as solved_count, COALESCE(SUM(s.score), 0) as total_score,
         COUNT(DISTINCT q.id) as total_questions FROM users u
         LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'submitted'
         LEFT JOIN questions q ON q.is_active = true WHERE u.id = $1 GROUP BY u.id`,
        [studentId],
      );
      res.json(
        result.rows[0] || {
          solved_count: 0,
          total_score: 0,
          total_questions: 0,
        },
      );
    } catch (err) {
      next(err);
    }
  },
);

// Compile and run code (simple execution for testing without WebSocket)
router.post(
  "/compile",
  verifyToken,
  requireRole("student"),
  requireSemesterLanguage,
  codeExecutionLimiter,
  async (req, res, next) => {
    try {
      const { code, language } = req.body;
      const error = validateCode(code, language);
      if (error) return res.status(400).json({ error });
      const result = await BatchExecutionService.executeWithTests(
        code,
        language,
        [{ input: "", expected_output: "" }],
        2,
        64,
      );
      res.json({
        success: !result.error,
        output:
          result.results[0]?.output || result.results[0]?.error || "No output",
      });
    } catch (err) {
      next(err);
    }
  },
);

// Save draft
router.post(
  "/draft",
  verifyToken,
  requireRole("student"),
  requireSemesterLanguage,
  async (req, res, next) => {
    try {
      const { question_id, code, language } = req.body;
      const studentId = req.user.userId;
      if (!question_id || isNaN(question_id))
        return res.status(400).json({ error: "Invalid question ID" });
      const error = validateCode(code, language);
      if (error) return res.status(400).json({ error });
      const result = await pool.query(
        `INSERT INTO submissions (student_id, question_id, code, language, status, ip_address)
         VALUES ($1, $2, $3, $4, 'draft', $5)
         ON CONFLICT (student_id, question_id)
         DO UPDATE SET code = $3, status = 'draft', submitted_at = CURRENT_TIMESTAMP RETURNING *`,
        [studentId, question_id, code, language, req.ip || null],
      );
      res.json({ success: true, submission: result.rows[0] });
    } catch (err) {
      next(err);
    }
  },
);

// Submit code with AUTO-GRADING + terminal_output
router.post(
  "/submit",
  verifyToken,
  requireRole("student"),
  requireSemesterLanguage,
  submissionLimiter,
  async (req, res, next) => {
    try {
      const { question_id, code, language, terminal_output } = req.body;
      const studentId = req.user.userId;
      if (!question_id || isNaN(question_id))
        return res.status(400).json({ error: "Invalid question ID" });
      const error = validateCode(code, language);
      if (error) return res.status(400).json({ error });

      const questionResult = await pool.query(
        `SELECT test_cases, time_limit, memory_limit, points FROM questions WHERE id = $1 AND is_active = true`,
        [question_id],
      );
      if (questionResult.rows.length === 0)
        return res
          .status(404)
          .json({ error: "Question not found or inactive" });

      const question = questionResult.rows[0];
      const testCases = question.test_cases || [];

      const gradingResult = await BatchExecutionService.executeWithTests(
        code,
        language,
        testCases,
        question.time_limit || 2,
        question.memory_limit || 64,
      );

      const finalScore = Math.round(
        (gradingResult.score / 100) * (question.points || 10),
      );

      const submissionResult = await pool.query(
        `INSERT INTO submissions (student_id, question_id, code, language, output, terminal_output, status, score, execution_time_ms, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, 'submitted', $7, $8, $9)
         ON CONFLICT (student_id, question_id)
         DO UPDATE SET code = $3, output = $5, terminal_output = $6, status = 'submitted', score = $7, execution_time_ms = $8, submitted_at = CURRENT_TIMESTAMP RETURNING *`,
        [
          studentId,
          question_id,
          code,
          language,
          gradingResult.combinedOutput,
          terminal_output || gradingResult.combinedOutput,
          finalScore,
          gradingResult.executionTimeMs,
          req.ip || null,
        ],
      );

      const submission = submissionResult.rows[0];
      await pool.query(`DELETE FROM test_results WHERE submission_id = $1`, [
        submission.id,
      ]);

      for (const testResult of gradingResult.results) {
        await pool.query(
          `INSERT INTO test_results (submission_id, test_case_index, input, expected_output, actual_output, passed, execution_time_ms, file_results)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            submission.id,
            testResult.testCaseIndex,
            testResult.input,
            testResult.expectedOutput,
            testResult.actualOutput,
            testResult.passed,
            testResult.executionTimeMs,
            testResult.fileResults,
          ],
        );
      }

      res.json({
        success: gradingResult.success,
        score: finalScore,
        totalPoints: question.points || 10,
        totalPassed: gradingResult.totalPassed,
        totalTests: gradingResult.totalTests,
        executionTimeMs: gradingResult.executionTimeMs,
        results: gradingResult.results,
        submission: submission,
      });
    } catch (err) {
      next(err);
    }
  },
);

// Get submissions
router.get(
  "/submissions/:question_id",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const { question_id } = req.params;
      const studentId = req.user.userId;
      const result = await pool.query(
        `SELECT s.*, q.title as question_title, q.points as total_points,
         (SELECT json_agg(t.*) FROM test_results t WHERE t.submission_id = s.id) as test_results
         FROM submissions s JOIN questions q ON s.question_id = q.id
         WHERE s.student_id = $1 AND s.question_id = $2 ORDER BY s.submitted_at DESC`,
        [studentId, question_id],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// Get submission status for all questions (for submitted ticks)
router.get(
  "/submission-status",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const studentId = req.user.userId;
      const result = await pool.query(
        `SELECT question_id, status FROM submissions WHERE student_id = $1`,
        [studentId],
      );
      const statusMap = {};
      result.rows.forEach((row) => {
        statusMap[row.question_id] = row.status;
      });
      res.json(statusMap);
    } catch (err) {
      next(err);
    }
  },
);

// Get plagiarism
router.get(
  "/plagiarism/:question_id",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const { question_id } = req.params;
      const studentId = req.user.userId;
      if (!question_id || isNaN(question_id))
        return res.status(400).json({ error: "Invalid question ID" });
      const matches = await PlagiarismDetector.findPlagiarismMatches(
        studentId,
        question_id,
        pool,
      );
      res.json(matches);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = { router, setupSocketIO };
