import { readFile } from "node:fs/promises";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const migrations = [
  "../migrations/0002_quiz_generation_drafts.sql",
  "../migrations/0003_quiz_generation_drafts_question_limit.sql",
];
try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    for (const migration of migrations) {
      await client.query(await readFile(new URL(migration, import.meta.url), "utf8"));
    }
    await client.query("COMMIT");
    console.log("Quiz generation draft storage is ready (up to 40 questions).");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
