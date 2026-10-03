import assert from "node:assert/strict";
import test from "node:test";
import { hasPreparedQuestionFeedback } from "../shared/quiz-feedback.js";

test("three questions are written in one call with an immediately usable saved answer key", async t => {
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-only";
  process.env.GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "http://test.invalid/v1";
  const options = ["Inside only", "Inside and surface", "Surface only", "Near the surface only"];
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    calls++;
    const body = JSON.parse(String(init?.body));
    const prompt = body.messages[0].content;
    assert.match(prompt, /generate all/i);
    assert.doesNotMatch(prompt, /QUIZ SOURCE RECORD|independent quiz answer auditor|language-consistency auditor/);
    return new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
      title: "Boiling", category: "categories.science", questions: [1, 2, 3].map(index => ({
        type: "multiple_choice", question: `Where does boiling vaporize liquid in example ${index}?`, options,
        // Intentionally wrong but structurally valid: generation must not run an answer audit.
        correctAnswer: "Inside only", explanation: "The writer's initial explanation.", sourceChunkIds: ["boiling"],
      })),
    }) } }] }), { headers: { "Content-Type": "application/json" } });
  });
  const { generateQuizQuestions } = await import("./openai.js");
  for (const grounded of [false, true]) {
    calls = 0;
    const result = await generateQuizQuestions({ targetLanguage: "en",
      text: '[SOURCE_CHUNK id="boiling"]Boiling vaporizes liquid throughout its volume and at its surface.[/SOURCE_CHUNK]',
      questionCount: 3, questionTypes: ["multiple_choice"], isPromptBased: !grounded,
      ...(grounded ? { ragGrounding: { sourceId: "source", allowedChunkIds: ["boiling"] } } : {}),
    });
    assert.equal(result.questions.length, 3);
    assert.equal(calls, 1);
    assert.ok(result.questions.every(q => !hasPreparedQuestionFeedback(q) && q.correctAnswer === "Inside only"));
  }
});
