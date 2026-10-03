import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { getTableColumns } from "drizzle-orm";
import { quizzes, type Question, type Quiz } from "../shared/schema.js";

process.env.DATABASE_URL ||= "postgres://test:test@localhost/quiz_feedback_test";
const { db } = await import("./db.js");
const { storage } = await import("./storage.js");
const original: Question = { id: "q1", type: "multiple_choice", question: "Where does boiling vaporize liquid?", options: ["Inside only", "Inside and surface"], correctAnswer: "Inside only" };
const verified: Question = { ...original, correctAnswer: "Inside and surface", explanation: "Vaporization occurs inside and at the surface.", wrongAnswerExplanations: { "Inside only": "The surface also vaporizes." } };
const evidence = { sourceText: "Actual source", images: [] };

function connection(t: TestContext, overrides: Partial<Quiz> = {}) {
  const other: Question = { ...original, id: "q2", question: "Concurrently edited other question" };
  const quiz = { id: "quiz", sourceText: evidence.sourceText, questions: [original, other], ...overrides } as Quiz;
  const row = Object.keys(getTableColumns(quizzes)).map(key => key === "createdAt" ? "2026-10-02 00:00:00" : quiz[key as keyof Quiz] ?? null);
  const queries: { sql: string; params: unknown[] }[] = [];
  const client = { release() {}, async query(config: { text: string }, params: unknown[] = []) {
    queries.push({ sql: config.text, params });
    return { rows: config.text.startsWith("select") || config.text.startsWith("update") ? [row] : [] };
  } };
  t.mock.method(db.$client, "connect", async () => client);
  t.mock.method(db.$client, "query", () => { throw new Error("Unexpected query outside transaction"); });
  return { queries, other };
}

test("locks and updates only verified feedback fields while preserving other questions", async t => {
  const { queries, other } = connection(t);
  await storage.updateVerifiedQuestion("quiz", original, { ...verified, question: "Attempted stem change" }, evidence);
  assert.equal(queries[0].sql, "begin");
  assert.match(queries[1].sql, /for update$/);
  const update = queries.find(query => query.sql.startsWith("update"))!;
  const questions = JSON.parse(update.params[0] as string);
  assert.equal(questions[0].question, original.question);
  assert.equal(questions[0].correctAnswer, verified.correctAnswer);
  assert.equal(questions[0].explanation, verified.explanation);
  assert.deepEqual(questions[1], other);
  assert.equal(queries.at(-1)?.sql, "commit");
});

test("concurrent question or source edits prevent storing obsolete feedback", async t => {
  for (const overrides of [
    { questions: [{ ...original, question: "Changed question" }] }, { sourceText: "Changed source" },
    { sourceImages: ["New image"] },
  ]) {
    const { queries } = connection(t, overrides);
    assert.equal(await storage.updateVerifiedQuestion("quiz", original, verified, evidence), undefined);
    assert.equal(queries.some(query => query.sql.startsWith("update")), false);
    t.mock.restoreAll();
  }
});

test("an identical correction saved by another request is accepted without a second update", async t => {
  const { queries } = connection(t, { questions: [verified] });
  assert.ok(await storage.updateVerifiedQuestion("quiz", original, verified, evidence));
  assert.equal(queries.some(query => query.sql.startsWith("update")), false);
});
