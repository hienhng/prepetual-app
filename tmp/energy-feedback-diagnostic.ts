import fs from "node:fs/promises";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, statement_timeout: 5000 });
try {
  const { rows } = await pool.query(`
    SELECT quizzes.id, quizzes.title, item.question, quizzes.source_text,
      quizzes.source_images, quizzes.source_image_url,
      quizzes.questions AS quiz_questions
    FROM quizzes CROSS JOIN LATERAL jsonb_array_elements(quizzes.questions) AS item(question)
    WHERE item.question->>'question' ILIKE $1
    ORDER BY quizzes.created_at DESC LIMIT 3`, ["%examples that store energy%"]);
  await fs.writeFile("tmp/energy-feedback-cases.json", JSON.stringify(rows, null, 2));
  console.log(JSON.stringify(rows.map(row => ({ quizId: row.id, title: row.title, question: row.question,
    sourceExcerpt: row.source_text.slice(0, 1800), imageCount: (row.source_images || []).length,
    languageContext: [row.title, ...row.quiz_questions.slice(0, 8).map((q: any) => q.question)].join("\n").slice(0, 2000) })), null, 2));
} catch (error: any) {
  console.error("Diagnostic lookup failed:", error.code || error.name);
  process.exitCode = 1;
} finally { await pool.end(); }
