import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";
import type { Question } from "../shared/schema.js";

// Requires an explicit test URL. Temporary tables isolate fixtures from application data.
test("dashboard loading queries against PostgreSQL", {
  skip: !process.env.LOADING_TEST_DATABASE_URL,
}, async t => {
  process.env.DATABASE_URL ||= process.env.LOADING_TEST_DATABASE_URL;
  const { db } = await import("./db.js");
  const { storage } = await import("./storage.js");
  const pool = new pg.Pool({ connectionString: process.env.LOADING_TEST_DATABASE_URL });
  const client = await pool.connect();
  const queries: string[] = [];
  t.mock.method(db.$client, "query", (...args: any[]) => {
    queries.push(typeof args[0] === "string" ? args[0] : args[0].text);
    return (client.query as any)(...args);
  });
  const questions: Question[] = Array.from({ length: 8 }, (_, index) => ({
    id: `q${index}`, type: "multiple_choice", question: `Question ${index}`,
    options: ["A", "B"], correctAnswer: "A",
  }));
  async function quiz(id: string, userId = "owner", isPublic = 0, items = questions) {
    await client.query(`INSERT INTO quizzes (id, user_id, title, source_text, questions, is_public)
      VALUES ($1, $2, $5, 'Large source document', $3, $4)`, [id, userId, JSON.stringify(items), isPublic, id]);
  }
  async function attempt(id: string) {
    await client.query("INSERT INTO quiz_results (quiz_id, user_id) VALUES ($1, 'owner')", [id]);
  }
  try {
    await client.query(`CREATE TEMP TABLE quizzes (
      id varchar PRIMARY KEY, user_id varchar, title text, source_text text,
      questions jsonb, is_public integer DEFAULT 0, category text DEFAULT 'Math',
      created_at timestamp DEFAULT now(), folder_id varchar, rag_source_id varchar,
      source_image_url text, difficulty text, generation_mode text
    ); CREATE TEMP TABLE quiz_results (quiz_id varchar, user_id varchar, completed_at timestamp DEFAULT now())`);

    await t.test("quiz summaries apply the requested limit in SQL", async () => {
      for (let index = 0; index < 20; index++) await quiz(`quiz-${index}`);
      await quiz("foreign", "another-user");
      queries.length = 0;
      const summaries = await storage.getQuizzesByUserIdLight("owner", 8);
      assert.equal(summaries.length, 8);
      assert.ok(summaries.every(summary => summary.userId === "owner" && summary.questionCount === 8));
      assert.ok(summaries.every(summary => !("sourceText" in summary) && !("questions" in summary)));
      assert.match(queries[0], /limit \$\d+/i);
      assert.equal((await storage.getQuizzesByUserIdLight("owner")).length, 20);
    });

    await t.test("empty accounts have no revision", async () => {
      assert.equal(await storage.getDailyRevision("empty", "2026-11-08"), null);
    });

    await t.test("revision rotates, excludes inaccessible quizzes, and returns only four questions", async () => {
      await client.query("TRUNCATE quizzes, quiz_results");
      await quiz("own-a");
      await quiz("own-b");
      await quiz("public", "another-user", 1);
      await quiz("private", "another-user");
      await quiz("too-short", "owner", 0, questions.slice(0, 3));
      await quiz("other-types", "owner", 0, questions.map(question => ({ ...question, type: "short_answer" })));
      await attempt("public");
      await attempt("private");
      const ids = new Set<string>();
      for (const date of ["2026-11-08", "2026-11-09", "2026-11-10"]) {
        queries.length = 0;
        const result = await storage.getDailyRevision("owner", date);
        assert.ok(result);
        assert.equal(queries.length, 1);
        assert.equal(result.questions.length, 4);
        assert.equal(new Set(result.questions.map(question => question.id)).size, 4);
        assert.ok(result.questions.every(question => question.type === "multiple_choice"));
        assert.deepEqual(Object.keys(result.quiz).sort(), ["category", "id", "title"]);
        ids.add(result.quiz.id);
        assert.deepEqual(result, await storage.getDailyRevision("owner", date));
      }
      assert.deepEqual(ids, new Set(["own-a", "own-b", "public"]));
    });

    await t.test("candidate selection is bounded to the twelve most recently used quizzes", async () => {
      await client.query("TRUNCATE quizzes, quiz_results");
      for (let index = 0; index < 13; index++) {
        const id = `candidate-${index}`;
        await quiz(id, "another-user", 1, index === 12 ? questions : questions.slice(0, 3));
        await client.query("INSERT INTO quiz_results VALUES ($1, 'owner', $2)",
          [id, new Date(Date.UTC(2026, 10, 20 - index))]);
      }
      assert.equal(await storage.getDailyRevision("owner", "2026-11-08"), null);
    });
  } finally {
    t.mock.restoreAll();
    client.release();
    await pool.end();
    await db.$client.end();
  }
});
