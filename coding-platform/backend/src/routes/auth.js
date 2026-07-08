const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const router = express.Router();

// Security: Input validation helper
const validateLoginInput = (login_id, password) => {
  const errors = [];

  if (!login_id || typeof login_id !== "string") {
    errors.push("Login ID is required");
  } else {
    // Prevent NoSQL injection patterns
    if (login_id.includes("$") || login_id.includes("{")) {
      errors.push("Invalid characters in Login ID");
    }
    // Length check
    if (login_id.length < 3 || login_id.length > 50) {
      errors.push("Login ID must be 3-50 characters");
    }
    // Allow alphanumeric, dots, and underscores (e.g., alisha.suwal, teacher1)
    if (!/^[a-zA-Z0-9_.]+$/.test(login_id)) {
      errors.push(
        "Login ID can only contain letters, numbers, dots, and underscores",
      );
    }
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  } else if (password.length < 6 || password.length > 100) {
    errors.push("Password must be 6-100 characters");
  }

  return errors;
};

// Login with proper password hashing
router.post("/login", async (req, res) => {
  const { login_id, password, role, semester } = req.body;

  if (!login_id || !password || !role) {
    return res
      .status(400)
      .json({ error: "Login ID, password, and role are required" });
  }

  if (!["student", "teacher", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  // Students and teachers must pick a semester before logging in.
  // College Administrators are not tied to a semester.
  if (["student", "teacher"].includes(role)) {
    if (!["I", "II"].includes(semester)) {
      return res
        .status(400)
        .json({ error: "Please select a valid semester (I or II)" });
    }
  }

  // Validate input format
  const validationErrors = validateLoginInput(login_id, password);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(", ") });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE login_id = $1", [
      login_id.trim(),
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check if selected role matches user's actual role
    if (user.role !== role) {
      return res.status(403).json({
        error: `You are registered as a ${user.role}. Please select the correct role.`,
      });
    }

    // Check if selected semester matches user's actual semester
    // (First Semester users cannot log into Second Semester, and vice versa)
    if (["student", "teacher"].includes(role)) {
      // If this account has no semester value at all, the users table
      // most likely hasn't been migrated to the new schema yet (schema.sql
      // needs to be re-run so the semester column exists and is populated).
      if (user.semester === undefined || user.semester === null) {
        console.error(
          `Login blocked: user '${user.login_id}' has no semester value. Has schema.sql been re-run against this database?`,
        );
        return res.status(500).json({
          error:
            "This account has no semester assigned. The database may need the latest schema.sql re-applied.",
        });
      }

      if (user.semester !== semester) {
        const semesterLabel = (s) => (s === "I" ? "First (I)" : "Second (II)");
        return res.status(403).json({
          error: `Please select the correct semester.`,
        });
      }
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login timestamp
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id],
    );

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        name: user.name,
        semester: user.semester,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        login_id: user.login_id,
        name: user.name,
        role: user.role,
        semester: user.semester,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Verify token
router.get("/verify", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ valid: false, error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "coding-platform",
      audience: "coding-platform-users",
    });

    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: "Invalid or expired token" });
  }
});

module.exports = router;
