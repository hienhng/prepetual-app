import type { Question, QuestionType } from "../shared/schema.js";
import { randomUUID } from "node:crypto";

export type SourceItem = {
  id: string;
  label: string;
  text: string;
  context: string;
  originalText?: string;
  answerKey?: string;
  reviewReason?: string;
};

export function sourceBlocks(text: string) {
  return text.split(/\r?\n/u).map((text, index) => ({ id: `b${index + 1}`, text }));
}

export function exactSourceQuote(source: string, quote: unknown): string | null {
  if (typeof quote !== "string" || !quote.trim()) return null;
  const words = quote.trim().split(/\s+/u).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return source.match(new RegExp(words.join("\\s+"), "u"))?.[0] ?? null;
}

export function stripChoiceLabel(text: string) {
  return text.replace(/^\s*(?:\([A-Ha-h1-8]\)|[A-Ha-h1-8][).:：\-]|[•●▪])\s*/u, "").trim();
}

/** Keep a local answer with its own item, never in a learner-facing option. */
export function separateItemAnswer(item: SourceItem): SourceItem {
  const match = /(?:^|\n)[ \t]*(?:\*{1,2}|_{1,2})?(?:Đáp án|Answers?(?: key)?|Solution|Lời giải)[ \t]*(?:[:：][ \t]*(?:\*{1,2}|_{1,2})?|(?:\*{1,2}|_{1,2})?[ \t]*(?=\r?\n|$))/iu.exec(item.text);
  if (!match || !item.text.slice(0, match.index).trim()) return item;
  return { ...item, originalText: item.originalText || item.text, text: item.text.slice(0, match.index).trim(), answerKey: item.text.slice(match.index).trim() };
}

export function binaryTruthOptions(options?: string[]): boolean {
  const labels = options?.map(option => option.trim().toLowerCase().replace(/[.!]$/u, ""));
  return labels?.length === 2 && ((labels.includes("true") && labels.includes("false")) || (labels.includes("đúng") && labels.includes("sai"))) || false;
}

/** Recognize an explicit per-statement truth key only when EVERY statement is
 * covered without contradictory labels. Ambiguous keys stay with the model. */
export function readTruthStatementKey(answerKey: string | undefined, optionCount: number): number[] | null {
  if (!answerKey || optionCount < 2) return null;
  const verdicts = new Map<number, boolean>();
  const rows = answerKey.replace(/[*_]/gu, "");
  const groups = rows.matchAll(/\b([A-H](?:[ \t]*(?:,|;|và|and|&)[ \t]*[A-H])*)[ \t]*(?:[:=–-][ \t]*)?(đúng|sai|true|false)\b/giu);
  for (const group of groups) {
    const correct = /^(đúng|true)$/iu.test(group[2]);
    for (const label of group[1].toUpperCase().match(/\b[A-H]\b/gu) || []) {
      const index = label.charCodeAt(0) - 65;
      if (index >= optionCount || verdicts.has(index) && verdicts.get(index) !== correct) return null;
      verdicts.set(index, correct);
    }
  }
  return verdicts.size === optionCount ? Array.from({ length: optionCount }, (_, i) => i).filter(i => verdicts.get(i)) : null;
}

/** References contain source block IDs, not model-authored question wording.
 * Every nonempty block must be accounted for, and blocks may not be reused. */
export function questionFromBlockReferences(raw: any, item: SourceItem, type: QuestionType): Question | null {
  if (raw?.sourceId !== item.id || !Array.isArray(raw.stemBlockIds)) return null;
  const blocks = sourceBlocks(item.text);
  const used = new Set<string>();
  let lastFieldIndex = -1;
  const read = (ids: unknown, supporting = false): string | null => {
    if (!Array.isArray(ids) || !ids.length) return null;
    let previous = -1;
    const parts: string[] = [];
    for (const id of ids) {
      const index = blocks.findIndex(block => block.id === id);
      if (index < 0 || index <= previous || used.has(id) || !supporting && index <= lastFieldIndex) return null;
      used.add(id); previous = index; parts.push(blocks[index].text);
      if (!supporting) lastFieldIndex = index;
    }
    return parts.join("\n").trim() || null;
  };
  const stem = read(raw.stemBlockIds);
  if (!stem) return null;
  const options: string[] = [];
  if (raw.optionBlockIds !== undefined && !Array.isArray(raw.optionBlockIds)) return null;
  for (const ids of raw.optionBlockIds || []) {
    const option = read(ids);
    if (!option) return null;
    options.push(stripChoiceLabel(option));
  }
  // Any intentionally omitted source material must be explicit and reviewed.
  const ignored = raw.ignoredBlocks || [];
  if (!Array.isArray(ignored)) return null;
  for (const entry of ignored) {
    if (!["heading", "footer", "shared_context", "answer_key"].includes(entry?.reason) || !read(entry.blockIds, true)) return null;
  }
  if (blocks.some(block => block.text.trim() && !used.has(block.id))) return null;
  if ((type === "multiple_choice" || type === "selection") && (options.length < 2 || options.some(option => !option) || new Set(options).size !== options.length)) return null;
  if (type === "short_answer" && options.length) return null;
  if (type === "true_false" && options.length && !binaryTruthOptions(options)) return null;
  const context = raw.context ? exactSourceQuote(item.context, raw.context) : "";
  if (context === null) return null;
  const question: Question = {
    id: randomUUID(), type, question: context ? `${context}\n\n${stem}` : stem,
    options: type === "true_false" ? ["True", "False"] : type === "short_answer" ? undefined : options,
    correctAnswer: "",
  };
  if (ignored.length) question.importReview = { sourceLabel: item.label, sourceText: item.originalText || item.text, stage: "structure", reason: "Some source blocks were classified as supporting material. Confirm that the full question and every option were retained." };
  return question;
}
