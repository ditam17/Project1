const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  codeExecutionLimiter,
  submissionLimiter,
} = require("../middleware/rateLimiter");
const CodeExecutionService = require("../services/CodeExecutionService");
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

  // Security: Block dangerous system calls
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

// Get questions by language (with caching-friendly structure)
router.get(
  "/questions/:language",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const { language } = req.params;

      if (!["c", "cpp", "python", "java"].includes(language)) {
        return res.status(400).json({ error: "Invalid language" });
      }

      const result = await pool.query(
        `SELECT id, title, description, starter_code, language, points, time_limit, memory_limit 
         FROM questions 
         WHERE language = $1 AND is_active = true 
         ORDER BY id`,
        [language],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// Get student's progress and scores
router.get(
  "/progress",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const studentId = req.user.userId;

      const result = await pool.query(
        `SELECT 
          COUNT(DISTINCT s.question_id) as solved_count,
          COALESCE(SUM(s.score), 0) as total_score,
          COUNT(DISTINCT q.id) as total_questions
         FROM users u
         LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'submitted'
         LEFT JOIN questions q ON q.is_active = true
         WHERE u.id = $1
         GROUP BY u.id`,
        [studentId],
      );

      const progress = result.rows[0] || {
        solved_count: 0,
        total_score: 0,
        total_questions: 0,
      };
      res.json(progress);
    } catch (err) {
      next(err);
    }
  },
);

// Compile and run code (rate limited)
router.post(
  "/compile",
  verifyToken,
  requireRole("student"),
  codeExecutionLimiter,
  async (req, res, next) => {
    try {
      const { code, language } = req.body;

      const error = validateCode(code, language);
      if (error) {
        return res.status(400).json({ error });
      }

      const result = await CodeExecutionService.execute(code, language);
      res.json(result);
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
  async (req, res, next) => {
    try {
      const { question_id, code, language } = req.body;
      const studentId = req.user.userId;

      if (!question_id || isNaN(question_id)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }

      const error = validateCode(code, language);
      if (error) {
        return res.status(400).json({ error });
      }

      const result = await pool.query(
        `INSERT INTO submissions (student_id, question_id, code, language, status, ip_address)
         VALUES ($1, $2, $3, $4, 'draft', $5)
         ON CONFLICT (student_id, question_id)
         DO UPDATE SET code = $3, status = 'draft', submitted_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [studentId, question_id, code, language, req.ip || null],
      );

      res.json({ success: true, submission: result.rows[0] });
    } catch (err) {
      next(err);
    }
  },
);

// Submit code with AUTO-GRADING
router.post(
  "/submit",
  verifyToken,
  requireRole("student"),
  submissionLimiter,
  async (req, res, next) => {
    try {
      const { question_id, code, language } = req.body;
      const studentId = req.user.userId;

      if (!question_id || isNaN(question_id)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }

      const error = validateCode(code, language);
      if (error) {
        return res.status(400).json({ error });
      }

      // Get question details including test cases
      const questionResult = await pool.query(
        `SELECT test_cases, time_limit, memory_limit, points 
         FROM questions 
         WHERE id = $1 AND is_active = true`,
        [question_id],
      );

      if (questionResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Question not found or inactive" });
      }

      const question = questionResult.rows[0];
      const testCases = question.test_cases || [];

      // Run auto-grading
      const gradingResult = await CodeExecutionService.executeWithTests(
        code,
        language,
        testCases,
        question.time_limit || 2,
        question.memory_limit || 64,
      );

      // Calculate final score
      const finalScore = Math.round(
        (gradingResult.score / 100) * (question.points || 10),
      );

      // Save submission with results
      const submissionResult = await pool.query(
        `INSERT INTO submissions (student_id, question_id, code, language, output, status, score, execution_time_ms, ip_address)
         VALUES ($1, $2, $3, $4, $5, 'submitted', $6, $7, $8)
         ON CONFLICT (student_id, question_id)
         DO UPDATE SET code = $3, output = $5, status = 'submitted', score = $6, execution_time_ms = $7, submitted_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          studentId,
          question_id,
          code,
          language,
          gradingResult.combinedOutput,
          finalScore,
          gradingResult.executionTimeMs,
          req.ip || null,
        ],
      );

      const submission = submissionResult.rows[0];

      // Save individual test results
      await pool.query(`DELETE FROM test_results WHERE submission_id = $1`, [
        submission.id,
      ]);

      for (const testResult of gradingResult.results) {
        await pool.query(
          `INSERT INTO test_results (submission_id, test_case_index, input, expected_output, actual_output, passed, execution_time_ms)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            submission.id,
            testResult.testCaseIndex,
            testResult.input,
            testResult.expectedOutput,
            testResult.actualOutput,
            testResult.passed,
            testResult.executionTimeMs,
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

// Get submission history for a question
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
         FROM submissions s
         JOIN questions q ON s.question_id = q.id
         WHERE s.student_id = $1 AND s.question_id = $2
         ORDER BY s.submitted_at DESC`,
        [studentId, question_id],
      );

      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// Get plagiarism matches
router.get(
  "/plagiarism/:question_id",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const { question_id } = req.params;
      const studentId = req.user.userId;

      if (!question_id || isNaN(question_id)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }

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

module.exports = router;
