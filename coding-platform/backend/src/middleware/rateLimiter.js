const rateLimit = require("express-rate-limit");

/**
 * Create a rate limiter with custom key generator
 * Uses user ID when authenticated, falls back to IP
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = "Too many requests, please try again later.",
    skipSuccessfulRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    // FIX: Use x-forwarded-for for IP behind proxies, fallback to req.ip
    keyGenerator: (req) => {
      // Try to get user ID from token if already decoded
      if (req.user && req.user.userId) {
        return `user:${req.user.userId}`;
      }
      // Fallback to IP with proxy support
      const clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.ip ||
        req.connection?.remoteAddress ||
        "unknown";
      return `ip:${clientIp}`;
    },
    // FIX: Don't skip teachers blindly - req.user might not be set yet
    // Instead, skip based on path or use a higher limit
    skip: (req) => {
      // If user is already decoded (e.g., in routes after verifyToken), skip teachers
      if (req.user && req.user.role === "teacher") {
        return true;
      }
      // Don't skip otherwise - let the limit apply
      return false;
    },
    handler: (req, res) => {
      res.status(429).json({
        error: "Too many requests",
        message: message,
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      });
    },
  });
};

// General API rate limiter - INCREASED LIMIT for development
const apiLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200, // Increased from 100
});

// Stricter limit for code execution (expensive operation)
const codeExecutionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "Code execution limit reached. Please wait before running again.",
});

// Stricter limit for submissions
const submissionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Submission limit reached. Please wait before submitting again.",
});

// Login rate limiter (always by IP to prevent brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT) || 5,
  message: {
    error: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many login attempts",
      message: "Please try again after 15 minutes.",
    });
  },
});

module.exports = {
  apiLimiter,
  codeExecutionLimiter,
  submissionLimiter,
  loginLimiter,
  createRateLimiter,
};
