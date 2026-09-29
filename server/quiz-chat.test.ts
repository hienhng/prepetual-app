import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import type { Quiz } from "../shared/schema.js";
import { prepareChatHistory } from "../shared/quiz-chat.js";
import { quizChatRequestSchema } from "./ai-input.js";
import { createQuizChatHandler } from "./quiz-chat.js";

const question = { id: "q1", type: "short_answer" as const, question: "What is gravity?", correctAnswer: "Attraction" };
const baseQuiz = {
  id: "quiz", title: "Physics", userId: "owner", isPublic: 0,
  generationMode: "import", sourceText: "Gravity attracts masses.",
  ragSourceId: null, questions: [question],
} as Quiz;

async function request(overrides: Partial<Quiz> = {}, options: {
  requesterId?: string | null;
  error?: Error;
  missing?: boolean;
  body?: Record<string, unknown>;
} = {}) {
  let status = 200;
  let body: any;
  let prompt: any;
  let retrieval: any;
  const handler = createQuizChatHandler({
    storage: {
      getQuiz: async () => options.missing ? undefined : { ...baseQuiz, ...overrides },
      getUser: async () => undefined,
    },
    retrieveRagContext: async (params) => {
      retrieval = params;
      return { context: "[S1] Indexed evidence", chunks: [], allowedChunkIds: [] };
    },
    quizChatResponse: async (params) => {
      prompt = params;
      if (options.error) throw options.error;
      return "Think about the attraction between masses.";
    },
  });
  await handler({
    body: { quizId: "quiz", currentQuestionIndex: 0, userMessage: "Help me understand", ...options.body },
    user: { claims: { sub: options.requesterId === undefined ? "owner" : options.requesterId } },
  } as unknown as Request, {
    status(code: number) { status = code; return this; },
    json(data: unknown) { body = data; return this; },
  } as Response, () => {});
  return { status, body, prompt, retrieval };
}

test("long conversations and large AI replies remain valid request history", () => {
  const messages = Array.from({ length: 50 }, (_, i) => ({
    role: i % 2 ? "assistant" as const : "user" as const,
    content: `${i}:` + "x".repeat(5_000),
  }));
  const history = prepareChatHistory([...messages, { role: "assistant", content: "Service error", isError: true }]);
  assert.equal(history.length, 20);
  assert.ok(history[0].content.startsWith("30:"));
  assert.equal(history[0].content.length, 4_000);
  assert.equal(messages[0].content.length, 5_002);
  assert.ok(quizChatRequestSchema.safeParse({ quizId: "quiz", currentQuestionIndex: 0, userMessage: "Next", chatHistory: history }).success);
});

test("imported and legacy quizzes chat using saved source without requiring an index", async () => {
  const result = await request();
  assert.equal(result.status, 200);
  assert.equal(result.prompt.sourceMaterial, baseQuiz.sourceText);
  assert.equal(result.prompt.isRagGrounded, false);
  assert.equal(result.retrieval, undefined);
  const noSource = await request({ sourceText: null });
  assert.equal(noSource.status, 200);
  assert.equal(noSource.prompt.sourceMaterial, undefined);
});

test("indexed public quizzes retrieve evidence under the owner's identity", async () => {
  const result = await request({ ragSourceId: "source", isPublic: 1 }, { requesterId: null });
  assert.equal(result.status, 200);
  assert.equal(result.retrieval.ownerUserId, "owner");
  assert.equal(result.prompt.sourceMaterial, "[S1] Indexed evidence");
  assert.equal(result.prompt.isRagGrounded, true);
});

test("access, missing quizzes, empty quizzes, and invalid requests stop before AI calls", async () => {
  for (const [result, expected] of [
    [await request({}, { requesterId: "other" }), 403],
    [await request({}, { missing: true }), 404],
    [await request({ questions: [] }), 409],
    [await request({}, { body: { userMessage: " " } }), 400],
  ] as const) {
    assert.equal(result.status, expected);
    assert.equal(result.prompt, undefined);
    assert.equal(result.retrieval, undefined);
  }
});

test("out-of-range question indexes use the last available question", async () => {
  const result = await request({}, { body: { currentQuestionIndex: 100 } });
  assert.equal(result.status, 200);
  assert.equal(result.prompt.currentQuestionIndex, 0);
});

test("provider failures return actionable messages without leaking internal errors", async () => {
  const busy = await request({}, { error: Object.assign(new Error("private provider details"), { status: 429 }) });
  assert.equal(busy.status, 429);
  assert.match(busy.body.message, /busy/);
  const unavailable = await request({}, { error: new Error("private provider details") });
  assert.equal(unavailable.status, 502);
  assert.match(unavailable.body.message, /temporarily unavailable/);
  assert.doesNotMatch(unavailable.body.message, /private/);
});
