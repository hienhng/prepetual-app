import assert from "node:assert/strict";
import test from "node:test";
import { importQuizDocument, inventoryNumberedQuestions, inventoryUnnumberedQuestions, QuizImportError, parseImportedSourceItem, type ImportModelRequest } from "./quiz-import.js";
import { confirmImportedQuestion, describeQuizImport, getPendingImportQuestions } from "../shared/import-review.js";
import { questionSchema } from "../shared/schema.js";
import { parseSelectionAnswer } from "../shared/selection-answer.js";

const stem = (i: number) => `Which statement is correct for item ${i}? ${"Consider the information given in this original exam. ".repeat(5)}`.trim();
const exam = (count: number) => Array.from({ length: count }, (_, i) => `${i + 1}. ${stem(i + 1)}\nA. First answer\nB. Second answer\nC. All of the above\nD. None of the above`).join("\n\n");
type AuditItem = { sourceId: string; type: string; question: string; options: string[]; context: string };
const classificationResponse = (prompt: string, typeForId = (_id: string) => "multiple_choice") => ({
  classifications: JSON.parse(prompt.split("\nSOURCE ITEMS:\n")[1]).map((item: any) => ({ sourceId: item.sourceId, type: typeForId(item.sourceId) })),
});
function fakeModel(transform?: (items: AuditItem[], answers: any[]) => any[]): ImportModelRequest {
  return async (prompt) => {
    if (prompt.startsWith("Classify")) return classificationResponse(prompt);
    if (prompt.startsWith("Copy")) {
      const items = JSON.parse(prompt.split("ASSIGNED SOURCE ITEMS:\n")[1]);
      return { questions: items.map((item: any) => {
        const headings = item.blocks.filter((block: any) => /^(?:SECTION|PHẦN)/u.test(block.text));
        const options = item.type === "short_answer" ? [] : item.blocks.filter((block: any) => /^[A-Da-d][).]/u.test(block.text));
        return { sourceId: item.id, stemBlockIds: item.blocks.filter((block: any) => block.text.trim() && !headings.includes(block) && !options.includes(block)).map((block: any) => block.id), optionBlockIds: options.map((block: any) => [block.id]), ignoredBlocks: headings.map((block: any) => ({ blockIds: [block.id], reason: "heading" })) };
      }) };
    }
    assert.ok(prompt.includes("\nITEMS:\n"), "Standard source choices should not need LLM extraction");
    const items: AuditItem[] = JSON.parse(prompt.split("\nITEMS:\n")[1]);
    const answers = items.map((item) => ({ sourceId: item.sourceId, correctOptionIndex: 1, correctOptionIndexes: [0, 2], correctAnswer: item.type === "true_false" ? "False" : item.type === "short_answer" ? "42" : "", verified: true, solution: "Independent solution.", explanation: "Independent explanation." }));
    return { title: "Original exam", category: "categories.general", answers: transform ? transform(items, answers) : answers };
  };
}

test("imports all 40 questions beyond the old 8000-character cutoff in 10 batches, in source order", async () => {
  const source = exam(40);
  assert.ok(source.length > 8000);
  let calls = 0;
  const result = await importQuizDocument(source, fakeModel((_items, answers) => { calls++; return answers; }));
  assert.equal(calls, 10);
  assert.equal(result.questions.length, 40);
  assert.deepEqual(result.questions.map((q) => q.question), Array.from({ length: 40 }, (_, i) => stem(i + 1)));
  assert.equal(new Set(result.questions.map((q) => q.id)).size, 40);
  assert.equal(getPendingImportQuestions(result.questions).length, 0);
  for (const question of result.questions) {
    assert.deepEqual(question.options, ["First answer", "Second answer", "All of the above", "None of the above"]);
    assert.equal(question.correctAnswer, "Second answer");
  }
});

test("recovers omitted audit answers individually without replacing or duplicating questions", async () => {
  const recovered: string[] = [];
  const result = await importQuizDocument(exam(40), fakeModel((items, answers) => {
    if (items.length === 1) recovered.push(items[0].sourceId);
    return items.length > 1 ? answers.filter((a) => a.sourceId !== "source-17" && a.sourceId !== "source-23") : answers;
  }));
  assert.equal(result.questions.length, 40);
  assert.deepEqual(recovered.sort(), ["source-17", "source-23"]);
  assert.equal(getPendingImportQuestions(result.questions).length, 0);
});

