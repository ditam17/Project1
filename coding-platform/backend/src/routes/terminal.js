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
const PDFDocument = require("pdfkit");
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

// Validates student-attached files for the interactive terminal (used to
// back fopen()/ifstream-style file I/O). Caps count and size so a run
// can't be used to smuggle large payloads into the sandbox.
const MAX_ATTACHED_FILES = 5;
const MAX_FILE_BYTES = 64 * 1024; // 64KB per file
const validateFiles = (files) => {
  if (files === undefined || files === null) return null;
  if (!Array.isArray(files)) return "files must be an array";
  if (files.length > MAX_ATTACHED_FILES)
    return `Too many files (max ${MAX_ATTACHED_FILES})`;
  for (const f of files) {
    if (!f || typeof f.name !== "string" || typeof f.content !== "string") {
      return "Each file needs a name and content string";
    }
    if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(f.name)) {
      return `Invalid filename: ${f.name}`;
    }
    if (Buffer.byteLength(f.content, "utf8") > MAX_FILE_BYTES) {
      return `File too large: ${f.name} (max 64KB)`;
    }
  }
  return null;
};

// Socket.IO has no built-in rate limiting, and express-rate-limit only
// covers HTTP routes — codeExecutionLimiter never touches the socket
// 'start' event. Without this, a student can trigger unlimited
// compile+run cycles (each spinning real Docker resources) far faster
// than the REST /compile endpoint allows.
const START_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const START_RATE_LIMIT_MAX = 15;
const socketStartTimestamps = new Map(); // userId -> [timestamps]

const isSocketStartRateLimited = (userId) => {
  const now = Date.now();
  const windowStart = now - START_RATE_LIMIT_WINDOW_MS;
  const timestamps = (socketStartTimestamps.get(userId) || []).filter(
    (t) => t > windowStart,
  );
  timestamps.push(now);
  socketStartTimestamps.set(userId, timestamps);
  return timestamps.length > START_RATE_LIMIT_MAX;
};

