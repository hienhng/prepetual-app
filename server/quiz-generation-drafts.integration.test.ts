import { markQuestionFeedbackPrepared } from "../shared/quiz-feedback.js";
import { withQuestionReviewDefaults } from "./test-fixtures/quiz-review.js";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

test("durable drafts enforce ownership, single resume, preservation, and atomic completion", { skip: process.env.RUN_DRAFT_DB_TEST !== "1" }, async () => {
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-only";
  process.env.GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "http://test.invalid/v1";
  const originalFetch = globalThis.fetch;
  let supplyMissing = false;
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    const prompt = JSON.parse(String(init?.body)).messages[0].content as string;
    if (prompt.includes("language-consistency auditor")) {
      const items = JSON.parse(prompt.split("GENERATED ITEMS:\n")[1].split("\n\n")[0]);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(withQuestionReviewDefaults({ evaluations: items.map((_: unknown, index: number) => ({ index, isConsistent: true, answerCorrect: true, explanationConsistent: true })) })) }, finish_reason: "stop" }] }), { headers: { "Content-Type": "application/json" } });
    }
    const content = prompt.includes("independent quiz answer auditor")
      ? { verifications: [{ index: 0, solution: "Madrid is Spain's capital.", satisfyingOptionIndexes: [0], correctOptionIndex: 0, isUnambiguous: true, isLanguageConsistent: true, wrongOptionExplanations: { "1": "Paris is in France.", "2": "Rome is in Italy.", "3": "Berlin is in Germany." } }] }
      : { questions: supplyMissing ? [{ type: "multiple_choice", question: "What is the capital of Spain?", options: ["Madrid", "Paris", "Rome", "Berlin"], correctAnswer: "Madrid", explanation: "Madrid is Spain's capital." }] : [] };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(withQuestionReviewDefaults(content)) }, finish_reason: "stop" }] }), { headers: { "Content-Type": "application/json" } });
  };
  const { db } = await import("./db.js");
  const { users, quizzes, quizGenerationDrafts: drafts } = await import("../shared/schema.js");
  const { createGenerationDraft, claimGenerationDraft, runGenerationDraft, listGenerationDrafts } = await import("./quiz-generation-drafts.js");
  const userId = randomUUID();
  try {
    await db.insert(users).values({ id: userId, email: `draft-test-${userId}@example.invalid` });
    const draft = await createGenerationDraft(userId, { generation: { targetLanguage: "en", text: "European capitals", isPromptBased: true, questionCount: 3, questionTypes: ["multiple_choice"] }, quiz: { userId, sourceText: "", generationMode: "generate" }, indexingText: "" });
    const seeds = [
      { id: "saved-one", type: "multiple_choice" as const, question: "What is the capital of France?", options: ["Paris", "Rome", "Madrid", "Berlin"], correctAnswer: "Paris", explanation: "Paris is France's capital." },
      { id: "saved-two", type: "multiple_choice" as const, question: "What is the capital of Italy?", options: ["Rome", "Paris", "Madrid", "Berlin"], correctAnswer: "Rome", explanation: "Rome is Italy's capital." },
    ];
    for (const question of seeds) {
      question.wrongAnswerExplanations = Object.fromEntries(question.options!.filter(option => option !== question.correctAnswer).map(option => [option, `${option} is not the capital asked for.`]));
      Object.assign(question, markQuestionFeedbackPrepared(question));
    }
    await db.update(drafts).set({ questions: seeds, title: "European capitals", status: "paused" }).where(eq(drafts.id, draft.id));
    assert.equal(await claimGenerationDraft("not-the-owner", draft.id), undefined);
    assert.deepEqual(await listGenerationDrafts("not-the-owner"), []);
    const claims = await Promise.all([claimGenerationDraft(userId, draft.id), claimGenerationDraft(userId, draft.id)]);
    assert.equal(claims.filter(Boolean).length, 1);
    const paused = await runGenerationDraft(claims.find(Boolean)!);
    assert.equal(paused.type, "paused");
    assert.equal((await listGenerationDrafts(userId))[0].generated, 2);
    const resumed = await claimGenerationDraft(userId, draft.id);
    assert.ok(resumed);
    assert.deepEqual(resumed.questions, seeds);
    supplyMissing = true;
    const indexPaused = await runGenerationDraft(resumed, undefined, Promise.resolve({ ok: false, error: new Error("Index temporarily unavailable") }));
    assert.equal(indexPaused.type, "paused");
    assert.equal((await listGenerationDrafts(userId))[0].generated, 3);
    const finalRun = await claimGenerationDraft(userId, draft.id);
    assert.ok(finalRun);
    const completed = await runGenerationDraft(finalRun);
    assert.equal(completed.type, "complete");
    if (completed.type !== "complete") throw new Error("Completion expected");
    assert.deepEqual(completed.quiz.questions.slice(0, 2), seeds);
    assert.equal(completed.quiz.questions.length, 3);
    assert.equal(completed.quiz.id, draft.id);
    assert.equal(await claimGenerationDraft(userId, draft.id), undefined);
    assert.deepEqual(await listGenerationDrafts(userId), []);
    assert.equal(calls, 4); // Three unsuccessful top-ups, then one successful writer call.
  } finally {
    await db.delete(quizzes).where(eq(quizzes.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    await db.$client.end();
    globalThis.fetch = originalFetch;
  }
});
