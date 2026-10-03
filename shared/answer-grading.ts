import type { Question, ShortAnswerGradingResult } from "./schema.js";
import { selectionAnswersMatch } from "./selection-answer.js";
import { getQuestionFeedbackSignature } from "./quiz-feedback.js";

export function hasJudgedShortAnswer(question: Question, answer: string | undefined, grade: ShortAnswerGradingResult | undefined): boolean {
  return Boolean(answer?.trim() && grade?.gradingToken && grade.judgedAnswer === answer &&
    grade.verifiedFeedbackSignature === getQuestionFeedbackSignature(question) && grade.explanation.trim() &&
    typeof grade.isCorrect === "boolean" && typeof grade.isPartial === "boolean" && !(grade.isCorrect && grade.isPartial));
}

export function isAnswerCorrect(answer: string | undefined, question: Question, grade?: ShortAnswerGradingResult): boolean {
  if (question.type === "short_answer") return hasJudgedShortAnswer(question, answer, grade) && grade!.isCorrect;
  return answersMatch(answer, question.correctAnswer, question.type);
}

export function normalizeTrueFalseAnswer(answer: string | undefined): "true" | "false" | null {
  const normalized = answer?.trim().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d");
  if (["true", "t", "yes", "y", "dung"].includes(normalized || "")) return "true";
  if (["false", "f", "no", "n", "sai"].includes(normalized || "")) return "false";
  return null;
}

/** Compare answer-key text. Short-answer verdicts must instead come from the model judge. */
export function answersMatch(answer: string | undefined, correctAnswer: string | undefined, type: Question["type"]): boolean {
  if (!answer?.trim() || !correctAnswer?.trim()) return false;
  if (type === "selection") return selectionAnswersMatch(answer, correctAnswer);
  if (type === "true_false") {
    const normalized = normalizeTrueFalseAnswer(answer);
    return normalized !== null && normalized === normalizeTrueFalseAnswer(correctAnswer);
  }
  return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
}
