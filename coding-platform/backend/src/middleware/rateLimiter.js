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
    // Key by user ID if authenticated, otherwise by IP
    keyGenerator: (req) => {
      if (req.user && req.user.userId) {
        return `user:${req.user.userId}`;
      }
      return `ip:${req.ip}`;
    },
    // Skip rate limiting for teachers (they need more access)
    skip: (req) => {
      return req.user && req.user.role === "teacher";
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

// General API rate limiter
const apiLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
});

// Stricter limit for code execution (expensive operation)
const codeExecutionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 code runs per minute
  message: "Code execution limit reached. Please wait before running again.",
});

// Stricter limit for submissions
const submissionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 submissions per minute
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
