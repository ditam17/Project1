const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const pool = require("../config/database");
const router = express.Router();

// Get all students with submission status and scores
router.get(
  "/students",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT 
          u.id,
          u.login_id,
          u.name,
          u.created_at,
          u.last_login,
          COUNT(DISTINCT q.id) as total_questions,
          COUNT(DISTINCT s.question_id) as attempted_count,
          COALESCE(SUM(DISTINCT s.score), 0) as total_score,
          COALESCE(AVG(s.score), 0) as average_score
         FROM users u
         LEFT JOIN questions q ON q.is_active = true
         LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'submitted'
         WHERE u.role = 'student'
         GROUP BY u.id, u.login_id, u.name, u.created_at, u.last_login
         ORDER BY u.name`,
      );

      const students = result.rows.map((s) => ({
        ...s,
        total_questions: parseInt(s.total_questions),
        attempted_count: parseInt(s.attempted_count),
        total_score: parseInt(s.total_score) || 0,
        average_score: parseFloat(s.average_score) || 0,
        completion_rate:
          s.total_questions > 0
            ? Math.round(
                (parseInt(s.attempted_count) / parseInt(s.total_questions)) *
                  100,
              )
            : 0,
        status:
          parseInt(s.attempted_count) >= parseInt(s.total_questions)
            ? "completed"
            : "pending",
      }));

      res.json({
        total: students.length,
        completed: students.filter((s) => s.status === "completed"),
        pending: students.filter((s) => s.status === "pending"),
        students,
      });
    } catch (err) {
      next(err);
    }
  },
);

// Get class analytics
router.get(
  "/analytics",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      // Overall class stats
      const classStats = await pool.query(
        `SELECT 
          COUNT(DISTINCT u.id) as total_students,
          COUNT(DISTINCT s.student_id) as active_students,
          COALESCE(AVG(s.score), 0) as class_average,
          COALESCE(MAX(s.score), 0) as highest_score,
          COALESCE(MIN(s.score), 0) as lowest_score
         FROM users u
         LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'submitted'
         WHERE u.role = 'student'`,
      );

      // Per-question stats
      const questionStats = await pool.query(
        `SELECT 
          q.id,
          q.title,
          q.language,
          q.points,
          COUNT(DISTINCT s.student_id) as attempts,
          COALESCE(AVG(s.score), 0) as average_score,
          COALESCE(MAX(s.score), 0) as max_score,
          COUNT(DISTINCT CASE WHEN s.score = q.points THEN s.student_id END) as perfect_submissions
         FROM questions q
         LEFT JOIN submissions s ON s.question_id = q.id AND s.status = 'submitted'
         WHERE q.is_active = true
         GROUP BY q.id, q.title, q.language, q.points
         ORDER BY q.id`,
      );

      // Recent activity
      const recentActivity = await pool.query(
        `SELECT 
          u.name as student_name,
          q.title as question_title,
          s.score,
          s.status,
          s.submitted_at,
          s.execution_time_ms
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         JOIN questions q ON s.question_id = q.id
         ORDER BY s.submitted_at DESC
         LIMIT 20`,
      );

      res.json({
        class: classStats.rows[0],
        questions: questionStats.rows,
        recentActivity: recentActivity.rows,
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
        `SELECT id, title, language, points, is_active, created_at,
          (SELECT COUNT(*) FROM submissions WHERE question_id = questions.id) as submission_count
         FROM questions 
         ORDER BY id`,
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// Create new question
router.post(
  "/questions",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        language,
        starter_code,
        test_cases,
        time_limit,
        memory_limit,
        points,
      } = req.body;
      const teacherId = req.user.userId;

      const result = await pool.query(
        `INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          title,
          description,
          language,
          starter_code,
          JSON.stringify(test_cases || []),
          time_limit || 2,
          memory_limit || 64,
          points || 10,
          teacherId,
        ],
      );

      res.json({ success: true, question: result.rows[0] });
    } catch (err) {
      next(err);
    }
  },
);

// Toggle question active status
router.patch(
  "/questions/:id/toggle",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `UPDATE questions SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [id],
      );
      res.json({ success: true, question: result.rows[0] });
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

      if (
        !student_id ||
        isNaN(student_id) ||
        !question_id ||
        isNaN(question_id)
      ) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      const result = await pool.query(
        `SELECT s.*, q.title, q.description, q.test_cases, u.name as student_name,
          (SELECT json_agg(t.*) FROM test_results t WHERE t.submission_id = s.id) as test_results
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

// Get all submissions for a student
router.get(
  "/submissions/:student_id",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const { student_id } = req.params;

      const result = await pool.query(
        `SELECT s.*, q.title as question_title, q.points as total_points,
          (SELECT json_agg(t.*) FROM test_results t WHERE t.submission_id = s.id) as test_results
         FROM submissions s
         JOIN questions q ON s.question_id = q.id
         WHERE s.student_id = $1
         ORDER BY s.submitted_at DESC`,
        [student_id],
      );

      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// Get submission audit log
router.get(
  "/audit-log",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT
          s.id,
          u.name as student_name,
          u.login_id,
          q.title as question_title,
          s.status,
          s.score,
          s.submitted_at,
          s.ip_address,
          s.execution_time_ms
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         JOIN questions q ON s.question_id = q.id
         ORDER BY s.submitted_at DESC
         LIMIT 100`,
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
