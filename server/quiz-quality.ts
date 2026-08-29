const CHOICE_PREFIX = /^\s*(?:\(([A-Ha-h]|[1-8])\)|([A-Ha-h]|[1-8])\s*[).:\-])(?!\d)\s*/u;
const CHOICE_LABEL_ONLY = /^\s*(?:\(([A-Ha-h]|[1-8])\)|([A-Ha-h]|[1-8])\s*[).:\-]?)\s*$/u;
const GENERIC_CHOICE = /^(?:option|answer|choice|response|placeholder|đáp\s*án|phương\s*án|lựa\s*chọn)\s*[:#\-]?\s*(?:[a-h]|[1-8])$/iu;

function normalizeChoice(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects questions about where content sits in the uploaded artifact rather
 * than questions that teach or assess the artifact's subject matter.
 */
export function isSourceStructureMetadataQuestion(question: unknown): boolean {
  if (typeof question !== "string" || !question.trim()) return false;

  const searchable = normalizeSearchText(question);
  const englishLocationQuestion =
    /\b(?:what|which)\s+page\b/u.test(searchable) ||
    /\bon\s+(?:what|which)\s+page\b/u.test(searchable) ||
    /\bwhere\b[^?]{0,100}\b(?:document|file|worksheet|source|study material|text|slide deck)\b/u.test(searchable) ||
    /\b(?:question|item|problem|exercise)\s*(?:number|no\.?|#)?\s*\d+\b[^?]{0,100}\b(?:page|section|slide)\b/u.test(searchable) ||
    /\b(?:page|section|slide)\b[^?]{0,100}\b(?:question|item|problem|exercise)\s*(?:number|no\.?|#)?\s*\d+\b/u.test(searchable) ||
    /\bhow many\s+(?:pages|questions|items|sections|slides)\b[^?]{0,100}\b(?:document|file|worksheet|source|material|text|deck)\b/u.test(searchable);

  const vietnameseLocationQuestion =
    /\btrang nao\b/u.test(searchable) ||
    /\b(?:cau hoi|cau|bai)\s*(?:so|thu)?\s*\d+\b[^?]{0,100}\b(?:trang|phan|muc)\b/u.test(searchable) ||
    /\b(?:trang|phan|muc)\b[^?]{0,100}\b(?:cau hoi|cau|bai)\s*(?:so|thu)?\s*\d+\b/u.test(searchable) ||
    /\bco bao nhieu\s+(?:trang|cau hoi|cau|phan|muc)\b[^?]{0,100}\b(?:tai lieu|tep|van ban|de|bai)\b/u.test(searchable);

  return englishLocationQuestion || vietnameseLocationQuestion;
}

function getChoicePrefixLabel(value: string): string | null {
  const match = String(value ?? "").normalize("NFKC").match(CHOICE_PREFIX);
  return (match?.[1] || match?.[2] || "").toUpperCase() || null;
}

function getChoiceOnlyLabel(value: string): string | null {
  const match = String(value ?? "").normalize("NFKC").match(CHOICE_LABEL_ONLY);
  return (match?.[1] || match?.[2] || "").toUpperCase() || null;
}

/** Removes a source-document label such as `A)`, `C.`, `(b)`, or `2:`. */
export function stripChoicePrefix(value: string): string {
  return String(value ?? "").normalize("NFKC").replace(CHOICE_PREFIX, "").trim();
}

export type NormalizedMultipleChoiceAnswerSet = {
  options: string[];
  correctAnswer: string;
};

/**
 * Resolves the answer against the original labeled choices, then removes the
 * labels from both the choices and the answer. Returning null is deliberate:
 * guessing when the answer cannot be mapped uniquely can silently corrupt the
 * answer key when choices are shuffled later.
 */
export function normalizeMultipleChoiceAnswerSet(
  options: string[],
  correctAnswer: string,
): NormalizedMultipleChoiceAnswerSet | null {
  const rawOptions = options.map((option) => String(option ?? "").normalize("NFKC").trim());
  const rawAnswer = String(correctAnswer ?? "").normalize("NFKC").trim();
  if (rawOptions.length === 0 || !rawAnswer) return null;

  let matchingIndexes = rawOptions
    .map((option, index) => option === rawAnswer ? index : -1)
    .filter((index) => index >= 0);

  if (matchingIndexes.length !== 1) {
    const answerLabel = getChoiceOnlyLabel(rawAnswer);
    if (answerLabel) {
      matchingIndexes = rawOptions
        .map((option, index) => getChoicePrefixLabel(option) === answerLabel ? index : -1)
        .filter((index) => index >= 0);

      // Some model responses return only "B" even though the extracted
      // options no longer contain labels. In that case use the conventional
      // position, but only when there was no competing source label to honor.
      if (matchingIndexes.length === 0 && rawOptions.every((option) => !getChoicePrefixLabel(option))) {
        const conventionalIndex = /^[A-H]$/u.test(answerLabel)
          ? answerLabel.charCodeAt(0) - 65
          : Number(answerLabel) - 1;
        matchingIndexes = conventionalIndex >= 0 && conventionalIndex < rawOptions.length
          ? [conventionalIndex]
          : [];
      }
    }
  }

  if (matchingIndexes.length !== 1) {
    const normalizedAnswer = normalizeChoice(stripChoicePrefix(rawAnswer));
    matchingIndexes = rawOptions
      .map((option, index) => normalizeChoice(stripChoicePrefix(option)) === normalizedAnswer ? index : -1)
      .filter((index) => index >= 0);
  }

  if (matchingIndexes.length !== 1) return null;

  const normalizedOptions = rawOptions.map(stripChoicePrefix);
  if (normalizedOptions.some((option) => !option)) return null;
  if (new Set(normalizedOptions.map(normalizeChoice)).size !== normalizedOptions.length) return null;

  return {
    options: normalizedOptions,
    correctAnswer: normalizedOptions[matchingIndexes[0]],
  };
}

/** Detects answer choices that were incorrectly appended to a question stem. */
export function hasEmbeddedMultipleChoiceOptions(question: unknown): boolean {
  if (typeof question !== "string" || !question.trim()) return false;

  const searchable = question.normalize("NFKC").replace(/[*_`]/g, "");
  const labels = Array.from(
    searchable.matchAll(/(?:^|\s)(?:\(([A-H])\)|([A-H])[).:\-])(?=\s)/giu),
    (match) => (match[1] || match[2]).toUpperCase(),
  );

  // Requiring a sequence of at least three labels avoids treating an ordinary
  // mention such as "vitamin A" as an embedded answer set.
  for (let index = 0; index <= labels.length - 3; index++) {
    if (labels[index] === "A" && labels[index + 1] === "B" && labels[index + 2] === "C") {
      return true;
    }
  }

  return false;
}

/** Returns why generated multiple-choice options have no usable answer content. */
export function getMultipleChoiceOptionQualityIssue(options: string[]): string | null {
  if (options.length !== 4) return "expected exactly four answer choices";

  const normalized = options.map((option) => normalizeChoice(String(option ?? "")));
  if (normalized.some((option) => option.length === 0)) return "contains an empty answer choice";
  if (new Set(normalized).size !== normalized.length) return "contains duplicate answer choices";

  const withoutPrefixes = normalized.map(stripChoicePrefix);
  if (withoutPrefixes.some((option) => option.length === 0)) {
    return "contains a choice label without answer text";
  }

  if (normalized.every((option) => /^[a-h]$/u.test(option))) {
    return "contains only choice labels instead of answers";
  }
  if (normalized.every((option) => GENERIC_CHOICE.test(option))) {
    return "contains generic placeholder answers";
  }

  const normalizedContent = withoutPrefixes.map((option) => option.replace(/[.!?]+$/u, "").trim());
  if (new Set(normalizedContent).size !== normalizedContent.length) {
    return "contains duplicate answer text behind different labels";
  }

  return null;
}
