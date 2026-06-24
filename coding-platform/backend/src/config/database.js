const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum 20 connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout after 5s
  // Connection retry logic
  application_name: "coding_platform",
});

// Health check with retry
const checkConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query(
        "SELECT NOW() as time, version() as version",
      );
      console.log(`✅ Database connected: ${result.rows[0].time}`);
      console.log(`📦 PostgreSQL: ${result.rows[0].version.split(" ")[0]}`);
      return true;
    } catch (err) {
      console.error(
        `❌ DB connection attempt ${i + 1}/${retries} failed:`,
        err.message,
      );
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1))); // Exponential backoff
      }
    }
  }
  throw new Error("Failed to connect to database after multiple attempts");
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing database pool...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing database pool...");
  await pool.end();
  process.exit(0);
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

// Initial connection check
checkConnection().catch((err) => {
  console.error("Fatal: Could not connect to database:", err.message);
  process.exit(1);
});

module.exports = pool;