test("the reported 30-of-40 failure now retains all 40 with 10 reviewable original questions", async () => {
  const missing = new Set([5, 7, 8, 18, 20, 22, 25, 27, 34, 35].map((n) => `source-${n}`));
  const result = await importQuizDocument(exam(40), fakeModel((_items, answers) => answers.map((answer) => missing.has(answer.sourceId) ? { ...answer, verified: false, reason: "The diagram is unclear." } : answer)));
  assert.equal(result.questions.length, 40);
  assert.equal(getPendingImportQuestions(result.questions).length, 10);
  for (let i = 0; i < 40; i++) {
    const question = result.questions[i];
    assert.equal(question.question, stem(i + 1));
    if (missing.has(`source-${i + 1}`)) {
      assert.equal(question.correctAnswer, "");
      assert.match(question.importReview!.sourceText, /A\. First answer/);
      assert.equal(question.importReview!.reason, "The diagram is unclear.");
      assert.throws(() => confirmImportedQuestion(question), /correct answer/);
    } else assert.equal(question.correctAnswer, "Second answer");
  }
});

test("Unicode math, spacing, and formula typography are copied without model transcription", async () => {
  const source = "Câu 1. Giá trị của biểu thức √(a² + b²) là gì?\nA. 10⁻³\nB. α² ≥ 1\nC. x ∈ ℝ\nD. Không có đáp án\nCâu 2. Công thức nào đúng?\nA. E = mc²\nB. F = m·a\nC. p = m v\nD. V = I R";
  const result = await importQuizDocument(source, fakeModel((_items, answers) => answers.map((answer) => ({ ...answer, question: "An unwanted rewrite", correctAnswer: "$alpha^2$" }))));
  assert.equal(result.questions[0].question, "Giá trị của biểu thức √(a² + b²) là gì?");
  assert.deepEqual(result.questions[0].options, ["10⁻³", "α² ≥ 1", "x ∈ ℝ", "Không có đáp án"]);
  assert.equal(result.questions[0].correctAnswer, "α² ≥ 1");
  assert.equal(result.questions[1].correctAnswer, "F = m·a");
});

test("keeps every raw source item when extraction is unavailable", async () => {
  const source = "Câu 1. Read this passage.\n• First choice\n• Second choice\nCâu 2. Read this second passage.\n• Third choice\n• Fourth choice";
  const originals = inventoryNumberedQuestions(source)!;
  const result = await importQuizDocument(source, async (prompt) => {
    if (prompt.startsWith("Classify")) return classificationResponse(prompt);
    throw new Error("Provider unavailable");
  });
  assert.equal(result.questions.length, 2);
  assert.equal(getPendingImportQuestions(result.questions).length, 2);
  assert.deepEqual(result.questions.map((q) => q.question), originals.map((q) => q.text));
  assert.ok(result.questions.every((q) => q.importReview?.sourceText === q.question && q.correctAnswer === ""));
  assert.ok(result.questions.every((q) => q.type === "multiple_choice"));
});

test("answer service failure retains parsed choices without guessing an answer", async () => {
  const result = await importQuizDocument(exam(2), async (prompt) => {
    if (prompt.startsWith("Classify")) return classificationResponse(prompt);
    throw new Error("Provider unavailable");
  });
  assert.equal(getPendingImportQuestions(result.questions).length, 2);
  assert.ok(result.questions.every((q) => q.options?.length === 4 && q.correctAnswer === ""));
});

test("keeps repeated source questions and Vietnamese numbering with section resets", async () => {
  const source = exam(3).replace(/^1\./m, "Câu 1.").replace(/^2\./m, "Câu 2.").replace(/^3\./m, "Câu 1.").replace(stem(2), stem(1)).replace(stem(3), stem(1));
  const result = await importQuizDocument(source, fakeModel());
  assert.equal(result.questions.length, 3);
  assert.equal(new Set(result.questions.map((q) => q.question)).size, 1);
});

test("uses answer keys as context and continues with questions after the key", async () => {
  const result = await importQuizDocument(`${exam(2)}\nAnswer key\n1. B\n2. B\n\n${exam(2)}`, fakeModel((items, answers) => {
    assert.ok(items.every((item) => item.context.includes("Answer key")));
    return answers;
  }));
  assert.equal(result.questions.length, 4);
});

