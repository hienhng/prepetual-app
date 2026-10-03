import type { Question } from "../shared/schema.js";
import { getQuestionFeedbackSignature, hasPreparedQuestionFeedback } from "../shared/quiz-feedback.js";

/** Saving edits never calls AI. Only unchanged server-verified feedback may be reused. */
export function preserveVerifiedQuizQuestions(questions: Question[], originals: Question[]): Question[] {
  const saved = new Map(originals.map(question => [question.id, question]));
  return questions.map(question => {
    const original = saved.get(question.id);
    if (original && !question.importReview && hasPreparedQuestionFeedback(original) &&
        getQuestionFeedbackSignature(original) === getQuestionFeedbackSignature(question)) return original;
    const { feedbackVerification: _untrusted, ...candidate } = question;
    return candidate;
  });
}
