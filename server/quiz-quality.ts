const CHOICE_PREFIX = /^\s*(?:[A-Ha-h]|[1-8])\s*[).:\-]\s*/u;
const GENERIC_CHOICE = /^(?:option|answer|choice|response|placeholder|đáp\s*án|phương\s*án|lựa\s*chọn)\s*[:#\-]?\s*(?:[a-h]|[1-8])$/iu;

function normalizeChoice(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
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
