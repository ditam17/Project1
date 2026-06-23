const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const pool = require("../config/database");
const router = express.Router();

// Get all students with submission status
router.get(
  "/students",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const totalQResult = await pool.query(
        "SELECT COUNT(*) as count FROM questions",
      );
      const totalQuestions = parseInt(totalQResult.rows[0].count);

      const result = await pool.query(
        `
            SELECT 
                u.id,
                u.login_id,
                u.name,
                $1 as total_questions,
                COALESCE(sub.solved_count, 0) as solved_count
            FROM users u
            LEFT JOIN (
                SELECT student_id, COUNT(*) as solved_count 
                FROM submissions 
                WHERE status = 'submitted'
                GROUP BY student_id
            ) sub ON u.id = sub.student_id
            WHERE u.role = 'student'
            ORDER BY u.name
        `,
        [totalQuestions],
      );

      const students = result.rows.map((s) => ({
        ...s,
        total_questions: parseInt(s.total_questions),
        solved_count: parseInt(s.solved_count),
        status:
          parseInt(s.solved_count) >= parseInt(s.total_questions)
            ? "completed"
            : "pending",
      }));

      res.json({
        completed: students.filter((s) => s.status === "completed"),
        pending: students.filter((s) => s.status === "pending"),
      });
    } catch (err) {
      next(err);
    }
  },
);

// Get all questions
router.get(
  "/questions",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        "SELECT id, title, language FROM questions ORDER BY id",
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// Get specific student's submission
router.get(
  "/submission/:student_id/:question_id",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const { student_id, question_id } = req.params;

      // Validate IDs
      if (
        !student_id ||
        isNaN(student_id) ||
        !question_id ||
        isNaN(question_id)
      ) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      const result = await pool.query(
        `SELECT s.*, q.title, q.description, u.name as student_name 
             FROM submissions s
             JOIN questions q ON s.question_id = q.id
             JOIN users u ON s.student_id = u.id
             WHERE s.student_id = $1 AND s.question_id = $2`,
        [student_id, question_id],
      );

      res.json(result.rows[0] || null);
    } catch (err) {
      next(err);
    }
  },
);

// Security: Get submission audit log (who submitted what when)
router.get(
  "/audit-log",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const result = await pool.query(`
            SELECT 
                s.id,
                u.name as student_name,
                u.login_id,
                q.title as question_title,
                s.status,
                s.submitted_at,
                s.ip_address
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            JOIN questions q ON s.question_id = q.id
            ORDER BY s.submitted_at DESC
            LIMIT 100
        `);
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
