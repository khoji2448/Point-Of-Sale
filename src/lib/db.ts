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
  ? { rejectUnauthorized: false, ca: fs.readFileSync(caPath, "utf-8") }
  : false;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});

pool.connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ Database connection error", err));
