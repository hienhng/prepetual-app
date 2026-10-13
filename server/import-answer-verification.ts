import type { QuestionType } from "../shared/schema.js";
import { normalizeMultipleChoiceAnswerSet } from "./quiz-quality.js";

type Response = Record<string, unknown>;
type Answer = Record<string, unknown>;
const records = (value: unknown): Answer[] => Array.isArray(value)
  ? value.filter((item): item is Answer => item !== null && typeof item === "object" && !Array.isArray(item)) : [];

function answerKey(answer: Answer, type?: QuestionType): string | undefined {
  if (type === "true_false" || type === "short_answer") {
    if (typeof answer.correctAnswer !== "string" || !answer.correctAnswer.trim()) return undefined;
    const text = answer.correctAnswer.trim().toLocaleLowerCase().replace(/\s+/gu, " ");
    return `text:${type === "true_false" ? text.replace(/^đúng$/u, "true").replace(/^sai$/u, "false") : text}`;
  }
  if (Array.isArray(answer.correctOptionIndexes) && (type === "selection" || (!type && answer.correctOptionIndexes.length))) {
    if (!answer.correctOptionIndexes.every(Number.isInteger)) return undefined;
    return `selection:${[...answer.correctOptionIndexes].sort((a, b) => Number(a) - Number(b)).join(",")}`;
  }
  if (Number.isInteger(answer.correctOptionIndex)) return `option:${answer.correctOptionIndex}`;
  if (typeof answer.correctAnswer === "string" && answer.correctAnswer.trim()) return `text:${answer.correctAnswer.trim().toLocaleLowerCase()}`;
  // Grouped truth judgments can have an intentionally empty true set.
  if (Array.isArray(answer.correctOptionIndexes)) return "selection:";
  return undefined;
}

/** Agreement is a prerequisite, not proof of correctness. Uncertainty from
 * either independent check must remain visible instead of being overwritten. */
export function reconcileImportAnswerChecks(reasoning: Response, visual: Response, types = new Map<string, QuestionType>()): Response {
  const second = records(visual.answers);
  return {
    ...reasoning,
    answers: records(reasoning.answers).map(answer => {
      const matches = second.filter(candidate => candidate.sourceId === answer.sourceId);
      const other = matches.length === 1 ? matches[0] : undefined;
      const type = types.get(String(answer.sourceId));
      if (answer.verified === true && other?.verified === true && answerKey(answer, type) !== undefined && answerKey(answer, type) === answerKey(other, type)) return answer;
      return {
        ...answer,
        verified: false,
        reason: `Independent answer checks could not establish the same verified answer. ${typeof answer.reason === "string" && answer.reason ? answer.reason : typeof other?.reason === "string" ? other.reason : "Review the answer against the original source or an answer key."}`,
      };
    }),
  };
}

export type ImportAnswerItem = {
  sourceId: string;
  type: QuestionType;
  options?: string[];
  [key: string]: unknown;
};

/** Validate each channel before comparing answers. A malformed answer must not
 * become verified merely because both responses repeat the same bad value. */
function checkedAnswer(response: Response, item: ImportAnswerItem): Answer | undefined {
  const matches = records(response.answers).filter(answer => answer.sourceId === item.sourceId);
  if (matches.length !== 1) return undefined;
  const answer = matches[0];
  if (typeof answer.verified !== "boolean") return undefined;
  if (!answer.verified) return answer;
  if (typeof answer.solution !== "string" || !answer.solution.trim()) return undefined;
  if (item.type === "multiple_choice") {
    const options = item.options || [];
    if (Number.isInteger(answer.correctOptionIndex) && Number(answer.correctOptionIndex) >= 0 && Number(answer.correctOptionIndex) < options.length) return answer;
    const mapped = typeof answer.correctAnswer === "string" ? normalizeMultipleChoiceAnswerSet(options, answer.correctAnswer) : null;
    return mapped ? { ...answer, correctOptionIndex: options.indexOf(mapped.correctAnswer) } : undefined;
  }
  if (item.type === "selection") {
    const indexes = answer.correctOptionIndexes;
    return Array.isArray(indexes) && indexes.every(index => Number.isInteger(index) && index >= 0 && index < (item.options?.length || 0)) && new Set(indexes).size === indexes.length ? answer : undefined;
  }
  if (typeof answer.correctAnswer !== "string" || !answer.correctAnswer.trim()) return undefined;
  if (item.type === "true_false") {
    const value = answer.correctAnswer.trim().toLocaleLowerCase().replace(/[.!]$/u, "");
    if (!["true", "false", "đúng", "sai"].includes(value)) return undefined;
    return { ...answer, correctAnswer: ["true", "đúng"].includes(value) ? "True" : "False" };
  }
  return answer;
}

/** One targeted retry per channel and item. Rechecks are independent: neither
 * model sees the other's proposed answer, and source layout is never modified. */
export async function verifyImportAnswersWithRetry(
  prompt: string,
  items: ImportAnswerItem[],
  request: (prompt: string, visual: boolean) => Promise<Response>,
): Promise<Response> {
  const attempt = async (nextPrompt: string, visual: boolean): Promise<Response> => {
    try { return await request(nextPrompt, visual); }
    catch { return {}; }
  };
  const reasoning = await attempt(prompt, false);
  const visual = await attempt(prompt, true);
  const types = new Map(items.map(item => [item.sourceId, item.type]));
  const answers: Answer[] = [];
  const prefix = prompt.slice(0, prompt.lastIndexOf("\nITEMS:\n"));
  for (const item of items) {
    let first = checkedAnswer(reasoning, item);
    let second = checkedAnswer(visual, item);
    const agrees = () => first?.verified === true && second?.verified === true && answerKey(first, item.type) === answerKey(second, item.type);
    if (!agrees()) {
      const retryPrompt = `${prefix}\nAUTOMATIC TARGETED RECHECK: An earlier check was incomplete, malformed, uncertain, or inconsistent. Solve this one item afresh using the original source, context, images when supplied, and an explicit answer key when present. Check EVERY alternative and explain the decisive reasoning. Do not infer correctness from a previous model answer. Preserve the exact sourceId and return exactly one answer with a nonempty solution and the response fields required by its type. If the source is incomplete, alternatives remain ambiguous, or a fact cannot be established, return verified:false with a reason; never guess.\nITEMS:\n${JSON.stringify([item])}`;
      // For incomplete output, retain the other channel's already valid answer.
      // Retry uncertain checks; disagreement requires a fresh check in both.
      const recheckBoth = first?.verified === true && second?.verified === true;
      if (first?.verified !== true || recheckBoth) first = checkedAnswer(await attempt(retryPrompt, false), item);
      if (second?.verified !== true || recheckBoth) second = checkedAnswer(await attempt(retryPrompt, true), item);
    }
    const result = reconcileImportAnswerChecks(
      { answers: [first || { sourceId: item.sourceId, verified: false, reason: "The answer response remained incomplete or malformed after an automatic retry." }] },
      { answers: [second || { sourceId: item.sourceId, verified: false, reason: "The independent visual answer response remained incomplete or malformed after an automatic retry." }] },
      types,
    );
    answers.push(...records(result.answers));
  }
  return { ...visual, ...reasoning, answers };
}
