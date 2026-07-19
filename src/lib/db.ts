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

export const pool = new Pool({
  connectionString,
  ssl: sslConfig,
});

pool.connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ Database connection error", err));
