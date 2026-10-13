import assert from "node:assert/strict";
import test from "node:test";
import { getKatexFormattingIssue } from "./math-format.js";

test("writer checks renderability in stems, explanations, keys, and every choice", async t => {
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-only";
  process.env.GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "http://test.invalid/v1";
  let calls = 0;
  let field = "";
  const candidate = (number: number): any => ({ type: "multiple_choice", question: `Which quantity is requested in example ${number}?`,
    correctAnswer: "One", options: ["One", "Two", "Three", "Four"], explanation: "The quantity is one." });
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    calls++;
    const prompt = JSON.parse(String(init?.body)).messages[0].content;
    const bad = candidate(3);
    const invalid = String.raw`$\notakatexcommand{1}$`;
    if (field === "options.1") bad.options[1] = invalid;
    else {
      bad[field] = invalid;
      if (field === "correctAnswer") bad.options[0] = invalid;
    }
    if (calls === 2) {
      assert.ok(prompt.includes(`${field} contains an expression that cannot render in KaTeX`));
    }
    return new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
      title: "Quantities", category: "categories.science", questions: calls === 1
        ? [candidate(1), candidate(2), bad] : [candidate(4)],
    }) } }] }), { headers: { "Content-Type": "application/json" } });
  });
  const { generateQuizQuestions } = await import("./openai.js");
  for (const learnerField of ["question", "explanation", "correctAnswer", "options.1"]) {
    await t.test(learnerField, async () => {
      field = learnerField;
      calls = 0;
      const result = await generateQuizQuestions({ targetLanguage: "en", text: "Compare quantities.",
        questionCount: 3, questionTypes: ["multiple_choice"], isPromptBased: true });
      assert.equal(calls, 2);
      assert.equal(result.questions.length, 3);
      for (const q of result.questions) for (const text of [q.question, q.explanation, q.correctAnswer, ...q.options!]) {
        assert.equal(getKatexFormattingIssue(text), null);
      }
    });
  }
});
