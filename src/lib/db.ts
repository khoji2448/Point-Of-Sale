import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined in .env");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync(path.join(process.cwd(), "ca.pem"), "utf-8"),
  },
});

pool.connect()
  .then(() => console.log("✅ Database connected to Aiven"))
  .catch((err) => console.error("❌ Database connection error", err));
