const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const { createServer } = require("http");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const { router: studentRoutes, setupSocketIO } = require("./routes/terminal");
const teacherRoutes = require("./routes/teacher");
const { apiLimiter, loginLimiter } = require("./middleware/rateLimiter");

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          process.env.CORS_ORIGIN || "http://localhost:3000",
          "ws:",
          "wss:",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/", apiLimiter);
app.use("/api/auth/login", loginLimiter);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(mongoSanitize());
app.use(hpp());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    console.log(`[${req.requestTime}] ${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: req.requestTime,
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

app.all("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  const isDev = process.env.NODE_ENV === "development";
  const statusCode = err.status || 500;
  const message = isDev ? err.message : "Internal server error";
  res.status(statusCode).json({
    error: message,
    ...(isDev && { stack: err.stack, details: err }),
  });
});

// Setup Socket.IO for interactive terminal
const io = setupSocketIO(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Socket.IO ready for interactive terminals`);
  console.log(`=================================`);
});

module.exports = app;