test("falls back to line inventory for unnumbered questions", async () => {
  const delegate = fakeModel();
  const result = await importQuizDocument(exam(2).replace(/^\d+\. /gm, ""), async (prompt) => prompt.startsWith("Inventory")
    ? { complete: true, questions: [{ startLine: 1, endLine: 5 }, { startLine: 7, endLine: 11 }] }
    : delegate(prompt));
  assert.equal(result.questions.length, 2);
});

test("does not confuse nested numbered choices with question numbers", () => {
  assert.equal(inventoryNumberedQuestions("1. Stem\n1. First\n2. Second\n2. Next stem\n1. First\n2. Second"), null);
});

test("counts mixed heading styles and headings on their own line", () => {
  const items = inventoryNumberedQuestions("Question 1. First?\nA. Yes\nB. No\n2.\nSecond?\nA. Yes\nB. No\nCâu 3:\nThird?\nA. Yes\nB. No");
  assert.equal(items?.length, 3);
  assert.match(items![1].text, /^Second/);
});

test("ambiguous option labels are not split into fabricated choices", () => {
  assert.equal(parseImportedSourceItem({ id: "a", label: "1.", context: "", text: "Point A. lies here.\nA. One\nB. Two" }), null);
});

test("review state survives schema validation and requires a valid confirmed answer", async () => {
  const result = await importQuizDocument(exam(2), fakeModel((_items, answers) => answers.map((a) => ({ ...a, verified: false }))));
  const pending = questionSchema.parse(JSON.parse(JSON.stringify(result.questions[0])));
  assert.ok(pending.importReview);
  assert.throws(() => confirmImportedQuestion({ ...pending, correctAnswer: "invented option" }), /Choose the correct answer/);
  const confirmed = confirmImportedQuestion({ ...pending, correctAnswer: pending.options![0] });
  assert.equal(confirmed.importReview, undefined);
  assert.equal(getPendingImportQuestions([confirmed]).length, 0);
  assert.equal(confirmed.question, pending.question);
});

test("shared passages returned by the answer pass must match the source", async () => {
  const source = `Original reading passage.\n${exam(2)}`;
  const good = await importQuizDocument(source, fakeModel((_items, answers) => answers.map((a) => ({ ...a, context: "Original reading passage." }))));
  assert.ok(good.questions.every((q) => q.question.startsWith("Original reading passage.\n\n")));
  const bad = await importQuizDocument(source, fakeModel((_items, answers) => answers.map((a) => ({ ...a, context: "Invented reading passage." }))));
  assert.equal(getPendingImportQuestions(bad.questions).length, 2);
});

test("mixed exam retains every source format and groups truth statements as selection", async () => {
  const source = [
    "PHẦN I. Chọn một đáp án đúng.",
    "Câu 1. Which statement is false?\nA. 2 > 1\nB. 1 > 2\nC. 3 > 1\nD. 4 > 1",
    "SECTION II. Judge the following statement true or false.",
    "Câu 2. The Earth is flat.\nA. True\nB. False",
    "PHẦN II. Trắc nghiệm đúng sai. Trong mỗi ý a), b), c), d), chọn đúng hoặc sai.",
    "Câu 1. Xét các khẳng định sau.\na) 2 > 1\nb) 1 > 2\nc) 3 > 1\nd) 4 > 1",
    "PHẦN III. Trả lời ngắn.",
    "Câu 1. Tính 6 × 7. Điền kết quả: ........",
    "PHẦN IV. Chọn một đáp án đúng.",
    "Câu 1. What is 2 + 2?\nA. 3\nB. 4",
  ].join("\n");
  const audited: string[] = [];
  const delegate = fakeModel((items, answers) => { audited.push(...items.map((item) => item.sourceId)); return answers; });
  const result = await importQuizDocument(source, async (prompt) => {
    if (prompt.startsWith("Classify")) {
      const items = JSON.parse(prompt.split("\nSOURCE ITEMS:\n")[1]);
      assert.match(items.find((item: any) => item.sourceId === "source-3").context, /Trắc nghiệm đúng sai/);
      assert.match(items.find((item: any) => item.sourceId === "source-4").context, /Trả lời ngắn/);
      return classificationResponse(prompt, (id) => id === "source-2" ? "true_false" : id === "source-3" ? "selection" : id === "source-4" ? "short_answer" : "multiple_choice");
    }
    return delegate(prompt);
  });
  assert.deepEqual([...new Set(audited)].sort(), ["source-1", "source-2", "source-3", "source-4", "source-5"]);
  assert.deepEqual(result.questions.map(q => q.type), ["multiple_choice", "true_false", "selection", "short_answer", "multiple_choice"]);
  assert.deepEqual(parseSelectionAnswer(result.questions[2].correctAnswer), ["2 > 1", "3 > 1"]);
  assert.equal(result.questions[3].correctAnswer, "42");
  assert.equal(result.questions[4].question, "What is 2 + 2?");
  assert.deepEqual(result.importSummary, { sourceQuestionCount: 5, multipleChoiceCount: 2, selectionCount: 1, trueFalseCount: 1, shortAnswerCount: 1, unresolvedTypeCount: 0 });
  assert.match(describeQuizImport(result.questions, result.importSummary), /5 questions imported/);
});

