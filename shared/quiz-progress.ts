import type { Quiz, QuizProgress } from "./schema.js";

export type ProgressQuizSummary = Pick<Quiz,
  "id" | "userId" | "title" | "difficulty" | "category" | "generationMode" | "isPublic"
> & { questionCount: number };

export type QuizProgressSummary = Pick<QuizProgress,
  "id" | "userId" | "quizId" | "answers" | "checkedQuestions" | "currentIndex" |
  "retryAnswers" | "retryCheckedQuestions" | "timeTaken"
> & { savedAt: string; quiz: ProgressQuizSummary; wrongQuestionCount: number };

export type QuizProgressDetail = QuizProgress & { quiz: Quiz };