// Periodic cleanup so this map doesn't grow unbounded across many users.
setInterval(
  () => {
    const cutoff = Date.now() - START_RATE_LIMIT_WINDOW_MS;
    for (const [userId, timestamps] of socketStartTimestamps) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) socketStartTimestamps.delete(userId);
      else socketStartTimestamps.set(userId, fresh);
    }
  },
  5 * 60 * 1000,
);

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
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "coding-platform",
        audience: "coding-platform-users",
      });
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
      const { code, language, files } = data;
      if (socket.user.role !== "student") {
        socket.emit("error", { message: "Only students can use the terminal" });
        return;
      }
      if (isSocketStartRateLimited(socket.user.userId)) {
        socket.emit("error", {
          message:
            "You're running code too frequently. Please wait a moment before trying again.",
        });
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
      const fileError = validateFiles(files);
      if (fileError) {
        socket.emit("error", { message: fileError });
        return;
      }
      // Reuse the existing container when possible instead of tearing it
      // down and paying full `docker run` cost on every Run click — this
      // is the actual latency win. startSession() falls back to a fresh
      // container automatically if the language changed or the previous
      // one died.
      const result = await InteractiveTerminalService.startSession(
        code,
        language,
        currentSessionId,
        files,
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
        (exitCode, fileOutputs) => {
          socket.emit("exit", { code: exitCode, files: fileOutputs || [] });
          // currentSessionId deliberately stays set here — the program
          // exiting doesn't mean the container did. Only kill/disconnect/
          // language-switch actually tear the container down, so keeping
          // this set is what lets the next Run reuse the warm container.
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
      // Only the first test case is exposed to students, as a worked
      // sample — enough to self-test the expected input/output format
      // before submitting, without leaking every official test case (the
      // rest stay server-side and are still used in full by
      // BatchExecutionService at grading time).
      const result = await pool.query(
        `SELECT id, title, description, starter_code, language, points, time_limit, memory_limit, category, test_cases->0 as sample_test_case
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
      const language = SEMESTER_LANGUAGE[req.user.semester];
      if (!language) {
        return res
          .status(403)
          .json({ error: "No semester assigned to this account" });
      }

      const result = await pool.query(
        `SELECT COUNT(DISTINCT s.question_id) as solved_count, COALESCE(SUM(s.score), 0) as total_score,
         (SELECT COUNT(*) FROM questions WHERE language = $2 AND is_active = true) as total_questions
         FROM users u
         LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'submitted'
           AND s.question_id IN (SELECT id FROM questions WHERE language = $2 AND is_active = true)
         WHERE u.id = $1
         GROUP BY u.id`,
        [studentId, language],
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

// GET /api/student/submissions/pdf - downloads every submitted program
// (code + output) as one multi-page PDF. Only the logged-in student's own
// submissions — studentId comes from the verified JWT, never from a query
// param, so this can't be used to pull anyone else's work.
router.get(
  "/submissions/pdf",
  verifyToken,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const studentId = req.user.userId;

      // terminal_output is the actual interactive session the student typed
      // and saw before submitting (their typed input, interleaved with the
      // program's real stdout/stderr, in order) — this is what the PDF
      // should show, not the auto-grading test_results (those reflect the
      // official test cases run at submit time, which the student never
      // saw in their own terminal).
      const result = await pool.query(
        `SELECT s.code, s.submitted_at, s.terminal_output, q.title
         FROM submissions s
         JOIN questions q ON q.id = s.question_id
         WHERE s.student_id = $1 AND s.status IN ('submitted', 'graded')
         ORDER BY s.submitted_at ASC`,
        [studentId],
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "No submitted programs to export yet" });
      }

      const studentName = req.user.name || "student";
      const filename = `submissions_${studentName.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      // The raw transcript also contains client-side terminal "chrome" —
      // the compiling/started/exited banners and the box-drawing separator
      // lines. Those are emoji/unicode-box characters with no glyph in
      // PDFKit's standard Courier font (hence the garbled bytes), and
      // they aren't actual input/output anyway — strip them so only what
      // the student actually typed and saw as program output remains.
      const extractIO = (raw) => {
        if (!raw) return "";
        return raw
          .split("\n")
          .filter((line) => {
            const t = line.trim();
            if (t === "") return false;
            if (/^[─-]+$/.test(t)) return false;
            if (/compiling and starting program/i.test(t)) return false;
            if (/program started/i.test(t)) return false;
            if (/program exited with code/i.test(t)) return false;
            if (/^connection error/i.test(t)) return false;
            if (/^error:/i.test(t)) return false;
            return true;
          })
          .join("\n");
      };

      const doc = new PDFDocument({ margin: 40, bufferPages: true });
      doc.on("error", (err) => {
        // The response may already be partially streamed at this point, so
        // we can't send a JSON error — just end the stream and log it.
        console.error("PDF generation error:", err);
        res.end();
      });
      doc.pipe(res);

      const CONTENT_WIDTH = 515;

      // Windows-style CRLF (\r\n) line endings — common from copy-paste or
      // browser textarea handling — leave a stray \r in the text stream.
      // pdfkit's standard fonts have no glyph for a bare carriage-return
      // control character, so it renders as garbage (e.g. "Ð") instead of
      // just being invisible. Normalizing to \n before rendering fixes it.
      const cleanText = (str) =>
        (str ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      // .rect()/.fill() don't auto-paginate the way .text() does, so a box
      // that would run past the bottom margin needs a manual page break
      // *before* it's drawn — otherwise it silently clips or bleeds onto
      // the next page without the black fill following it.
      const drawTerminalBox = (text) => {
        const padding = 10;
        doc.font("Courier").fontSize(9);
        const textHeight = doc.heightOfString(text, {
          width: CONTENT_WIDTH - padding * 2,
        });
        const boxHeight = textHeight + padding * 2;
        const remaining = doc.page.height - doc.page.margins.bottom - doc.y;
        if (boxHeight > remaining) doc.addPage();

        const y = doc.y;
        doc.rect(doc.x, y, CONTENT_WIDTH, boxHeight).fill("#000000");
        doc
          .fillColor("#FFFF00") // terminal-yellow, readable on black
          .font("Courier")
          .fontSize(9)
          .text(text, doc.x + padding, y + padding, {
            width: CONTENT_WIDTH - padding * 2,
          });
        doc.y = y + boxHeight + 10;
      };

      result.rows.forEach((sub, idx) => {
        if (idx > 0) doc.addPage();

        doc
          .font("Helvetica-Bold")
          .fontSize(15)
          .fillColor("#111")
          .text(`${idx + 1}. ${sub.title}`);
        doc.moveDown(0.6);

        doc.font("Helvetica-Bold").fontSize(11).fillColor("#111").text("Code");
        doc.moveDown(0.15);
        doc
          .font("Courier")
          .fontSize(9)
          .fillColor("#000")
          .text(cleanText(sub.code) || "(empty)", { width: CONTENT_WIDTH });
        doc.moveDown(0.6);

        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor("#111")
          .text("Terminal Output");
        doc.moveDown(0.2);

        drawTerminalBox(
          extractIO(cleanText(sub.terminal_output)) ||
            "(no input/output recorded)",
        );
      });

      doc.end();
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
