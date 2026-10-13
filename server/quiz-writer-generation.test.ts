import assert from "node:assert/strict";
import test from "node:test";
import { hasPreparedQuestionFeedback } from "../shared/quiz-feedback.js";

test("live writer JSON failures retry once and local math rejections guide replacements", async t => {
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-only";
  process.env.GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "http://test.invalid/v1";
  const candidate = (question: string) => ({ type: "short_answer", question,
    correctAnswer: "Heat", explanation: "Heat transfers energy." });
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    calls++;
    const body = JSON.parse(String(init?.body));
    const prompt = body.messages[0].content;
    assert.doesNotMatch(prompt, /independent quiz answer auditor|language-consistency auditor/);
    if (calls === 1) {
      assert.deepEqual(body.response_format, { type: "json_object" });
      return new Response(JSON.stringify({ error: { code: "json_validate_failed",
        message: "Failed to generate JSON", failed_generation: '{"questions": **[]**}' } }),
        { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (calls === 2) assert.equal(body.response_format, undefined);
    else {
      assert.match(prompt, /PREVIOUS LOCAL VALIDATION FAILURES/);
      assert.match(prompt, /Unicode math symbol outside delimiters/);
      assert.match(prompt, /25°C/);
      assert.match(prompt, /MATH PRESENTATION EXAMPLE/);
    }
    return new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
      title: "Physics", category: "categories.science", questions: calls === 2
        ? [candidate("What warms water at 25°C?"), candidate("What transfers thermal energy?"), candidate("What changes internal energy?")]
        : [candidate("What transfers energy through conduction?")],
    }) } }] }), { headers: { "Content-Type": "application/json" } });
  });
  const { generateQuizQuestions } = await import("./openai.js");
  const result = await generateQuizQuestions({ targetLanguage: "en", text: "Heat transfers energy.",
    questionCount: 3, questionTypes: ["short_answer"], isPromptBased: true });
  assert.equal(calls, 3);
  assert.equal(result.questions.length, 3);
  assert.ok(result.questions.every(q => !q.question.includes("25°C") && !hasPreparedQuestionFeedback(q)));
});
