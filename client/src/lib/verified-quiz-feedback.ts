import type { Question, ShortAnswerGradingResult } from "@shared/schema";
import { isCorrectOption, isValidSelectionQuestion, parseSelectionAnswer } from "@shared/selection-answer";
import { getQuestionFeedbackSignature, hasPreparedQuestionFeedback } from "@shared/quiz-feedback";
export { getQuestionFeedbackSignature } from "@shared/quiz-feedback";

export class QuizFeedbackError extends Error {
  constructor(public code: string) { super(code); }
}

export async function fetchJudgedShortAnswer(quizId: string | undefined, question: Question, answer: string, sourceText?: string | null): Promise<ShortAnswerGradingResult> {
  const response = await fetch("/api/grade-short-answer", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quizId, questionId: question.id, question: question.question,
      correctAnswer: question.correctAnswer, userAnswer: answer, sourceText: quizId ? undefined : sourceText || "" }),
  });
  const grade = await response.json();
  if (!response.ok || typeof grade.isCorrect !== "boolean" || typeof grade.isPartial !== "boolean" ||
      (grade.isCorrect && grade.isPartial) || typeof grade.explanation !== "string" || !grade.explanation.trim() ||
      typeof grade.gradingToken !== "string" || !grade.gradingToken) {
    throw new QuizFeedbackError("GRADING_UNAVAILABLE");
  }
  return { isCorrect: grade.isCorrect, isPartial: grade.isPartial, explanation: grade.explanation,
    gradingToken: grade.gradingToken, judgedAnswer: answer, verifiedFeedbackSignature: getQuestionFeedbackSignature(question) };
}

export function getQuizOptionExplanation(question: Question, feedback: ShortAnswerGradingResult | undefined, option: string): string | null {
  if (!feedback || feedback.verifiedFeedbackSignature !== getQuestionFeedbackSignature(question)) return null;
  return feedback.optionExplanations?.[option] || null;
}

export async function fetchVerifiedQuizFeedback(quizId: string | undefined, question: Question, selectedAnswer: string, sourceText?: string | null, quizLanguageContext?: string) {
  const response = await fetch("/api/generate-explanation", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(quizId ? { quizId, questionId: question.id } : {}),
      type: question.type, selectionMode: question.selectionMode, question: question.question, options: question.options,
      correctAnswer: question.correctAnswer, selectedAnswer,
      sourceText: quizId ? undefined : sourceText || "",
      quizLanguageContext: quizId ? undefined : quizLanguageContext?.slice(0, 8_000),
    }),
  });
  const feedback = await response.json();
  if (!response.ok) throw new QuizFeedbackError(feedback.code || "VERIFICATION_UNAVAILABLE");
  const verified = feedback.question as Question | undefined;
  if (feedback.verified !== true || !verified || !hasPreparedQuestionFeedback(verified) ||
      verified.type !== question.type || verified.question !== question.question ||
      JSON.stringify(verified.options) !== JSON.stringify(question.options) ||
      verified.correctAnswer !== question.correctAnswer ||
      (quizId && verified.id !== question.id) ||
      (verified.type === "selection" && !isValidSelectionQuestion(verified))) {
    throw new QuizFeedbackError("ANSWER_REVIEW_REQUIRED");
  }
  if (question.type !== "short_answer") {
    const selected = question.type === "selection" ? parseSelectionAnswer(selectedAnswer) : [selectedAnswer];
    const options = question.type === "true_false" ? ["True", "False"] : question.options || [];
    const expected = options.filter(option => isCorrectOption(option, question) || selected.includes(option));
    const entries = feedback.optionExplanations;
    if (!entries || typeof entries !== "object" || Array.isArray(entries) ||
        expected.some(option => typeof entries[option] !== "string" || !entries[option].trim()) ||
        Object.keys(entries).some(option => !expected.includes(option))) {
      throw new QuizFeedbackError("ANSWER_REVIEW_REQUIRED");
    }
  }
  return { ...feedback, question: { ...verified, id: question.id } as Question };
}
