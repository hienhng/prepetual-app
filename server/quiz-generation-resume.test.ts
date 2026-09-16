import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "../shared/schema.js";

test("resume preserves accepted questions and only requests missing candidates", async (t) => {
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-only";
  process.env.GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "http://test.invalid/v1";
  const originalFetch = globalThis.fetch;
  let mockFetch: typeof fetch = async () => { throw new Error("Unexpected model request"); };
  globalThis.fetch = (...args) => mockFetch(...args);
  const { generateQuizQuestions } = await import("./openai.js");
  const seeds: Question[] = [
    { id: "saved-one", type: "multiple_choice", question: "What is the capital of France?", options: ["Paris", "Rome", "Madrid", "Berlin"], correctAnswer: "Paris", explanation: "Paris is the capital of France." },
    { id: "saved-two", type: "multiple_choice", question: "What is the capital of Italy?", options: ["Rome", "Paris", "Madrid", "Berlin"], correctAnswer: "Rome", explanation: "Rome is the capital of Italy." },
  ];
  const resumeState = { questions: seeds, title: "European capitals", category: "Others/General" as const };
  const params = { text: "European capitals", questionCount: 3, questionTypes: ["multiple_choice" as const], isPromptBased: true, resumeState };
  const response = (value: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) }, finish_reason: "stop" }] }), { headers: { "Content-Type": "application/json" } });
  try {
    await t.test("successful resume skips initial generation, deduplicates, and checkpoints additions", async () => {
      const prompts: string[] = [];
      const checkpoints: number[] = [];
      mockFetch = async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        const prompt = body.messages[0].content as string;
        prompts.push(prompt);
        if (prompt.includes("independent quiz answer auditor")) {
          return response({ verifications: [{ index: 0, solution: "Madrid is the capital of Spain.", satisfyingOptionIndexes: [0], correctOptionIndex: 0, isUnambiguous: true, isLanguageConsistent: true, explanation: "Madrid is the capital of Spain." }] });
        }
        return response({ questions: [seeds[0], { type: "multiple_choice", question: "What is the capital of Spain?", options: ["Madrid", "Paris", "Rome", "Berlin"], correctAnswer: "Madrid", explanation: "Madrid is the capital of Spain." }] });
      };
      const result = await generateQuizQuestions({ ...params, onCheckpoint: async (state) => { checkpoints.push(state.questions.length); } });
      assert.deepEqual(result.questions.slice(0, 2), seeds);
      assert.equal(result.questions.length, 3);
      assert.deepEqual(checkpoints, [2, 3]);
      assert.equal(prompts.length, 2);
      assert.match(prompts[0], /needs 1 additional/);
      assert.ok(prompts[0].includes(seeds[0].question));
    });
    await t.test("a second exhausted attempt preserves the prior checkpoint", async () => {
      const checkpoints: number[] = [];
      mockFetch = async () => response({ questions: [] });
      await assert.rejects(generateQuizQuestions({ ...params, onCheckpoint: async (state) => { checkpoints.push(state.questions.length); } }), /2 of 3/);
      assert.deepEqual(checkpoints, [2]);
      assert.equal(seeds[0].id, "saved-one");
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
