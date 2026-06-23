const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const teacherRoutes = require("./routes/teacher");

const app = express();

// Security: Trust proxy if behind reverse proxy
app.set("trust proxy", 1);

// Security: Helmet headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Security: CORS - restrict to frontend only
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Security: Rate limiting for all routes
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Security: Stricter rate limit for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT) || 5,
  message: {
    error: "Too many login attempts, please try again after 15 minutes.",
  },
  skipSuccessfulRequests: true,
});
app.use("/api/auth/login", loginLimiter);

// Security: Body parser with limits
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Security: Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Security: Data sanitization against XSS
app.use(xss());

// Security: Prevent parameter pollution
app.use(hpp());

// Security: Add timestamp to requests
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);

// Health check (no auth needed)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: req.requestTime,
    environment: process.env.NODE_ENV,
  });
});

// Security: Handle 404
app.all("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Security: Global error handler (no stack traces in production)
app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  const isDev = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: err.status ? err.message : "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`=================================`);
});
