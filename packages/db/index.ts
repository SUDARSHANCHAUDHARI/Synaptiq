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
