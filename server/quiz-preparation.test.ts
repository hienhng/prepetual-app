import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "../shared/schema.js";
import { hasPreparedQuestionFeedback, markQuestionFeedbackPrepared } from "../shared/quiz-feedback.js";
import { preserveVerifiedQuizQuestions } from "./quiz-preparation.js";

const question: Question = { id: "q1", type: "multiple_choice", question: "Where does boiling vaporize liquid?",
  options: ["Inside only", "Inside and surface"], correctAnswer: "Inside and surface", explanation: "Boiling happens throughout the liquid and at its surface." };

test("edits preserve only unchanged server-verified answers and defer new questions to grading", () => {
  const verified = markQuestionFeedbackPrepared(question);
  const unchanged = preserveVerifiedQuizQuestions([{ ...verified }], [verified]);
  assert.equal(unchanged[0], verified);
  for (const incoming of [verified, { ...verified, correctAnswer: "Inside only" }, { ...verified, id: "new" }]) {
    const result = preserveVerifiedQuizQuestions([incoming], incoming === verified ? [] : [verified]);
    assert.equal(hasPreparedQuestionFeedback(result[0]), false);
    assert.equal(result[0].correctAnswer, incoming.correctAnswer);
  }
  assert.deepEqual(preserveVerifiedQuizQuestions([question], []), [question]);
});
