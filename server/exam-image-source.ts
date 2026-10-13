import { z } from "zod";
import type { QuestionType } from "../shared/schema.js";
import { inventoryNumberedQuestions, QuizImportError, type ImportSourceCheck } from "./quiz-import.js";

const choiceLabels = z.array(z.string().regex(/^[A-H]$/u)).max(8);
const pageSchema = z.object({
  transcription: z.string().trim().min(1),
  questions: z.array(z.object({
    label: z.string().min(1),
    type: z.enum(["multiple_choice", "selection", "true_false", "short_answer", "unknown"]),
    optionLabels: choiceLabels,
    expectedOptionLabels: choiceLabels,
    continuesOnNextPage: z.boolean(),
    unreadable: z.boolean(),
    truthStatements: z.boolean().default(false),
  })),
  leadingOptionLabels: choiceLabels,
});
export type VerifiedExamImagePage = z.infer<typeof pageSchema>;

export const normalizeExamLabel = (label: string) => label.toLocaleLowerCase().replace(/[\s.:：)]/gu, "");
const optionsIn = (text: string) => [...text.matchAll(/(?:^|\s)(?:\(([A-Ha-h])\)|([A-Ha-h])[).:：])[ \t]*/gu)]
  .map(match => (match[1] || match[2]).toUpperCase());

/** The independent visual inventory must agree with the reconciled transcript,
 * including occurrences: sets would hide invented duplicate questions. */
export function parseExamImagePageReview(value: unknown): VerifiedExamImagePage {
  const result = pageSchema.safeParse(value);
  if (!result.success) throw new Error("Image review did not return complete question coverage. Please retry the import.");
  const page = result.data;
  if (/^\s*\[(?:Note\b|Bottom sheet\b)/imu.test(page.transcription)) {
    throw new Error("Image review included commentary in the exam text. Please retry the import.");
  }
  const inventory = inventoryNumberedQuestions(page.transcription) || [];
  if (inventory.length !== page.questions.length || inventory.some((item, index) =>
    normalizeExamLabel(item.label) !== normalizeExamLabel(page.questions[index].label)
    || JSON.stringify(optionsIn(item.text)) !== JSON.stringify(page.questions[index].optionLabels))) {
    throw new Error("Image review question/option coverage does not match the transcription. Please retry the import.");
  }
  const prefix = inventory[0]?.context;
  if (prefix !== undefined && JSON.stringify(optionsIn(prefix)) !== JSON.stringify(page.leadingOptionLabels)) {
    throw new Error("Image review omitted page-continuation choices. Please retry the import.");
  }
  return page;
}

/** Join only verified source text; metadata and page boundaries remain separate.
 * A single newline allows a stem or option to continue onto the next page. */
export function joinVerifiedExamImagePages(pages: VerifiedExamImagePage[]) {
  const coverage = pages.flatMap(page => page.questions);
  const text = pages.map(page => page.transcription.trim()).join("\n");
  // Unnumbered exams retain their existing line-inventory parser after visual
  // reconciliation; never fabricate printed question numbers.
  if (!coverage.length) return { text, sourceChecks: undefined, pages };
  const inventory = inventoryNumberedQuestions(text);
  if (!inventory || inventory.length !== coverage.length || inventory.some((item, index) =>
    normalizeExamLabel(item.label) !== normalizeExamLabel(coverage[index].label))) {
    throw new QuizImportError("The verified image pages could not be joined without losing question boundaries. Please retry in page order.");
  }
  // Consecutive page numbers must not overlap or skip inside an uninterrupted
  // numbered section. A restart at 1 is a legitimate new exam/section.
  // Never remove repeated text or labels automatically.
  const numbers = coverage.map(item => Number(item.label.match(/\d+/u)?.[0]));
  const sequenceIssue = numbers.some((number, index) => index > 0 && number !== 1 && number !== numbers[index - 1] + 1);
  const sourceChecks: ImportSourceCheck[] = coverage.map((question, index) => {
    const actual = optionsIn(inventory[index].text);
    const expected = question.expectedOptionLabels;
    let reason: string | undefined;
    if (sequenceIssue) reason = "The photographed question numbering has a gap or overlap. Confirm source coverage before scoring.";
    if (question.unreadable || /\[(?:unreadable|unresolved)\b/iu.test(inventory[index].text)) {
      reason = "Essential source text is unreadable. Check the original image before scoring.";
    }
    if (expected.length && JSON.stringify(actual) !== JSON.stringify(expected)) {
      reason = "Some original answer choices are missing or out of order. Upload the continuation or review the source before scoring.";
    }
    if ((question.type === "multiple_choice" || question.type === "selection") && actual.length < 2) {
      reason = "Original answer choices are missing. Upload the continuation or review the source before scoring.";
    }
    if (question.continuesOnNextPage && index === coverage.length - 1) {
      reason = "The final question continues beyond the supplied images. Upload the next page before scoring.";
    }
    return { label: question.label, type: question.type === "unknown" ? undefined : question.type as QuestionType, truthStatements: question.truthStatements, reason };
  });
  return { text, sourceChecks, pages };
}

export async function prepareExamImageSource(images: string[], deps: {
  transcribe: (image: string) => Promise<string>;
  verify: (image: string, transcription: string, sectionInstructions: string) => Promise<VerifiedExamImagePage>;
}) {
  const pages: VerifiedExamImagePage[] = [];
  let sectionInstructions = "";
  for (const image of images) {
    const initial = await deps.transcribe(image);
    const page = await deps.verify(image, initial, sectionInstructions);
    pages.push(page);
    const sections = page.transcription.split(/\r?\n/u).filter(line => /(?:Phần|Section|Part|mỗi câu hỏi|chỉ chọn|đúng sai|trả lời ngắn)/iu.test(line));
    if (sections.length) sectionInstructions = sections.join("\n").slice(-2_000);
  }
  return joinVerifiedExamImagePages(pages);
}
