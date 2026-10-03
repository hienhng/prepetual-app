import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "../shared/schema.js";
import { createFeedbackVerifier, UnverifiedAnswerError } from "./verified-feedback.js";

const boiling: Question = {
  id: "boiling", type: "multiple_choice", question: "Khi chất lỏng sôi, hiện tượng hoá hơi xảy ra ở vị trí nào?",
  options: ["Chỉ ở trong lòng chất lỏng", "Cả trong lòng và bề mặt chất lỏng", "Chỉ ở trên bề mặt chất lỏng", "Chỉ ở sát bề mặt chất lỏng"],
  correctAnswer: "Chỉ ở trong lòng chất lỏng",
  explanation: "Hơi được tạo ra cả trong lòng và trên bề mặt.",
  wrongAnswerExplanations: { "Cả trong lòng và bề mặt chất lỏng": "Bốc hơi không phải hoá hơi." },
};
const solution = {
  verified: true, solution: "Sự sôi là sự hoá hơi cả trong lòng và trên bề mặt chất lỏng.",
  correctOptionIndexes: [1], explanation: "Khi sôi, chất lỏng hoá hơi cả trong lòng lẫn trên bề mặt.",
  wrongOptionExplanations: { "0": "Không chỉ trong lòng; hoá hơi cũng xảy ra ở bề mặt.", "2": "Không chỉ ở bề mặt; bọt hơi hình thành trong lòng.", "3": "Không chỉ sát bề mặt; hoá hơi xảy ra cả trong lòng." },
};
const approved = { answerCorrect: true, explanationConsistent: true, wrongExplanationsConsistent: true };

test("boiling regression: independently corrects the key and replaces all contradictory feedback", async () => {
  const prompts: string[] = [];
  const verify = createFeedbackVerifier(async prompt => { prompts.push(prompt); return prompts.length % 2 ? solution : approved; });
  const verified = await verify(boiling, { sourceText: "Sự sôi là sự hoá hơi trong lòng và ở bề mặt." });
  assert.equal(verified.correctAnswer, boiling.options![1]);
  assert.equal(verified.explanation, solution.explanation);
  assert.equal(verified.wrongAnswerExplanations?.[boiling.options![1]], undefined);
  assert.equal(boiling.correctAnswer, boiling.options![0]);
  assert.doesNotMatch(prompts[0].split("QUESTION:\n")[1], /correctAnswer|Bốc hơi không phải/);
  assert.match(prompts[1], /qualifiers/);
  assert.doesNotMatch(prompts[0], /Write a factual wrong explanation for EACH/);
  assert.equal(verified.wrongAnswerExplanations, undefined);
  // A corrected saved question and subsequent attempts reuse a reviewed result.
  verified.explanation = "Client mutation";
  assert.equal((await verify(boiling)).correctAnswer, boiling.options![1]);
  // Different evidence causes a fresh check.
  assert.equal(prompts.length, 4);
});

test("only reviewed results are cached and callers cannot mutate the cache", async () => {
  let calls = 0;
  const verify = createFeedbackVerifier(async () => (++calls % 2 ? solution : approved));
  const first = await verify(boiling);
  const canonical = structuredClone(first);
  first.explanation = "Corrupted";
  const second = await verify(canonical);
  assert.equal(calls, 2);
  assert.equal(second.explanation, solution.explanation);
  await verify({ ...canonical, explanation: "Changed after verification" });
  assert.equal(calls, 4);
});

test("concurrent requests share a verification but receive independent objects", async () => {
  let calls = 0;
  const verify = createFeedbackVerifier(async () => (++calls % 2 ? solution : approved));
  const [a, b] = await Promise.all([verify(boiling), verify(boiling)]);
  assert.equal(calls, 2);
  assert.deepEqual(a, b);
  assert.notEqual(a, b);
});

test("semantic contradictions are rejected rather than displayed or cached", async () => {
  for (const field of ["answerCorrect", "explanationConsistent"]) {
    let calls = 0;
    const verify = createFeedbackVerifier(async () => (++calls % 2 ? solution : { ...approved, [field]: false }));
    await assert.rejects(verify(boiling), UnverifiedAnswerError);
    await assert.rejects(verify(boiling), UnverifiedAnswerError);
    assert.equal(calls, 4);
  }
});

test("uncertain, out-of-range, duplicate, and incomplete solutions fail closed", async () => {
  for (const response of [
    { ...solution, verified: false }, { ...solution, solution: "" },
    { ...solution, correctOptionIndexes: [4] }, { ...solution, correctOptionIndexes: [1, 1] },
    { ...solution, correctOptionIndexes: [] },
  ]) {
    let calls = 0;
    const verify = createFeedbackVerifier(async () => { calls++; return response; });
    await assert.rejects(verify(boiling), UnverifiedAnswerError);
    assert.equal(calls, 1);
  }
});

test("selection verifies the complete set and supports grouped truth statements with none true", async () => {
  const question: Question = { id: "primes", type: "selection", question: "Select all primes", options: ["2", "3", "4"], correctAnswer: '["2","4"]' };
  let calls = 0;
  const verify = createFeedbackVerifier(async () => (++calls % 2 ? {
    verified: true, solution: "2 and 3 are prime.", correctOptionIndexes: [0, 1],
    explanation: "2 and 3 have exactly two positive divisors.", wrongOptionExplanations: { "2": "4 has three divisors." },
  } : approved));
  assert.equal((await verify(question)).correctAnswer, '["2","3"]');
  const none = createFeedbackVerifier(async prompt => prompt.startsWith("Independently solve") ? {
    verified: true, solution: "Both are false.", correctOptionIndexes: [], explanation: "Both statements are false.",
    wrongOptionExplanations: { "0": "2 is prime.", "1": "3 is prime." },
  } : approved);
  assert.equal((await none({ ...question, selectionMode: "truth_statements", options: ["2 is composite", "3 is composite"] })).correctAnswer, "[]");
});

test("true/false verification keeps False as a valid correct option", async () => {
  const question: Question = { id: "tf", type: "true_false", question: "Evaporation is not vaporization.", options: ["True", "False"], correctAnswer: "True" };
  const verify = createFeedbackVerifier(async prompt => prompt.startsWith("Independently solve") ? {
    verified: true, solution: "Evaporation is a form of vaporization.", correctOptionIndexes: [1],
    explanation: "The statement is false: evaporation is vaporization at the surface.",
    wrongOptionExplanations: { "0": "Evaporation is a type of vaporization." },
  } : approved);
  assert.equal((await verify(question)).correctAnswer, "False");
});
