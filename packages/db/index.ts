import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import "dotenv/config";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

let initPromise: Promise<void> | null = null;

pool.on("error", (error) => {
  console.error("PostgreSQL pool error", error);
});

export async function initDb() {
  if (!initPromise) {
    initPromise = (async () => {
      const schemaPath = path.resolve(__dirname, "schema.sql");
      const schema = await readFile(schemaPath, "utf8");

      await pool.query("SELECT 1");
      await pool.query(schema);
      await pool.query("ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS total_retries INT DEFAULT 0");
      await pool.query("ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP");
      await pool.query("ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS execution_time_ms INT DEFAULT 0");
      await pool.query("ALTER TABLE steps ADD COLUMN IF NOT EXISTS input TEXT NOT NULL DEFAULT ''");
      await pool.query("ALTER TABLE steps ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0");
      await pool.query("ALTER TABLE steps ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()");
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

export async function closeDb() {
  await pool.end();
}
