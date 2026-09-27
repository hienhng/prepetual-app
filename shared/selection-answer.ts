// Selection answers use JSON arrays inside the existing string answer fields.
// This preserves saved quiz/result compatibility and safely handles commas and math.
export function parseSelectionAnswer(value: unknown): string[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) && parsed.every(item => typeof item === "string" && item.trim())
      ? parsed : [];
  } catch {
    return [];
  }
}

export function encodeSelectionAnswer(options: string[]): string {
  return options.length ? JSON.stringify(options) : "";
}

export function selectionAnswersMatch(answer: unknown, correctAnswer: unknown): boolean {
  const selected = parseSelectionAnswer(answer);
  const correct = parseSelectionAnswer(correctAnswer);
  return correct.length >= 2 && selected.length === correct.length &&
    new Set(selected).size === selected.length && new Set(correct).size === correct.length &&
    correct.every(option => selected.includes(option));
}

export function isValidSelectionQuestion(question: { options?: string[]; correctAnswer: string }): boolean {
  const options = question.options || [];
  const correct = parseSelectionAnswer(question.correctAnswer);
  return options.length >= 2 && options.every(option => Boolean(option.trim())) &&
    new Set(options.map(option => option.trim().toLowerCase())).size === options.length &&
    correct.length >= 2 && new Set(correct).size === correct.length &&
    correct.every(option => options.includes(option));
}

export function formatAnswer(answer: string | undefined, type: string): string {
  return type === "selection" ? parseSelectionAnswer(answer).join("; ") : answer || "";
}

export function isCorrectOption(option: string, question: { type: string; correctAnswer: string }): boolean {
  return question.type === "selection" ? parseSelectionAnswer(question.correctAnswer).includes(option)
    : option.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
}
