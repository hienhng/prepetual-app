import type { Question } from "./schema.js";
import { isCorrectOption, isValidSelectionQuestion } from "./selection-answer.js";

export function getQuestionFeedbackSignature(question: Question): string {
  return JSON.stringify([question.type, question.question, question.options, question.correctAnswer,
    question.selectionMode, question.explanation, question.imageUrl, question.sourceChunkIds,
    Object.entries(question.wrongAnswerExplanations || {}).sort(([a], [b]) => a.localeCompare(b))]);
}

export function hasCompleteQuestionFeedback(question: Question): boolean {
  if (question.importReview || !question.explanation?.trim() || !question.correctAnswer.trim()) return false;
  if (question.type === "short_answer") return true;
  const options = question.type === "true_false" ? ["True", "False"] : question.options || [];
  if (options.length < 2 || options.some(option => !option.trim()) || new Set(options).size !== options.length) return false;
  if (question.type === "selection" ? !isValidSelectionQuestion(question)
    : options.filter(option => isCorrectOption(option, question)).length !== 1) return false;
  // Wrong-option feedback is requested after submission and is not a prerequisite
  // for a verified answer key. Supplied legacy feedback must still be coherent.
  return Object.entries(question.wrongAnswerExplanations || {}).every(([option, explanation]) =>
    options.includes(option) && !isCorrectOption(option, question) && Boolean(explanation.trim()));
}

export function hasPreparedQuestionFeedback(question: Question): boolean {
  return hasCompleteQuestionFeedback(question) && question.feedbackVerification?.version === 2 &&
    question.feedbackVerification.signature === getQuestionFeedbackSignature(question);
}

/** Called only after a server-side audit has approved the final feedback. */
export function markQuestionFeedbackPrepared(question: Question): Question {
  return { ...question, feedbackVerification: { version: 2, signature: getQuestionFeedbackSignature(question) } };
}
