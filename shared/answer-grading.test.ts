import assert from "node:assert/strict";
import test from "node:test";
import { answersMatch, hasJudgedShortAnswer, isAnswerCorrect } from "./answer-grading.js";
import { getQuestionFeedbackSignature } from "./quiz-feedback.js";
import type { Question } from "./schema.js";

test("answer-key text comparison supports choice grading and literal comparison", () => {
  assert.equal(answersMatch(" B ", "b", "multiple_choice"), true);
  assert.equal(answersMatch("A", "B", "multiple_choice"), false);
  assert.equal(answersMatch('["3","2"]', '["2","3"]', "selection"), true);
  assert.equal(answersMatch('["2"]', '["2","3"]', "selection"), false);
  assert.equal(answersMatch('[]', '[]', "selection"), true);
  assert.equal(answersMatch('["2","2"]', '["2","3"]', "selection"), false);
  assert.equal(answersMatch("True", "Đúng", "true_false"), true);
  assert.equal(answersMatch("False", "sai", "true_false"), true);
  assert.equal(answersMatch("False", "True", "true_false"), false);
  assert.equal(answersMatch(" PARIS ", "Paris", "short_answer"), true);
  assert.equal(answersMatch("London", "Paris", "short_answer"), false);
  assert.equal(answersMatch("", "Paris", "short_answer"), false);
});

test("short answers have no verdict until judged, including an exact match", () => {
  const question: Question = { id: "q1", type: "short_answer", question: "What is France's capital?", correctAnswer: "Paris" };
  assert.equal(hasJudgedShortAnswer(question, "Paris", undefined), false);
  assert.equal(isAnswerCorrect("Paris", question), false);
  const grade = { isCorrect: true, isPartial: false, explanation: "You identified France's capital.",
    gradingToken: "model-receipt", judgedAnswer: "The city of Paris", verifiedFeedbackSignature: getQuestionFeedbackSignature(question) };
  assert.equal(isAnswerCorrect("The city of Paris", question, grade), true);
  assert.equal(isAnswerCorrect("Changed answer", question, grade), false);
  assert.equal(hasJudgedShortAnswer({ ...question, question: "Changed stem" }, grade.judgedAnswer, grade), false);
  assert.equal(hasJudgedShortAnswer(question, grade.judgedAnswer, { ...grade, gradingToken: undefined }), false);
  assert.equal(hasJudgedShortAnswer(question, grade.judgedAnswer, { ...grade, isCorrect: false, isPartial: true }), true);
  assert.equal(isAnswerCorrect(grade.judgedAnswer, question, { ...grade, isCorrect: false, isPartial: true }), false);
});
