export const QUIZ_VALIDATION_BATCH_SIZE = 5;
export const QUIZ_VALIDATION_CONCURRENCY = 2;
export const QUIZ_MODEL_REQUEST_TIMEOUT_MS = 45_000;
export const QUIZ_GENERATION_CONTEXT_MAX_CHARS = 30_000;
export const QUIZ_TOP_UP_ATTEMPTS = 3;

export type QuizRagBudget = {
  maxChunks: number;
  maxChars: number;
};

export function getQuizRagBudget(questionCount: number): QuizRagBudget {
  const count = Math.max(3, Math.min(20, Math.floor(questionCount)));
  return {
    maxChunks: Math.min(20, Math.max(10, Math.ceil(count * 0.8))),
    maxChars: Math.min(30_000, Math.max(14_000, count * 1_200)),
  };
}

export function getInitialQuizCandidateCount(questionCount: number): number {
  return Math.max(3, Math.min(20, Math.floor(questionCount)));
}

export function needsQuizAnswerCompletion(candidate: unknown): boolean {
  if (!candidate || typeof candidate !== "object") return true;
  const question = candidate as Record<string, unknown>;
  const correctAnswer = typeof question.correctAnswer === "string"
    ? question.correctAnswer.trim()
    : "";
  const explanation = typeof question.explanation === "string"
    ? question.explanation.trim()
    : "";
  if (!correctAnswer || !explanation) return true;

  if (question.type === "multiple_choice") {
    return !Array.isArray(question.options) || question.options.length !== 4;
  }
  if (question.type === "true_false") {
    return !["true", "false"].includes(correctAnswer.toLowerCase());
  }
  return question.type !== "short_answer";
}

export function getQuizQuestionDeficit(requestedCount: number, generatedCount: number): number {
  const requested = Math.max(0, Math.floor(requestedCount));
  const generated = Math.max(0, Math.floor(generatedCount));
  return Math.max(0, requested - generated);
}

export function getQuizTopUpCandidateCount(missingQuestionCount: number): number {
  const missing = Math.max(1, Math.floor(missingQuestionCount));
  return Math.min(8, Math.max(4, missing * 2));
}

export function getQuizGenerationContext(sourceText: string | undefined): string {
  const normalized = sourceText?.trim() || "";
  if (normalized.length <= QUIZ_GENERATION_CONTEXT_MAX_CHARS) return normalized;
  return normalized.slice(0, QUIZ_GENERATION_CONTEXT_MAX_CHARS);
}

export type QuizGenerationErrorCode =
  | "GENERATION_FAILED"
  | "INSUFFICIENT_VALID_QUESTIONS";

export class QuizGenerationError extends Error {
  readonly code: QuizGenerationErrorCode;
  readonly stage: string;
  readonly requested?: number;
  readonly generated?: number;

  constructor(params: {
    code: QuizGenerationErrorCode;
    message: string;
    stage: string;
    requested?: number;
    generated?: number;
    cause?: unknown;
  }) {
    super(params.message, params.cause === undefined ? undefined : { cause: params.cause });
    this.name = "QuizGenerationError";
    this.code = params.code;
    this.stage = params.stage;
    this.requested = params.requested;
    this.generated = params.generated;
  }
}

export function getQuizGenerationErrorPayload(error: unknown): {
  message: string;
  code?: QuizGenerationErrorCode;
  stage?: string;
  requested?: number;
  generated?: number;
} {
  if (error instanceof QuizGenerationError) {
    return {
      message: error.message,
      code: error.code,
      stage: error.stage,
      requested: error.requested,
      generated: error.generated,
    };
  }

  return {
    message: error instanceof Error ? error.message : "Failed to generate quiz",
  };
}
