import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { InsertQuizResult } from "../shared/schema.js";

// Exercise the real storage method and Drizzle transaction/SQL generation with
// a stubbed PostgreSQL connection; no live database is needed or contacted.
process.env.DATABASE_URL ||= "postgres://test:test@localhost/quiz_completion_test";
const { db } = await import("./db.js");
const { storage } = await import("./storage.js");

const attempt: InsertQuizResult = {
  quizId: "completed-quiz",
  userId: "participant",
  answers: { q1: "A" },
  score: 100,
  totalQuestions: 1,
  correctAnswers: 1,
  wrongQuestionIds: [],
  timeTaken: 42,
};

function stubConnection(t: TestContext, failure?: "insert" | "delete") {
  const queries: { sql: string; params: unknown[] }[] = [];
  const release = t.mock.fn();
  const client = {
    release,
    async query(config: { text: string }, params: unknown[] = []) {
      const sql = config.text;
      queries.push({ sql, params });
      if (failure && sql.startsWith(failure)) throw new Error(`Simulated ${failure} failure`);
      if (sql.startsWith("insert")) {
        return { rows: [["result-id", ...params, "2026-09-30 00:00:00"]] };
      }
      return { rows: [] };
    },
  };
  t.mock.method(db.$client, "connect", async () => client);
  // Any accidental query outside the transaction must also never reach a DB.
  t.mock.method(db.$client, "query", () => { throw new Error("Query outside transaction"); });
  return { queries, release };
}

test("submission stores the result and clears only this participant's quiz progress before commit", async (t) => {
  const { queries, release } = stubConnection(t);
  const result = await storage.saveQuizResult(attempt);

  assert.equal(result.id, "result-id");
  assert.deepEqual(result.answers, attempt.answers);
  assert.equal(result.timeTaken, 42);
  assert.equal(queries[0].sql, "begin");
  assert.match(queries[1].sql, /^insert into "quiz_results"/);
  assert.equal(queries[2].sql, 'delete from "quiz_progress" where ("quiz_progress"."user_id" = $1 and "quiz_progress"."quiz_id" = $2)');
  assert.deepEqual(queries[2].params, [attempt.userId, attempt.quizId]);
  assert.equal(queries[3].sql, "commit");
  assert.equal(queries.length, 4);
  assert.equal(release.mock.callCount(), 1);
});

test("guest submissions store their result without deleting anyone's progress", async (t) => {
  const { queries } = stubConnection(t);
  const result = await storage.saveQuizResult({ ...attempt, userId: null });

  assert.equal(result.userId, null);
  assert.deepEqual(result.answers, attempt.answers);
  assert.equal(queries.length, 3);
  assert.equal(queries[2].sql, "commit");
  assert.equal(queries.some(({ sql }) => sql.startsWith("delete")), false);
});

test("failure to clear progress rolls back the result instead of reporting completion", async (t) => {
  const { queries, release } = stubConnection(t, "delete");
  await assert.rejects(storage.saveQuizResult(attempt));

  assert.equal(queries.at(-1)?.sql, "rollback");
  assert.equal(queries.some(({ sql }) => sql === "commit"), false);
  assert.equal(release.mock.callCount(), 1);
});

test("failure to store the result preserves progress", async (t) => {
  const { queries } = stubConnection(t, "insert");
  await assert.rejects(storage.saveQuizResult(attempt));

  assert.equal(queries.at(-1)?.sql, "rollback");
  assert.equal(queries.some(({ sql }) => sql.startsWith("delete")), false);
});
