import assert from "node:assert/strict";
import test from "node:test";

import {
  QuizGenerationError,
  getInitialQuizCandidateCount,
  getQuizGenerationContext,
  getQuizGenerationErrorPayload,
  getQuizQuestionDeficit,
  getQuizRagBudget,
  getQuizTopUpCandidateCount,
  needsQuizAnswerCompletion,
  normalizeQuizCandidate,
} from "./quiz-generation-policy.js";

test("repairs labels and whitespace without inventing answers or changing source input", () => {
  const input = { type: "multiple_choice", question: " Why? ", options: ["A) One", "B) Two", "C) Three", "D) Four"], correctAnswer: " B ", explanation: " Because. " };
  const repaired = normalizeQuizCandidate(input);
  assert.equal(repaired.correctAnswer, "Two");
  assert.deepEqual(repaired.options, ["One", "Two", "Three", "Four"]);
  assert.equal(input.correctAnswer, " B ");
  assert.equal(normalizeQuizCandidate({ type: "short_answer" }).correctAnswer, undefined);
  assert.equal(needsQuizAnswerCompletion(normalizeQuizCandidate({ type: "true_false", correctAnswer: " TRUE ", explanation: " reason " })), false);
});

test("scales retrieval evidence while requesting the full quiz up front", () => {
  assert.deepEqual(getQuizRagBudget(10), { maxChunks: 10, maxChars: 14_000 });
  assert.deepEqual(getQuizRagBudget(15), { maxChunks: 12, maxChars: 18_000 });
  assert.deepEqual(getQuizRagBudget(20), { maxChunks: 16, maxChars: 24_000 });

  assert.equal(getInitialQuizCandidateCount(10), 11);
  assert.equal(getInitialQuizCandidateCount(15), 17);
  assert.equal(getInitialQuizCandidateCount(20), 22);
});

test("bounds top-up candidate requests", () => {
  assert.equal(getQuizTopUpCandidateCount(1), 2);
  assert.equal(getQuizTopUpCandidateCount(3), 4);
  assert.equal(getQuizTopUpCandidateCount(10), 8);
});

test("uses answer completion only as a fallback for incomplete initial questions", () => {
  assert.equal(needsQuizAnswerCompletion({
    type: "multiple_choice",
    options: ["A", "B", "C", "D"],
    correctAnswer: "B",
    explanation: "B is supported by the source.",
  }), false);
  assert.equal(needsQuizAnswerCompletion({
    type: "short_answer",
    correctAnswer: "Mitochondria",
    explanation: "It produces most cellular ATP.",
  }), false);
  assert.equal(needsQuizAnswerCompletion({
    type: "multiple_choice",
    correctAnswer: "B",
    explanation: "The options were omitted.",
  }), true);
});

test("reports a deficit only when the accepted count is short", () => {
  assert.equal(getQuizQuestionDeficit(12, 12), 0);
  assert.equal(getQuizQuestionDeficit(12, 13), 0);
  assert.equal(getQuizQuestionDeficit(12, 9), 3);
});

test("uses one consistent bounded context for generation and audits", () => {
  const source = `  ${"x".repeat(35_000)}  `;
  assert.equal(getQuizGenerationContext(source).length, 30_000);
  assert.equal(getQuizGenerationContext(" short source "), "short source");
});

test("exposes safe structured generation diagnostics", () => {
  const error = new QuizGenerationError({
    code: "INSUFFICIENT_VALID_QUESTIONS",
    message: "Generated 18 of 20 validated questions.",
    stage: "top_up",
    requested: 20,
    generated: 18,
  });

  assert.deepEqual(getQuizGenerationErrorPayload(error), {
    message: "Generated 18 of 20 validated questions.",
    code: "INSUFFICIENT_VALID_QUESTIONS",
    stage: "top_up",
    requested: 20,
    generated: 18,
  });
});