test("an exam containing only true/false and short answers imports without invented alternatives", async () => {
  const delegate = fakeModel();
  const result = await importQuizDocument("1. True or false: 2 > 1?\n2. Calculate 6 × 7.", async prompt => prompt.startsWith("Classify") ? classificationResponse(prompt, id => id === "source-1" ? "true_false" : "short_answer") : delegate(prompt));
  assert.deepEqual(result.questions.map(q => q.type), ["true_false", "short_answer"]);
  assert.deepEqual(result.questions[0].options, ["True", "False"]);
  assert.equal(result.questions[1].options, undefined);
  assert.equal(result.questions[1].correctAnswer, "42");
  assert.equal(getPendingImportQuestions(result.questions).length, 0);
});

test("retries missing or duplicate classifications by source identity without silently dropping questions", async () => {
  const retried: string[] = [];
  const delegate = fakeModel();
  const result = await importQuizDocument(exam(3), async (prompt) => {
    if (!prompt.startsWith("Classify")) return delegate(prompt);
    const response = classificationResponse(prompt);
    if (response.classifications.length > 1) return { classifications: [response.classifications[0], response.classifications[1], response.classifications[1], { sourceId: "unknown-id", type: "multiple_choice" }] };
    retried.push(response.classifications[0].sourceId);
    return response;
  });
  assert.deepEqual(retried, ["source-2", "source-3"]);
  assert.equal(result.questions.length, 3);
});

test("unknown source types retain original text for explicit classification review", async () => {
  const result = await importQuizDocument(exam(2), async (prompt) => {
    assert.ok(prompt.startsWith("Classify"));
    return classificationResponse(prompt, () => "unknown");
  });
  assert.equal(result.questions.length, 2);
  assert.ok(result.questions.every(q => q.importReview?.stage === "classification" && q.correctAnswer === ""));
});

test("explicit English and Vietnamese truth-value choices become true/false even if classified as MC", async () => {
  const result = await importQuizDocument("1. The Earth is flat.\nA. True\nB. False\n2. Trái đất phẳng.\nA. Sai\nB. Đúng\n3. Can you choose?\nA. Yes\nB. No", fakeModel());
  assert.equal(result.questions.length, 3);
  assert.deepEqual(result.questions[2].options, ["Yes", "No"]);
  assert.equal(result.importSummary.trueFalseCount, 2);
  assert.deepEqual(result.questions.slice(0, 2).map(q => q.correctAnswer), ["False", "False"]);
});

test("numbering gaps in the supplied exam layout do not trigger model line inventory", async () => {
  const numbers = Array.from({ length: 40 }, (_, i) => i + 1).filter((n) => ![20, 22, 25, 27].includes(n));
  const source = numbers.map((n) => `Câu ${n}. ${[5, 7, 8].includes(n) ? "Trong mỗi ý A, B, C, D, học sinh chọn đúng hoặc sai." : stem(n)}\nA. First answer\nB. Second answer\nC. Third answer\nD. Fourth answer`).join("\n");
  assert.equal(inventoryNumberedQuestions(source)?.length, 36);
  const delegate = fakeModel();
  const result = await importQuizDocument(source, async (prompt) => {
    assert.ok(!prompt.startsWith("Inventory"), "Explicit question numbers need no LLM boundary inventory");
    if (prompt.startsWith("Classify")) return classificationResponse(prompt, (id) => ["source-5", "source-7", "source-8"].includes(id) ? "true_false" : "multiple_choice");
    return delegate(prompt);
  });
  assert.equal(result.questions.length, 36);
  assert.equal(result.importSummary.selectionCount, 3);
  assert.equal(result.importSummary.multipleChoiceCount, 33);
  assert.deepEqual(result.questions.filter(q => q.type === "multiple_choice").map(q => q.question), numbers.filter(n => ![5, 7, 8].includes(n)).map(stem));
});

