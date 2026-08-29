import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to enable pgvector.");
}

const pool = new Pool({ connectionString });

try {
  await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
  console.log("pgvector extension is available.");
} finally {
  await pool.end();
}
