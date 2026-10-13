import { MAX_QUIZ_QUESTION_COUNT, type DifficultyLevel } from "./schema.js";

export interface PromptQuizSettings {
  questionCount: number;
  difficulty: DifficultyLevel;
  questionCountCapped?: boolean;
}

interface PromptQuizSettingsCandidate {
  questionCount?: unknown;
  questionCountSpecified?: unknown;
  difficulty?: unknown;
  difficultySpecified?: unknown;
}

const DEFAULT_QUESTION_COUNT = 10;
const MIN_QUESTION_COUNT = 3;
const DEFAULT_DIFFICULTY: DifficultyLevel = "medium";

const findExplicitQuestionCount = (prompt: string): number | null => {
  const patterns = [
    /\b(\d+)\s*[- ]?\s*(?:(?:easy|basic|beginner|medium|intermediate|hard|difficult|advanced|challenging)\s+)?(?:questions?|items?)\b/i,
    /\b(?:questions?|items?)\s*(?:count\s*)?(?:of\s*)?[:=]?\s*(\d+)\b/i,
    /\b(\d+)\s*câu\s*hỏi\b/iu,
    /\bsố\s*(?:lượng\s*)?câu\s*hỏi\s*[:=]?\s*(\d+)\b/iu,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const value = match ? Number(match[1]) : NaN;
    if (Number.isSafeInteger(value)) return value;
  }

  return null;
};

const findExplicitDifficulty = (prompt: string): DifficultyLevel | null => {
  const englishPatterns = [
    /\b(?:difficulty|level)\s*(?:of\s*)?[:=-]?\s*(easy|medium|hard)\b/i,
    /\b(easy|medium|hard)[ -]difficulty\b/i,
    /\b(?:make|set)\s+(?:it|the quiz)\s+(?:to\s+)?(easy|medium|hard)\b/i,
  ];

  for (const pattern of englishPatterns) {
    const match = prompt.match(pattern);
    if (match) return match[1].toLowerCase() as DifficultyLevel;
  }

  const descriptiveMatch = prompt.match(/\b(easy|basic|beginner|medium|intermediate|hard|difficult|advanced|challenging)\s+(?:quiz|questions?|items?)\b/i);
  if (descriptiveMatch) {
    const value = descriptiveMatch[1].toLowerCase();
    if (["easy", "basic", "beginner"].includes(value)) return "easy";
    if (["hard", "difficult", "advanced", "challenging"].includes(value)) return "hard";
    return "medium";
  }

  const vietnameseMatch = prompt.match(/(?:độ\s*khó|mức\s*độ)\s*[:=-]?\s*(dễ|trung\s*bình|khó)/iu);
  if (!vietnameseMatch) return null;

  const value = vietnameseMatch[1].toLocaleLowerCase("vi").replace(/\s+/g, " ");
  if (value === "dễ") return "easy";
  if (value === "khó") return "hard";
  return "medium";
};

export function resolvePromptQuizSettings(
  prompt: string,
  candidate: PromptQuizSettingsCandidate = {},
): PromptQuizSettings {
  const explicitQuestionCount = findExplicitQuestionCount(prompt);
  const candidateQuestionCount = Number(candidate.questionCount);
  const requestedQuestionCount = explicitQuestionCount ?? (
    candidate.questionCountSpecified === true &&
    Number.isSafeInteger(candidateQuestionCount)
      ? candidateQuestionCount
      : null
  );
  const questionCountCapped = requestedQuestionCount !== null && requestedQuestionCount > MAX_QUIZ_QUESTION_COUNT;
  const questionCount = requestedQuestionCount !== null && requestedQuestionCount >= MIN_QUESTION_COUNT
    ? Math.min(requestedQuestionCount, MAX_QUIZ_QUESTION_COUNT)
    : DEFAULT_QUESTION_COUNT;

  const explicitDifficulty = findExplicitDifficulty(prompt);
  const candidateDifficulty = typeof candidate.difficulty === "string"
    ? candidate.difficulty.toLowerCase()
    : "";
  const difficulty = explicitDifficulty ?? (
    candidate.difficultySpecified === true &&
    (candidateDifficulty === "easy" || candidateDifficulty === "medium" || candidateDifficulty === "hard")
      ? candidateDifficulty as DifficultyLevel
      : DEFAULT_DIFFICULTY
  );

  return {
    questionCount,
    difficulty,
    ...(questionCountCapped ? { questionCountCapped: true } : {}),
  };
}

