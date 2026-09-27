import type { Question } from "./schema.js";

export interface QuizImportSummary {
  sourceQuestionCount: number;
  multipleChoiceCount: number;
  skippedTrueFalse: number;
  skippedShortAnswer: number;
}

export function describeQuizImport(questions: readonly Question[], summary?: QuizImportSummary): string {
  const pending = getPendingImportQuestions(questions).length;
  const skipped = summary && (summary.skippedTrueFalse || summary.skippedShortAnswer)
    ? ` Skipped ${summary.skippedTrueFalse} true/false and ${summary.skippedShortAnswer} short-answer questions.` : "";
  return `${questions.length} multiple-choice questions imported in their original order.${skipped}${pending ? ` ${pending} need review before scoring.` : ""}`;
}

export function getPendingImportQuestions(questions: readonly Question[]): Question[] {
  return questions.filter((question) => Boolean(question.importReview));
}

export function confirmImportedQuestion(question: Question): Question {
  if (!question.question.trim()) throw new Error("Enter the full question text before confirming it.");
  if (!question.correctAnswer.trim()) throw new Error("Set the correct answer before confirming this question.");
  if (question.type !== "short_answer") {
    const options = question.options || [];
    if (options.length < 2 || options.some((option) => !option.trim()) || new Set(options).size !== options.length) {
      throw new Error("Provide at least two distinct, non-empty answer options.");
    }
    if (!options.includes(question.correctAnswer)) throw new Error("Choose the correct answer from this question's options.");
    if (question.type === "true_false" && (options.length !== 2 || !options.includes("True") || !options.includes("False"))) {
      throw new Error("True/false questions need True and False options.");
    }
  }
  const { importReview, ...confirmed } = question;
  return confirmed;
}
