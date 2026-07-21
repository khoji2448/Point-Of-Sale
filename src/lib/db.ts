import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined in .env");
}

const caPath = path.join(process.cwd(), "ca.pem");
const sslConfig = fs.existsSync(caPath)
  ? { rejectUnauthorized: true, ca: fs.readFileSync(caPath, "utf-8") }
  : false;

// pg reads sslmode from the connection string and it overrides the ssl object
// above; strip it so our CA-based config is the one that's actually used.
const connectionString = process.env.DATABASE_URL!.replace(/[?&]sslmode=[^&]*/, "");

// Reuse one pool across hot reloads / re-imports so we don't spawn a new pool
// (and a fresh batch of connections) on every save and blow past Aiven's cap.
const g = globalThis as unknown as { pgPool?: Pool };

export const pool =
  g.pgPool ??
  new Pool({
    connectionString,
    ssl: sslConfig,
    max: 5, // stay well under Aiven free-tier's ~20 connection cap
    idleTimeoutMillis: 10_000, // release idle backends quickly
    connectionTimeoutMillis: 5_000,
  });

if (!g.pgPool) {
  g.pgPool = pool;
  pool.connect()
    .then((c) => { c.release(); console.log("✅ Database connected"); })
    .catch((err) => console.error("❌ Database connection error", err));
}
