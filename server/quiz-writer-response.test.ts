import assert from "node:assert/strict";
import test from "node:test";
import { requestQuizWriterResponse } from "./quiz-writer-response.js";

const response = (value: unknown, finish_reason = "stop") => ({ choices: [{ finish_reason, message: { content: JSON.stringify(value) } }] });
const quiz = { title: "Physics", questions: [{ type: "short_answer", question: "Why?", correctAnswer: "Heat" }] };
const invalidJson = { status: 400, code: "json_validate_failed", error: { failed_generation: '{"title":"Physics", **"questions": []**}' } };

test("writer retries the live provider's malformed JSON rejection in plain mode", async () => {
  const calls: boolean[] = [];
  const result = await requestQuizWriterResponse(async mode => {
    calls.push(mode);
    if (calls.length === 1) throw invalidJson;
    return response(quiz);
  }, { maxTokens: 10_240 });
  assert.deepEqual(calls, [true, false]);
  assert.deepEqual(JSON.parse(result), quiz);
});

test("complete provider error payloads reuse writer output without another request", async () => {
  let calls = 0;
  const result = await requestQuizWriterResponse(async () => {
    calls++;
    throw { ...invalidJson, error: { failed_generation: JSON.stringify(quiz) } };
  }, { maxTokens: 10_240 });
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(result), quiz);
});

test("length-limited output is retried even when its JSON parses", async () => {
  const budgets: number[] = [];
  const result = await requestQuizWriterResponse(async (_mode, tokens) => {
    budgets.push(tokens);
    return response(budgets.length === 1 ? { questions: [] } : quiz, budgets.length === 1 ? "length" : "stop");
  }, { maxTokens: 10_240 });
  assert.deepEqual(budgets, [10_240, 20_480]);
  assert.deepEqual(JSON.parse(result), quiz);
});

test("malformed output retries once, and exhausted recovery never publishes it", async () => {
  let calls = 0;
  await assert.rejects(requestQuizWriterResponse(async () => {
    calls++;
    return response({ title: "Missing questions" });
  }, { maxTokens: 8192 }), /missing questions array after retry/);
  assert.equal(calls, 2);
});

test("unrelated provider errors are left to the caller's request policy", async () => {
  const error = new Error("Connection failed");
  let calls = 0;
  await assert.rejects(requestQuizWriterResponse(async () => { calls++; throw error; }, { maxTokens: 8192 }), error);
  assert.equal(calls, 1);
});
