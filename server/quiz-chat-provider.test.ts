import assert from "node:assert/strict";
import test from "node:test";

test("Prepal recovers from temporary failures and rejects unusable AI responses", async (t) => {
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-only";
  process.env.GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "http://test.invalid/v1";
  const originalFetch = globalThis.fetch;
  let mockFetch: typeof fetch;
  globalThis.fetch = (...args) => mockFetch(...args);
  const { quizChatResponse } = await import("./openai.js");
  const params = {
    quizTitle: "Physics", questions: [{ id: "q1", type: "short_answer" as const, question: "What is gravity?", correctAnswer: "Attraction" }],
    currentQuestionIndex: 0, userMessage: "Give me a hint", chatHistory: [],
  };
  const completion = (content: string | null, finish_reason = "stop") => new Response(JSON.stringify({
    choices: [{ message: { content }, finish_reason }],
  }), { headers: { "Content-Type": "application/json" } });
  try {
    for (const status of [429, 503]) {
      await t.test(`retries HTTP ${status} using the original provider error`, async () => {
        let calls = 0;
        mockFetch = async () => ++calls === 1
          ? new Response(JSON.stringify({ error: { message: "Temporarily busy" } }), { status, headers: { "Content-Type": "application/json" } })
          : completion("Think about attraction.");
        assert.equal(await quizChatResponse(params), "Think about attraction.");
        assert.equal(calls, 2);
      });
    }
    await t.test("retries empty or truncated output with more room for the answer", async () => {
      const budgets: number[] = [];
      mockFetch = async (_url, init) => {
        budgets.push(JSON.parse(String(init?.body)).max_tokens);
        return budgets.length === 1 ? completion(null, "length") : completion("A complete hint.");
      };
      assert.equal(await quizChatResponse(params), "A complete hint.");
      assert.deepEqual(budgets, [2048, 4096]);
    });
    await t.test("persistent empty output is an error, not a successful chat message", async () => {
      let calls = 0;
      mockFetch = async () => { calls++; return completion(" "); };
      await assert.rejects(quizChatResponse(params), /empty or incomplete/);
      assert.equal(calls, 3);
    });
    await t.test("does not retry permanent authentication errors", async () => {
      let calls = 0;
      mockFetch = async () => {
        calls++;
        return new Response(JSON.stringify({ error: { message: "Invalid credential" } }), { status: 401, headers: { "Content-Type": "application/json" } });
      };
      await assert.rejects(quizChatResponse(params), (error: any) => error.status === 401);
      assert.equal(calls, 1);
    });
    await t.test("empty quizzes are rejected before contacting the provider", async () => {
      mockFetch = async () => { throw new Error("Unexpected provider call"); };
      await assert.rejects(quizChatResponse({ ...params, questions: [] }), /does not contain any questions/);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
