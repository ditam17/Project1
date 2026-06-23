const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const CodeExecutionService = require("../services/CodeExecutionService");
const PlagiarismDetector = require("../utils/similarity");
const pool = require("../config/database");
const router = express.Router();

// Security: Input validation
const validateCode = (code, language) => {
  if (!code || typeof code !== "string") return "Code is required";
  if (code.length > 10000) return "Code too long (max 10KB)";
  if (!language || !["c", "cpp"].includes(language)) return "Invalid language";

  // Security: Block dangerous patterns
  const dangerous = [
    /system\s*\(/i,
    /exec\s*\(/i,
    /popen\s*\(/i,
    /fork\s*\(/i,
    /#include\s+<unistd\.h>/i,
    /#include\s+<stdlib\.h>/i,
    /remove\s*\(/i,
    /unlink\s*\(/i,
    /open\s*\(/i,
    /socket\s*\(/i,
    /connect\s*\(/i,
  ];

  for (const pattern of dangerous) {
    if (pattern.test(code)) {
      return "Code contains forbidden system calls";
    }
  }

  return null;
};

// Get questions by language
router.get(
  "/questions/:language",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const { language } = req.params;

      if (!["c", "cpp"].includes(language)) {
        return res.status(400).json({ error: "Invalid language" });
      }

      const result = await pool.query(
        "SELECT id, title, description, starter_code, language FROM questions WHERE language = $1 ORDER BY id",
        [language],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// Compile and run code
router.post(
  "/compile",
  verifyToken,
  requireRole("student"),
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

      // Validate inputs
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
        [studentId, question_id, code, language, req.ip],
      );

      res.json({ success: true, submission: result.rows[0] });
    } catch (err) {
      next(err);
    }
  },
);

// Submit code
router.post(
  "/submit",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const { question_id, code, language } = req.body;
      const studentId = req.user.userId;

      // Validate inputs
      if (!question_id || isNaN(question_id)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }

      const error = validateCode(code, language);
      if (error) {
        return res.status(400).json({ error });
      }

      const result = await pool.query(
        `INSERT INTO submissions (student_id, question_id, code, language, status, ip_address)
             VALUES ($1, $2, $3, $4, 'submitted', $5)
             ON CONFLICT (student_id, question_id) 
             DO UPDATE SET code = $3, status = 'submitted', submitted_at = CURRENT_TIMESTAMP
             RETURNING *`,
        [studentId, question_id, code, language, req.ip],
      );

      res.json({ success: true, submission: result.rows[0] });
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
