const express = require("express");
const {
  verifyToken,
  requireRole,
  SEMESTER_LANGUAGE,
} = require("../middleware/auth");
const pool = require("../config/database");

const router = express.Router();

// Every route below is scoped to the logged-in teacher's own semester.
// A Semester I teacher only ever sees Semester I students and C questions;
// a Semester II teacher only ever sees Semester II students and C++
// questions. req.user.semester comes from the verified JWT, so this can't
// be spoofed by the client.
const languageFor = (req, res) => {
  const language = SEMESTER_LANGUAGE[req.user.semester];
  if (!language) {
    res.status(403).json({ error: "No semester assigned to this account" });
    return null;
  }
  return language;
};

// GET /api/teacher/stats - Dashboard statistics (scoped to teacher's semester)
router.get(
  "/stats",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = languageFor(req, res);
      if (!language) return;

      const totalStudents = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'student' AND semester = $1",
        [req.user.semester],
      );
      const totalQuestions = await pool.query(
        "SELECT COUNT(*) FROM questions WHERE is_active = true AND language = $1",
        [language],
      );
      const totalSubmissions = await pool.query(
        `SELECT COUNT(*) FROM submissions s
         JOIN questions q ON q.id = s.question_id
         WHERE s.status = 'submitted' AND q.language = $1`,
        [language],
      );
      const avgScore = await pool.query(
        `SELECT AVG(s.score) as avg_score FROM submissions s
         JOIN questions q ON q.id = s.question_id
         WHERE s.status = 'submitted' AND q.language = $1`,
        [language],
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

// GET /api/teacher/analytics - Frontend expects this endpoint (scoped)
router.get(
  "/analytics",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = languageFor(req, res);
      if (!language) return;

      const totalStudents = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'student' AND semester = $1",
        [req.user.semester],
      );
      const totalQuestions = await pool.query(
        "SELECT COUNT(*) FROM questions WHERE is_active = true AND language = $1",
        [language],
      );
      const totalSubmissions = await pool.query(
        `SELECT COUNT(*) FROM submissions s
         JOIN questions q ON q.id = s.question_id
         WHERE s.status = 'submitted' AND q.language = $1`,
        [language],
      );
      const avgScore = await pool.query(
        `SELECT AVG(s.score) as avg_score FROM submissions s
         JOIN questions q ON q.id = s.question_id
         WHERE s.status = 'submitted' AND q.language = $1`,
        [language],
      );
      const questionsList = await pool.query(
        `SELECT id, title, language, is_active, points,
        (SELECT COUNT(*) FROM submissions s WHERE s.question_id = q.id AND s.status = 'submitted') as submission_count
      FROM questions q WHERE q.language = $1 ORDER BY id`,
        [language],
      );

      res.json({
        class: {
          totalStudents: parseInt(totalStudents.rows[0].count),
          totalQuestions: parseInt(totalQuestions.rows[0].count),
          totalSubmissions: parseInt(totalSubmissions.rows[0].count),
          averageScore: parseFloat(avgScore.rows[0].avg_score || 0).toFixed(2),
        },
        questions: questionsList.rows,
        recentActivity: [],
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/teacher/students - Returns { students, completed, pending }
// Only students in the teacher's own semester, only counting questions
// in that semester's language.
router.get(
  "/students",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = languageFor(req, res);
      if (!language) return;

      const result = await pool.query(
        `SELECT u.id, u.login_id, u.name, u.created_at, u.last_login,
        COUNT(DISTINCT s.question_id) as attempted_count,
        COALESCE(SUM(s.score), 0) as total_score,
        COUNT(DISTINCT q.id) as total_questions,
        COALESCE(AVG(s.score), 0) as average_score,
        CASE WHEN COUNT(DISTINCT s.question_id) = COUNT(DISTINCT q.id) THEN 'completed' ELSE 'pending' END as status
      FROM users u
      LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'submitted'
        AND s.question_id IN (SELECT id FROM questions WHERE language = $1 AND is_active = true)
      LEFT JOIN questions q ON q.is_active = true AND q.language = $1
      WHERE u.role = 'student' AND u.semester = $2
      GROUP BY u.id
      ORDER BY total_score DESC`,
        [language, req.user.semester],
      );

      const allStudents = result.rows;
      const completed = allStudents.filter((s) => s.status === "completed");
      const pending = allStudents.filter((s) => s.status === "pending");

      res.json({ students: allStudents, completed, pending });
    } catch (err) {
      next(err);
    }
  },
);

// Shared helper: confirm a student belongs to this teacher's semester
// before handing back their submissions. Prevents a Semester I teacher
// from pulling up a Semester II student's submissions by guessing an id.
const assertStudentInScope = async (req, res) => {
  const language = languageFor(req, res);
  if (!language) return null;

  const studentId = req.params.id || req.params.studentId;
  const studentResult = await pool.query(
    "SELECT id, semester FROM users WHERE id = $1 AND role = 'student'",
    [studentId],
  );

  if (studentResult.rows.length === 0) {
    res.status(404).json({ error: "Student not found" });
    return null;
  }

  if (studentResult.rows[0].semester !== req.user.semester) {
    res.status(403).json({ error: "Student is not in your semester" });
    return null;
  }

  return language;
};

// GET /api/teacher/student/:id/submissions
router.get(
  "/student/:id/submissions",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = await assertStudentInScope(req, res);
      if (!language) return;

      const result = await pool.query(
        `SELECT s.*, q.title as question_title, q.points as total_points,
        (SELECT json_agg(t.*) FROM test_results t WHERE t.submission_id = s.id) as test_results
      FROM submissions s JOIN questions q ON s.question_id = q.id
      WHERE s.student_id = $1 AND q.language = $2 ORDER BY s.submitted_at DESC`,
        [req.params.id, language],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/teacher/submissions/:studentId - Alias for frontend compatibility
router.get(
  "/submissions/:studentId",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = await assertStudentInScope(req, res);
      if (!language) return;

      const result = await pool.query(
        `SELECT s.*, q.title as question_title, q.points as total_points,
        (SELECT json_agg(t.*) FROM test_results t WHERE t.submission_id = s.id) as test_results
      FROM submissions s JOIN questions q ON s.question_id = q.id
      WHERE s.student_id = $1 AND q.language = $2 ORDER BY s.submitted_at DESC`,
        [req.params.studentId, language],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/teacher/questions - only this semester's language
router.get(
  "/questions",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = languageFor(req, res);
      if (!language) return;

      const result = await pool.query(
        `SELECT q.*, u.name as creator_name,
        (SELECT COUNT(*) FROM submissions s WHERE s.question_id = q.id AND s.status = 'submitted') as submission_count,
        (SELECT AVG(s.score) FROM submissions s WHERE s.question_id = q.id AND s.status = 'submitted') as avg_score
      FROM questions q LEFT JOIN users u ON q.created_by = u.id
      WHERE q.language = $1 ORDER BY q.id`,
        [language],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

// Shared helper: confirm a question belongs to this teacher's semester
// language before letting them edit/toggle/delete/inspect it.
const assertQuestionInScope = async (req, res, questionId) => {
  const language = languageFor(req, res);
  if (!language) return null;

  const q = await pool.query(
    "SELECT id, language FROM questions WHERE id = $1",
    [questionId],
  );

  if (q.rows.length === 0) {
    res.status(404).json({ error: "Question not found" });
    return null;
  }

  if (q.rows[0].language !== language) {
    res.status(403).json({
      error: `You can only manage ${language.toUpperCase()} questions.`,
    });
    return null;
  }

  return language;
};

// POST /api/teacher/questions - language is forced to the teacher's own
// semester language, regardless of what the client sends in the body.
router.post(
  "/questions",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = languageFor(req, res);
      if (!language) return;

      const {
        title,
        description,
        starter_code,
        test_cases,
        time_limit,
        memory_limit,
        points,
        category,
        chapter, // NEW
      } = req.body;
      if (!title || !description || !test_cases) {
        return res.status(400).json({
          error: "Title, description, and test_cases are required",
        });
      }
      if (
        category !== undefined &&
        !["assignment", "practice"].includes(category)
      ) {
        return res.status(400).json({
          error: "category must be 'assignment' or 'practice'",
        });
      }
      // Optional field — trimmed and length-capped to match the column, so a
      // stray huge string can't blow past VARCHAR(150) with a raw DB error.
      const safeChapter =
        typeof chapter === "string" && chapter.trim()
          ? chapter.trim().slice(0, 150)
          : null;
      const result = await pool.query(
        `INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by, category, chapter)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
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
          category || "assignment",
          safeChapter,
        ],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/teacher/questions/:id
router.put(
  "/questions/:id",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const language = await assertQuestionInScope(req, res, id);
      if (!language) return;

      const {
        title,
        description,
        starter_code,
        test_cases,
        time_limit,
        memory_limit,
        points,
        is_active,
        category,
        chapter, // NEW
      } = req.body;
      if (
        category !== undefined &&
        !["assignment", "practice"].includes(category)
      ) {
        return res.status(400).json({
          error: "category must be 'assignment' or 'practice'",
        });
      }
      const safeChapter =
        chapter === undefined
          ? undefined
          : typeof chapter === "string" && chapter.trim()
            ? chapter.trim().slice(0, 150)
            : null;
      // language column is intentionally left untouched here — a teacher
      // can't move a question into the other semester's language.
      const result = await pool.query(
        `UPDATE questions SET title = $1, description = $2, starter_code = $3,
   test_cases = $4, time_limit = $5, memory_limit = $6, points = $7, is_active = $8,
   category = COALESCE($9, category), chapter = COALESCE($10, chapter), updated_at = CURRENT_TIMESTAMP
   WHERE id = $11 RETURNING *`,
        [
          title,
          description,
          starter_code,
          JSON.stringify(test_cases),
          time_limit,
          memory_limit,
          points,
          is_active,
          category || null,
          safeChapter,
          id,
        ],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ error: "Question not found" });
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/teacher/questions/:id/toggle - Toggle active status
router.patch(
  "/questions/:id/toggle",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = await assertQuestionInScope(req, res, req.params.id);
      if (!language) return;

      const result = await pool.query(
        `UPDATE questions SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [req.params.id],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ error: "Question not found" });
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/teacher/questions/:id
router.delete(
  "/questions/:id",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = await assertQuestionInScope(req, res, req.params.id);
      if (!language) return;

      await pool.query("DELETE FROM questions WHERE id = $1", [req.params.id]);
      res.json({ success: true, message: "Question deleted" });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/teacher/plagiarism/:question_id
router.get(
  "/plagiarism/:question_id",
  verifyToken,
  requireRole("teacher"),
  async (req, res, next) => {
    try {
      const language = await assertQuestionInScope(
        req,
        res,
        req.params.question_id,
      );
      if (!language) return;

      const result = await pool.query(
        `SELECT s1.student_id as student1_id, u1.name as student1_name,
        s2.student_id as student2_id, u2.name as student2_name,
        similarity(s1.code, s2.code) as similarity_score
      FROM submissions s1 JOIN submissions s2 ON s1.question_id = s2.question_id AND s1.student_id < s2.student_id
      JOIN users u1 ON s1.student_id = u1.id JOIN users u2 ON s2.student_id = u2.id
      WHERE s1.question_id = $1 AND s1.status = 'submitted' AND s2.status = 'submitted'
      ORDER BY similarity_score DESC LIMIT 50`,
        [req.params.question_id],
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