test("explicit headings with nested numbered statements or a single question retain source boundaries", () => {
  const source = "Câu 19. Consider these statements:\n1. First statement\n2. Second statement\nA. First only\nB. Both\nCâu 21. Next question?\nA. One\nB. Two";
  const items = inventoryNumberedQuestions(source)!;
  assert.deepEqual(items.map((item) => item.label), ["Câu 19.", "Câu 21."]);
  assert.match(items[0].text, /1\. First statement\n2\. Second statement/);
  assert.equal(inventoryNumberedQuestions("Câu 40. A single question?\nA. One\nB. Two")?.length, 1);
});

test("line inventory normalizes unordered, duplicate, and string line IDs", async () => {
  const result = await inventoryUnnumberedQuestions("First?\nA. One\nB. Two\nSecond?\nA. Three\nB. Four", async () => ({
    complete: true, questions: [{ startLine: "4", endLine: "6" }, { startLine: 1, endLine: 3 }, { startLine: 1, endLine: 3 }],
  }));
  assert.deepEqual(result.map((q) => q.id), ["line-1", "line-4"]);
});

test("line inventory widens boundary context and ignores valid questions owned by an adjacent window", async () => {
  const source = Array.from({ length: 180 }, (_, i) => `Line ${i + 1}: ${"x".repeat(180)}`).join("\n");
  const attempts = new Map<number, number>();
  const result = await inventoryUnnumberedQuestions(source, async (prompt) => {
    const bounds = prompt.match(/between (\d+) and (\d+),/)!;
    const start = Number(bounds[1]);
    const end = Number(bounds[2]);
    const attempt = (attempts.get(start) || 0) + 1;
    attempts.set(start, attempt);
    if (start === 1 && attempt === 1) return { complete: false, questions: [] };
    if (start === 1) {
      assert.match(prompt, /previous attempt failed validation/);
      assert.ok(prompt.includes(`[${end + 60}]`), "The retry must expose more than the original 30 lines of overlap");
    }
    return { complete: true, questions: [{ startLine: start, endLine: start + 2 }, ...(start > 1 ? [{ startLine: start - 5, endLine: start - 3 }] : [])] };
  });
  assert.equal(result.filter(item => !item.reviewReason).length, attempts.size);
  assert.ok(result.some(item => item.reviewReason), "Unassigned lines must be retained for coverage review");
  assert.equal(attempts.get(1), 2);
});

test("failed inventory windows recover through smaller assignments", async () => {
  const result = await inventoryUnnumberedQuestions(Array.from({ length: 40 }, (_, i) => `Source line ${i + 1}`).join("\n"), async (prompt) => {
    const bounds = prompt.match(/between (\d+) and (\d+),/)!;
    const start = Number(bounds[1]);
    const end = Number(bounds[2]);
    if (end - start > 20) return { complete: false, questions: [] };
    return { complete: true, questions: [{ startLine: start, endLine: start + 2 }] };
  });
  assert.deepEqual(result.filter(item => !item.reviewReason).map(q => q.id), ["line-1", "line-21"]);
  assert.ok(result.some(item => item.reviewReason));
});

test("provider failures are not mislabeled as unreadable source lines or source types", async () => {
  const unavailable: ImportModelRequest = async () => { throw Object.assign(new Error("Provider unavailable"), { status: 503 }); };
  await assert.rejects(() => inventoryUnnumberedQuestions("Readable source", unavailable), (error: unknown) => error instanceof Error && !(error instanceof QuizImportError) && /AI service.*HTTP 503/.test(error.message));
  const result = await importQuizDocument(exam(2), unavailable);
  assert.ok(result.questions.every(q => q.importReview?.stage === "classification"));
});
