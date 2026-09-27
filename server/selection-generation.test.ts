import assert from "node:assert/strict";
import test from "node:test";
import { parseSelectionAnswer, isValidSelectionQuestion } from "../shared/selection-answer.js";
import { normalizeQuizCandidate, needsQuizAnswerCompletion } from "./quiz-generation-policy.js";

test("selection candidate normalization keeps every correct option", () => {
  const candidate = normalizeQuizCandidate({ type: "selection", options: [" 2 ", " 3", "4", "9"], correctAnswer: [" 2", "3 "], explanation: "Both are prime." });
  assert.deepEqual(parseSelectionAnswer(candidate.correctAnswer), ["2", "3"]);
  assert.equal(needsQuizAnswerCompletion(candidate), false);
  assert.equal(needsQuizAnswerCompletion({ ...candidate, correctAnswer: '["2"]' }), true);
});

test("selection generation and independent audit preserve a complete answer set after shuffling", async () => {
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-only";
  process.env.GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "http://test.invalid/v1";
  const originalFetch = globalThis.fetch;
  let audits = 0;
  const respond = (value: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) }, finish_reason: "stop" }] }), { headers: { "Content-Type": "application/json" } });
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    const prompt = body.messages[0].content as string;
    if (prompt.includes("independent quiz answer auditor")) {
      audits++;
      const items = JSON.parse(prompt.split("Questions to verify:\n")[1].split("\n\n")[0]);
      return respond({ verifications: items.map((item: any) => ({
        index: item.index, solution: "Two and three are prime; four and nine are composite.",
        satisfyingOptionIndexes: item.options.map((option: string, i: number) => ["2", "3"].includes(option) ? i : -1).filter((i: number) => i >= 0),
        correctOptionIndex: null, isUnambiguous: true, isLanguageConsistent: true,
        explanation: "Two and three are prime; four and nine are composite.",
      })) });
    }
    assert.match(prompt, /selection/);
    return respond({ title: "Prime numbers", category: "categories.math", questions: Array.from({ length: 3 }, (_, index) => ({
      type: "selection", question: `Select all prime numbers in set ${index + 1}.`, options: ["2", "3", "4", "9"],
      // Deliberately wrong initial key: the independent auditor must repair it.
      correctAnswer: ["2", "4"], explanation: "Initial rationale.",
    })) });
  };
  try {
    const { generateQuizQuestions } = await import("./openai.js");
    const result = await generateQuizQuestions({ text: "Create a quiz on prime numbers", questionCount: 3, questionTypes: ["selection"], isPromptBased: true });
    assert.equal(result.questions.length, 3);
    assert.ok(audits > 0);
    for (const question of result.questions) {
      assert.equal(question.type, "selection");
      assert.ok(isValidSelectionQuestion(question));
      assert.deepEqual(parseSelectionAnswer(question.correctAnswer).sort(), ["2", "3"]);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
