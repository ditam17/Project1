const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const pool = require("../config/database");

const router = express.Router();

// GET /api/teacher/stats - Dashboard statistics
router.get(
  "/stats",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const totalStudents = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'student'",
      );
      const totalQuestions = await pool.query(
        "SELECT COUNT(*) FROM questions WHERE is_active = true",
      );
      const totalSubmissions = await pool.query(
        "SELECT COUNT(*) FROM submissions WHERE status = 'submitted'",
      );
      const avgScore = await pool.query(
        `SELECT AVG(score) as avg_score FROM submissions WHERE status = 'submitted'`,
      );

      res.json({
        totalStudents: parseInt(totalStudents.rows[0].count),
        totalQuestions: parseInt(totalQuestions.rows[0].count),
        totalSubmissions: parseInt(totalSubmissions.rows[0].count),
        averageScore: parseFloat(avgScore.rows[0].avg_score || 0).toFixed(2),
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/teacher/students - List all students with progress
router.get(
  "/students",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT u.id, u.login_id, u.name, u.created_at, u.last_login,
        COUNT(DISTINCT s.question_id) as attempted_count,
        COALESCE(SUM(s.score), 0) as total_score,
        COUNT(DISTINCT q.id) as total_questions
      FROM users u
      LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'submitted'
      LEFT JOIN questions q ON q.is_active = true
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY total_score DESC`,
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/teacher/student/:id/submissions - Get a student's submissions
router.get(
  "/student/:id/submissions",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const studentId = req.params.id;
      const result = await pool.query(
        `SELECT s.*, q.title as question_title, q.points as total_points,
        (SELECT json_agg(t.*) FROM test_results t WHERE t.submission_id = s.id) as test_results
      FROM submissions s
      JOIN questions q ON s.question_id = q.id
      WHERE s.student_id = $1
      ORDER BY s.submitted_at DESC`,
        [studentId],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/teacher/submissions/:question_id - All submissions for a question
router.get(
  "/submissions/:question_id",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const { question_id } = req.params;
      const result = await pool.query(
        `SELECT s.*, u.name as student_name, u.login_id,
        q.title as question_title, q.points as total_points
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN questions q ON s.question_id = q.id
      WHERE s.question_id = $1 AND s.status = 'submitted'
      ORDER BY s.score DESC, s.execution_time_ms ASC`,
        [question_id],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/teacher/questions - List all questions (teacher view)
router.get(
  "/questions",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT q.*, u.name as creator_name,
        (SELECT COUNT(*) FROM submissions s WHERE s.question_id = q.id AND s.status = 'submitted') as submission_count,
        (SELECT AVG(s.score) FROM submissions s WHERE s.question_id = q.id AND s.status = 'submitted') as avg_score
      FROM questions q
      LEFT JOIN users u ON q.created_by = u.id
      ORDER BY q.id`,
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/teacher/questions - Create a new question
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

      if (!title || !description || !language || !test_cases) {
        return res
          .status(400)
          .json({
            error: "Title, description, language, and test_cases are required",
          });
      }

      const result = await pool.query(
        `INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          title,
          description,
          language,
          starter_code || "",
          JSON.stringify(test_cases),
          time_limit || 2,
          memory_limit || 64,
          points || 10,
          req.user.userId,
        ],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/teacher/questions/:id - Update a question
router.put(
  "/questions/:id",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        language,
        starter_code,
        test_cases,
        time_limit,
        memory_limit,
        points,
        is_active,
      } = req.body;

      const result = await pool.query(
        `UPDATE questions SET title = $1, description = $2, language = $3, starter_code = $4,
       test_cases = $5, time_limit = $6, memory_limit = $7, points = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
        [
          title,
          description,
          language,
          starter_code,
          JSON.stringify(test_cases),
          time_limit,
          memory_limit,
          points,
          is_active,
          id,
        ],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/teacher/questions/:id - Delete a question
router.delete(
  "/questions/:id",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM questions WHERE id = $1", [id]);
      res.json({ success: true, message: "Question deleted" });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/teacher/plagiarism/:question_id - Plagiarism check for all students
router.get(
  "/plagiarism/:question_id",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const { question_id } = req.params;
      const result = await pool.query(
        `SELECT s1.student_id as student1_id, u1.name as student1_name,
        s2.student_id as student2_id, u2.name as student2_name,
        similarity(s1.code, s2.code) as similarity_score
      FROM submissions s1
      JOIN submissions s2 ON s1.question_id = s2.question_id AND s1.student_id < s2.student_id
      JOIN users u1 ON s1.student_id = u1.id
      JOIN users u2 ON s2.student_id = u2.id
      WHERE s1.question_id = $1 AND s1.status = 'submitted' AND s2.status = 'submitted'
      ORDER BY similarity_score DESC
      LIMIT 50`,
        [question_id],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
