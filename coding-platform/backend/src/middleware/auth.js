const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// Maps each semester to the single programming language it is allowed to use.
// Semester I -> C, Semester II -> C++
const SEMESTER_LANGUAGE = { I: "c", II: "cpp" };

// Blocks any request whose :language param or body.language does not match
// the language assigned to the logged-in user's semester.
// e.g. a Semester I (C) student can never touch Semester II (C++) content.
const requireSemesterLanguage = (req, res, next) => {
  const allowedLanguage = SEMESTER_LANGUAGE[req.user.semester];

  if (!allowedLanguage) {
    return res
      .status(403)
      .json({ error: "No semester assigned to this account" });
  }

  const requestedLanguage = req.params.language || req.body.language;

  if (requestedLanguage && requestedLanguage !== allowedLanguage) {
    return res.status(403).json({
      error: `Semester ${req.user.semester} students can only use ${allowedLanguage.toUpperCase()}.`,
    });
  }

  next();
};

module.exports = {
  verifyToken,
  requireRole,
  requireSemesterLanguage,
  SEMESTER_LANGUAGE,
};
