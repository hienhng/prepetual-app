import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";

test("progress summaries and single-attempt restoration against PostgreSQL", {
  skip: !process.env.LOADING_TEST_DATABASE_URL,
}, async t => {
  process.env.DATABASE_URL ||= process.env.LOADING_TEST_DATABASE_URL;
  const { db } = await import("./db.js");
  const { storage } = await import("./storage.js");
  const pool = new pg.Pool({ connectionString: process.env.LOADING_TEST_DATABASE_URL });
  const client = await pool.connect();
  t.mock.method(db.$client, "query", (...args: any[]) => (client.query as any)(...args));
  const questions = [
    { id: "q1", type: "multiple_choice", question: "Question one", options: ["A", "B"], correctAnswer: "A" },
    { id: "q2", type: "multiple_choice", question: "Question two", options: ["A", "B"], correctAnswer: "B" },
    { id: "q3", type: "multiple_choice", question: "Question three", options: ["A", "B"], correctAnswer: "A" },
  ];
  const feedback = { q1: { isCorrect: false, isPartial: false, explanation: "Verified feedback", gradingToken: "saved-token" } };
  const source = "large source document ".repeat(50_000);
  try {
    await client.query(`CREATE TEMP TABLE quizzes (
      id varchar PRIMARY KEY, user_id varchar, title text, source_text text,
      source_image_url text, source_images jsonb, questions jsonb, lecture jsonb,
      difficulty text DEFAULT 'medium', category text DEFAULT 'Math', generation_mode text,
      is_public integer DEFAULT 0, created_at timestamp DEFAULT now(), folder_id varchar, rag_source_id varchar
    ); CREATE TEMP TABLE quiz_progress (
      id varchar PRIMARY KEY, user_id varchar, quiz_id varchar, answers jsonb,
      checked_questions jsonb, current_index integer, retry_answers jsonb,
      retry_checked_questions jsonb, short_answer_grading_results jsonb,
      time_taken integer, saved_at timestamp
    )`);
    for (const [id, owner, isPublic] of [["own", "owner", 0], ["shared", "other", 1], ["private", "other", 0]]) {
      await client.query(`INSERT INTO quizzes (id,user_id,title,questions,source_text,source_images,source_image_url,is_public)
        VALUES ($1,$2,'Quiz title',$3,$4,$5,$6,$7)`,
        [id, owner, JSON.stringify(questions), source, JSON.stringify([source]), source, isPublic]);
      await client.query(`INSERT INTO quiz_progress VALUES ($1,'owner',$2,$3,$4,2,$5,$6,$7,137,$8)`,
        [`progress-${id}`, id, JSON.stringify({ q1: "B", q2: " b ", q3: "" }), JSON.stringify(["q1", "q2"]),
          JSON.stringify({ q1: "A" }), JSON.stringify(["q1"]), JSON.stringify(feedback),
          id === "own" ? "2026-11-08 12:00:00" : "2026-11-07 12:00:00"]);
    }
    await client.query(`INSERT INTO quiz_progress
      SELECT 'other-attempt','other','shared','{}','[]',0,'{}','[]','{}',0,now()`);

    await t.test("summaries exclude multi-megabyte content and preserve counts, order, and retry state", async () => {
      const rows = await storage.getQuizProgressSummaries("owner");
      assert.deepEqual(rows.map(row => row.quizId), ["own", "shared"]);
      assert.equal(Buffer.byteLength(JSON.stringify(rows)) < 2_000, true);
      assert.ok(rows.every(row => row.quiz.questionCount === 3 && row.wrongQuestionCount === 1));
      assert.ok(rows.every(row => !("questions" in row.quiz) && !("sourceText" in row.quiz)
        && !("sourceImages" in row.quiz) && !("sourceImageUrl" in row.quiz)
        && !("shortAnswerGradingResults" in row)));
      assert.deepEqual(rows[0].retryAnswers, { q1: "A" });
      assert.deepEqual(rows[0].retryCheckedQuestions, ["q1"]);
      assert.equal(rows[0].timeTaken, 137);
      assert.deepEqual(await storage.getQuizProgressSummaries("empty"), []);
    });

    await t.test("detail restores exactly the selected user's attempt and full source", async () => {
      const detail = await storage.getQuizProgressDetail("owner", "own");
      assert.ok(detail);
      assert.equal(detail.id, "progress-own");
      assert.equal(detail.currentIndex, 2);
      assert.equal(detail.timeTaken, 137);
      assert.deepEqual(detail.answers, { q1: "B", q2: " b ", q3: "" });
      assert.deepEqual(detail.checkedQuestions, ["q1", "q2"]);
      assert.deepEqual(detail.retryAnswers, { q1: "A" });
      assert.deepEqual(detail.retryCheckedQuestions, ["q1"]);
      assert.deepEqual(detail.shortAnswerGradingResults, feedback);
      assert.equal(detail.quiz.sourceText, source);
      assert.deepEqual(detail.quiz.questions, questions);
      const shared = await storage.getQuizProgressDetail("other", "shared");
      assert.equal(shared?.id, "other-attempt");
    });

    await t.test("other users' attempts and revoked private quizzes cannot be resumed", async () => {
      assert.equal(await storage.getQuizProgressDetail("stranger", "own"), undefined);
      assert.equal(await storage.getQuizProgressDetail("owner", "private"), undefined);
      await client.query("UPDATE quizzes SET is_public=0 WHERE id='shared'");
      assert.equal(await storage.getQuizProgressDetail("owner", "shared"), undefined);
      assert.deepEqual((await storage.getQuizProgressSummaries("owner")).map(row => row.quizId), ["own"]);
    });
  } finally {
    t.mock.restoreAll(); client.release(); await pool.end(); await db.$client.end();
  }
});
