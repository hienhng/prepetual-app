import assert from "node:assert/strict";
import test from "node:test";
import { encodeSelectionAnswer, parseSelectionAnswer, selectionAnswersMatch, isValidSelectionQuestion, formatAnswer } from "./selection-answer.js";
import { validatedQuestionSchema, generateQuizRequestSchema } from "./schema.js";

const options = ["2", "3", "4", "9"];
const question = { id: "primes", type: "selection" as const, question: "Select all prime numbers.", options, correctAnswer: encodeSelectionAnswer(["2", "3"]) };

test("selection grading requires the complete set, regardless of checkbox order", () => {
  assert.equal(selectionAnswersMatch(encodeSelectionAnswer(["3", "2"]), question.correctAnswer), true);
  for (const answer of [["2"], ["2", "3", "4"], ["2", "4"], ["2", "2"], [], ["2", "3", "3"]]) {
    assert.equal(selectionAnswersMatch(encodeSelectionAnswer(answer), question.correctAnswer), false);
  }
  for (const invalid of [undefined, "", "2,3", "{}", "null", '[2,3]']) {
    assert.equal(selectionAnswersMatch(invalid, question.correctAnswer), false);
  }
});

test("selection storage preserves punctuation, math, and persisted answers", () => {
  const selected = ["Paris, France", "$\\frac{1}{2}$", 'A "quoted" answer'];
  const saved = JSON.parse(JSON.stringify({ answers: { question: encodeSelectionAnswer(selected) } }));
  assert.deepEqual(parseSelectionAnswer(saved.answers.question), selected);
  assert.equal(formatAnswer(saved.answers.question, "selection"), selected.join("; "));
});

test("selection keys reject missing, duplicate, blank, or unknown options", () => {
  assert.equal(validatedQuestionSchema.safeParse(question).success, true);
  for (const correct of [["2"], ["2", "2"], ["2", "unknown"]]) {
    assert.equal(validatedQuestionSchema.safeParse({ ...question, correctAnswer: encodeSelectionAnswer(correct) }).success, false);
  }
  assert.equal(isValidSelectionQuestion({ ...question, options: ["2", "3", "3"] }), false);
  assert.equal(isValidSelectionQuestion({ ...question, options: ["2", "3", ""] }), false);
  assert.equal(isValidSelectionQuestion({ ...question, options: undefined }), false);
  assert.equal(validatedQuestionSchema.safeParse({ ...question, type: "multiple_choice", correctAnswer: "2" }).success, true);
});

test("generation accepts selection alone and all four unique types", () => {
  const input = { prompt: "Create a prime numbers quiz", questionTypes: ["selection"] };
  assert.equal(generateQuizRequestSchema.safeParse(input).success, true);
  assert.equal(generateQuizRequestSchema.safeParse({ ...input, questionTypes: ["selection", "multiple_choice", "true_false", "short_answer"] }).success, true);
  assert.equal(generateQuizRequestSchema.safeParse({ ...input, questionTypes: ["selection", "selection"] }).success, false);
});

test("imported truth statements allow zero or one true statement without relaxing generated selections", () => {
  for (const correct of [[], ["2"], ["2", "3"]]) {
    const imported = { ...question, selectionMode: "truth_statements" as const, correctAnswer: encodeSelectionAnswer(correct) };
    assert.equal(validatedQuestionSchema.safeParse(imported).success, true);
    assert.equal(selectionAnswersMatch(encodeSelectionAnswer(correct), imported.correctAnswer), true);
    assert.equal(selectionAnswersMatch(undefined, imported.correctAnswer), false);
    assert.equal(selectionAnswersMatch("garbage", imported.correctAnswer), false);
  }
  assert.equal(validatedQuestionSchema.safeParse({ ...question, correctAnswer: "[]" }).success, false);
  assert.equal(validatedQuestionSchema.safeParse({ ...question, correctAnswer: "", importReview: { sourceLabel: "1", sourceText: "original", reason: "Verify the answer" } }).success, true);
});
