import { withQuestionReviewDefaults } from "./test-fixtures/quiz-review.js";
import { markQuestionFeedbackPrepared } from "../shared/quiz-feedback.js";
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
    for (const question of seeds) {
      question.wrongAnswerExplanations = Object.fromEntries(question.options!.filter(option => option !== question.correctAnswer).map(option => [option, `${option} is not the capital asked for.`]));
      Object.assign(question, markQuestionFeedbackPrepared(question));
    }
  const resumeState = { questions: seeds, title: "European capitals", category: "categories.general" as const };
  const params = { targetLanguage: "en", text: "European capitals", questionCount: 3, questionTypes: ["multiple_choice" as const], isPromptBased: true, resumeState };
  const response = (value: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(withQuestionReviewDefaults(value)) }, finish_reason: "stop" }] }), { headers: { "Content-Type": "application/json" } });
  const languageResponse = (prompt: string) => {
    const items = JSON.parse(prompt.split("GENERATED ITEMS:\n")[1].split("\n\n")[0]);
    return response({ evaluations: items.map((_: unknown, index: number) => ({ index, isConsistent: true, answerCorrect: true, explanationConsistent: true, wrongExplanationsConsistent: true })) });
  };
  try {
    await t.test("successful resume skips initial generation, deduplicates, and checkpoints additions", async () => {
      const prompts: string[] = [];
      const checkpoints: number[] = [];
      mockFetch = async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        const prompt = body.messages[0].content as string;
        prompts.push(prompt);
        if (prompt.includes("language-consistency auditor")) return languageResponse(prompt);
        if (prompt.includes("independent quiz answer auditor")) {
          const items = JSON.parse(prompt.split("Questions to verify:\n")[1].split("\n\n")[0]);
          const correctIndex = items[0].options.indexOf("Madrid");
          return response({ verifications: [{ index: 0, solution: "Madrid is the capital of Spain.", satisfyingOptionIndexes: [correctIndex], correctOptionIndex: correctIndex, isUnambiguous: true, isLanguageConsistent: true }] });
        }
        return response({ questions: [seeds[0], { type: "multiple_choice", question: "What is the capital of Spain?", options: ["Madrid", "Paris", "Rome", "Berlin"], correctAnswer: "Madrid", explanation: "Madrid is the capital of Spain." }] });
      };
      const result = await generateQuizQuestions({ ...params, onCheckpoint: async (state) => { checkpoints.push(state.questions.length); } });
      assert.deepEqual(result.questions.slice(0, 2), seeds);
      assert.equal(result.questions.length, 3);
      assert.deepEqual(checkpoints, [2, 3]);
      const generationPrompts = prompts.filter(prompt => !prompt.includes("auditor"));
      assert.equal(generationPrompts.length, 1);
      assert.match(generationPrompts[0], /needs 1 additional/);
      assert.ok(generationPrompts[0].includes(seeds[0].question));
    });
    await t.test("a second exhausted attempt preserves the prior checkpoint", async () => {
      const checkpoints: number[] = [];
      mockFetch = async (_url, init) => {
        const prompt = JSON.parse(String(init?.body)).messages[0].content as string;
        return prompt.includes("language-consistency auditor") ? languageResponse(prompt) : response({ questions: [] });
      };
      await assert.rejects(generateQuizQuestions({ ...params, onCheckpoint: async (state) => { checkpoints.push(state.questions.length); } }), /2 of 3/);
      assert.deepEqual(checkpoints, [2]);
      assert.equal(seeds[0].id, "saved-one");
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
