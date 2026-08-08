const CHOICE_PREFIX = /^\s*(?:[A-Ha-h]|[1-8])\s*[).:\-]\s*/u;
const GENERIC_CHOICE = /^(?:option|answer|choice|response|placeholder|đáp\s*án|phương\s*án|lựa\s*chọn)\s*[:#\-]?\s*(?:[a-h]|[1-8])$/iu;

function normalizeChoice(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
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

  const withoutPrefixes = normalized.map((option) => option.replace(CHOICE_PREFIX, "").trim());
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
