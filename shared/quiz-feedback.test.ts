import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "./schema.js";
import { hasPreparedQuestionFeedback, markQuestionFeedbackPrepared } from "./quiz-feedback.js";

const question: Question = { id: "q1", type: "multiple_choice", question: "Which number is prime?", options: ["2", "4"],
  correctAnswer: "2", explanation: "2 has exactly two divisors.", wrongAnswerExplanations: { "4": "4 has three divisors." } };

test("saved feedback survives retries and JSON persistence but becomes invalid after substantive edits", () => {
  const prepared = markQuestionFeedbackPrepared(question);
  assert.ok(hasPreparedQuestionFeedback(JSON.parse(JSON.stringify(prepared))));
  assert.ok(hasPreparedQuestionFeedback({ ...prepared, id: "retry-q1" }));
  for (const change of [
    { question: "Which number is composite?" }, { correctAnswer: "4" }, { options: ["2", "6"] },
    { explanation: "A contradictory explanation" }, { imageUrl: "new-image" }, { sourceChunkIds: ["new-evidence"] },
    { wrongAnswerExplanations: { "4": "An edited explanation" } },
  ]) assert.equal(hasPreparedQuestionFeedback({ ...prepared, ...change }), false);
});

test("incomplete or contradictory option feedback and unresolved imports cannot be played as verified", () => {
  for (const candidate of [
    question,
    markQuestionFeedbackPrepared({ ...question, explanation: "" }),
    markQuestionFeedbackPrepared({ ...question, wrongAnswerExplanations: { ...question.wrongAnswerExplanations, "2": "This correct option is wrong" } }),
    markQuestionFeedbackPrepared({ ...question, correctAnswer: "Not an option" }),
    markQuestionFeedbackPrepared({ ...question, importReview: { sourceLabel: "1", sourceText: "Source", reason: "Needs review" } }),
  ]) assert.equal(hasPreparedQuestionFeedback(candidate), false);
});

test("verified keys do not require pre-generated distractor explanations and legacy approvals are rechecked", () => {
  const { wrongAnswerExplanations: _wrong, ...answerOnly } = question;
  assert.ok(hasPreparedQuestionFeedback(markQuestionFeedbackPrepared(answerOnly)));
  const prepared = markQuestionFeedbackPrepared(answerOnly);
  assert.equal(hasPreparedQuestionFeedback({ ...prepared, feedbackVerification: { ...prepared.feedbackVerification!, version: 1 } }), false);
  assert.ok(hasPreparedQuestionFeedback(markQuestionFeedbackPrepared({ ...answerOnly, type: "short_answer", options: [], correctAnswer: "2" })));
});

test("grouped truth statements with no correct choices still have complete prepared feedback", () => {
  const prepared = markQuestionFeedbackPrepared({ ...question, type: "selection", selectionMode: "truth_statements", correctAnswer: "[]",
    explanation: "Neither statement is true.", wrongAnswerExplanations: { "2": "First statement is false.", "4": "Second statement is false." } });
  assert.ok(hasPreparedQuestionFeedback(prepared));
});
