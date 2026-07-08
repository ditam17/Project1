const express = require("express");
const {
  verifyToken,
  requireRole,
  SEMESTER_LANGUAGE,
} = require("../middleware/auth");
const pool = require("../config/database");

const router = express.Router();

// Admin has no semester of their own (semester is NULL on their user row) —
// unlike the teacher routes, admin queries deliberately span BOTH
// semesters and are grouped in the response instead of filtered.

// Build the per-semester slice: students + teachers + last_login + basic
// activity counts, scoped to that semester's language.
const buildSemesterData = async (semester) => {
  const language = SEMESTER_LANGUAGE[semester];

  const students = await pool.query(
    `SELECT u.id, u.login_id, u.name, u.last_login, u.created_at,
      COUNT(DISTINCT s.question_id) as attempted_count,
      COALESCE(SUM(s.score), 0) as total_score,
      (SELECT COUNT(*) FROM questions WHERE language = $1 AND is_active = true) as total_questions
    FROM users u
    LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'submitted'
      AND s.question_id IN (SELECT id FROM questions WHERE language = $1 AND is_active = true)
    WHERE u.role = 'student' AND u.semester = $2
    GROUP BY u.id
    ORDER BY u.name`,
    [language, semester],
  );

  const teachers = await pool.query(
    `SELECT u.id, u.login_id, u.name, u.last_login, u.created_at,
      (SELECT COUNT(*) FROM questions WHERE created_by = u.id) as questions_created,
      (SELECT COUNT(*) FROM submissions s JOIN questions q ON q.id = s.question_id
        WHERE q.language = $1 AND s.status = 'submitted') as submissions_reviewed_pool
    FROM users u
    WHERE u.role = 'teacher' AND u.semester = $2
    ORDER BY u.name`,
    [language, semester],
  );

  return {
    language,
    students: students.rows,
    teachers: teachers.rows,
  };
};

// GET /api/admin/overview - students + teachers grouped by semester,
// each with last_login and basic activity counts.
router.get(
  "/overview",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const [semesterI, semesterII] = await Promise.all([
        buildSemesterData("I"),
        buildSemesterData("II"),
      ]);

      const totalStudents = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'student'",
      );
      const totalTeachers = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'teacher'",
      );
      const totalQuestions = await pool.query(
        "SELECT COUNT(*) FROM questions WHERE is_active = true",
      );
      const totalSubmissions = await pool.query(
        "SELECT COUNT(*) FROM submissions WHERE status = 'submitted'",
      );

      res.json({
        semesters: {
          I: semesterI,
          II: semesterII,
        },
        stats: {
          totalStudents: parseInt(totalStudents.rows[0].count),
          totalTeachers: parseInt(totalTeachers.rows[0].count),
          totalQuestions: parseInt(totalQuestions.rows[0].count),
          totalSubmissions: parseInt(totalSubmissions.rows[0].count),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/admin/students/:id/submissions - drill-down into one student's
// activity. Admin isn't semester-scoped, so no ownership check beyond
// "this id is actually a student" is needed here.
router.get(
  "/students/:id/submissions",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const studentCheck = await pool.query(
        "SELECT id, name, semester FROM users WHERE id = $1 AND role = 'student'",
        [req.params.id],
      );
      if (studentCheck.rows.length === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      const result = await pool.query(
        `SELECT s.*, q.title as question_title, q.language, q.points as total_points,
        (SELECT json_agg(t.*) FROM test_results t WHERE t.submission_id = s.id) as test_results
      FROM submissions s JOIN questions q ON s.question_id = q.id
      WHERE s.student_id = $1 ORDER BY s.submitted_at DESC`,
        [req.params.id],
      );

      res.json({ student: studentCheck.rows[0], submissions: result.rows });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/admin/teachers/:id/questions - drill-down into one teacher's
// created questions.
router.get(
  "/teachers/:id/questions",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const teacherCheck = await pool.query(
        "SELECT id, name, semester FROM users WHERE id = $1 AND role = 'teacher'",
        [req.params.id],
      );
      if (teacherCheck.rows.length === 0) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      const result = await pool.query(
        `SELECT q.*,
        (SELECT COUNT(*) FROM submissions s WHERE s.question_id = q.id AND s.status = 'submitted') as submission_count
      FROM questions q WHERE q.created_by = $1 ORDER BY q.id DESC`,
        [req.params.id],
      );

      res.json({ teacher: teacherCheck.rows[0], questions: result.rows });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
