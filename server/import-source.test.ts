import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { importQuizDocument } from "./quiz-import.js";
import { questionFromBlockReferences, readTruthStatementKey } from "./import-source.js";
import { confirmImportedQuestion } from "../shared/import-review.js";
import { parseSelectionAnswer, selectionAnswersMatch } from "../shared/selection-answer.js";
import { validatedQuestionSchema } from "../shared/schema.js";

const source = readFileSync(new URL("./fixtures/import-mixed-exam.txt", import.meta.url), "utf8");
const request = async (prompt: string): Promise<Record<string, unknown>> => {
  if (prompt.startsWith("Classify")) {
    const items = JSON.parse(prompt.split("SOURCE ITEMS:\n")[1]);
    return { classifications: items.map((item: any) => ({ sourceId: item.sourceId, type: item.sourceId === "source-4" ? "short_answer" : "multiple_choice" })) };
  }
  if (prompt.startsWith("Copy")) {
    const items = JSON.parse(prompt.split("ASSIGNED SOURCE ITEMS:\n")[1]);
    return { questions: items.map((item: any) => ({ sourceId: item.id, stemBlockIds: item.blocks.filter((b: any) => b.text.trim()).map((b: any) => b.id), optionBlockIds: [] })) };
  }
  const items = JSON.parse(prompt.split("ITEMS:\n")[1]);
  return { answers: items.map((item: any) => ({ sourceId: item.sourceId, verified: true, solution: "Checked against source quantities and answer key.", correctOptionIndex: 0, correctOptionIndexes: [0, 1], correctAnswer: item.type === "true_false" ? "True" : "20 cm3" })) };
};

test("Vietnamese exam corpus preserves four types and imports the user's block as selection A/B", async () => {
  const result = await importQuizDocument(source, request);
  assert.deepEqual(result.questions.map(q => q.type), ["multiple_choice", "selection", "true_false", "short_answer"]);
  const block = result.questions[1];
  assert.equal(block.selectionMode, "truth_statements");
  assert.equal(block.options?.length, 4);
  assert.deepEqual(parseSelectionAnswer(block.correctAnswer), block.options!.slice(0, 2));
  assert.equal(block.question, "Một khối gang hình hộp chữ nhật có chiều dài các cạnh tương ứng là 2cm, 2cm, 5cm và nặng 140g.");
  assert.equal(block.options![3], "Trọng lượng của khối gang là 140g.");
  assert.ok(!block.options!.some(option => option.includes("Đáp án")));
  assert.ok(result.questions.every(q => !q.importReview && validatedQuestionSchema.safeParse(q).success));
  assert.equal(selectionAnswersMatch(JSON.stringify(block.options!.slice(0, 2).reverse()), block.correctAnswer), true);
  assert.equal(confirmImportedQuestion(block).correctAnswer, block.correctAnswer);
});

test("local answer key conflicts are retained for review instead of accepted on verified:true", async () => {
  const result = await importQuizDocument(source, async prompt => {
    const result = await request(prompt);
    if (Array.isArray(result.answers)) for (const answer of result.answers) if (answer.sourceId === "source-2") answer.correctOptionIndexes = [0, 2];
    return result;
  });
  assert.match(result.questions[1].importReview!.reason, /conflicts/);
  assert.equal(result.questions[1].correctAnswer, "");
});

test("the standalone unnumbered example remains one selection question with four statements", async () => {
  const standalone = source.slice(source.indexOf("Một khối"), source.indexOf("Câu 3.")).trim();
  const result = await importQuizDocument(standalone, async prompt => {
    if (prompt.startsWith("Inventory")) return { complete: true, questions: [{ startLine: 1, endLine: standalone.split("\n").length }] };
    return request(prompt);
  });
  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].type, "selection");
  assert.equal(result.questions[0].options?.length, 4);
  assert.deepEqual(parseSelectionAnswer(result.questions[0].correctAnswer), result.questions[0].options!.slice(0, 2));
  assert.equal(result.questions[0].importReview, undefined);
});

test("block references preserve multiline formulas without asking the model to reproduce text", () => {
  const item = { id: "source-1", label: "1.", text: "Evaluate √(a² + b²).\nUse a = 3, b = 4.\n• 5\n• 7\n• 25", context: "" };
  const refs = { sourceId: item.id, stemBlockIds: ["b1", "b2"], optionBlockIds: [["b3"], ["b4"], ["b5"]] };
  const question = questionFromBlockReferences(refs, item, "multiple_choice")!;
  assert.equal(question.question, "Evaluate √(a² + b²).\nUse a = 3, b = 4.");
  assert.deepEqual(question.options, ["5", "7", "25"]);
  assert.equal(questionFromBlockReferences({ ...refs, optionBlockIds: [["b3"], ["b4"]] }, item, "multiple_choice"), null);
  assert.equal(questionFromBlockReferences({ ...refs, optionBlockIds: [["b3"], ["b3"], ["b5"]] }, item, "multiple_choice"), null);
  assert.equal(questionFromBlockReferences({ ...refs, optionBlockIds: [["b4"], ["b3"], ["b5"]] }, item, "multiple_choice"), null);
  assert.equal(questionFromBlockReferences({ ...refs, stemBlockIds: ["invented"] }, item, "multiple_choice"), null);
});

test("truth keys require complete noncontradictory coverage, including an all-false key", () => {
  assert.deepEqual(readTruthStatementKey("**Đáp án:**\n*- A, B đúng*\n*- C, D sai*", 4), [0, 1]);
  assert.deepEqual(readTruthStatementKey("A, B sai", 2), []);
  assert.equal(readTruthStatementKey("A đúng", 4), null);
  assert.equal(readTruthStatementKey("A, B đúng\nB sai", 2), null);
});

test("grouped statements retain their selection type when zero or only one statement is true", async () => {
  for (const indexes of [[], [0]]) {
    const result = await importQuizDocument("Câu 1. Xét các khẳng định sau.\na) Statement one.\nb) Statement two.", async prompt => {
      if (prompt.startsWith("Classify")) return { classifications: [{ sourceId: "source-1", type: "selection", truthStatements: true }] };
      return { answers: [{ sourceId: "source-1", verified: true, solution: "Both statements checked independently.", correctOptionIndexes: indexes }] };
    });
    const question = result.questions[0];
    assert.equal(question.type, "selection");
    assert.equal(question.selectionMode, "truth_statements");
    assert.equal(question.importReview, undefined);
    assert.deepEqual(parseSelectionAnswer(question.correctAnswer), indexes.map(index => question.options![index]));
    assert.equal(confirmImportedQuestion(question).correctAnswer, question.correctAnswer);
  }
});

test("ambiguous numbered layouts are re-inventoried instead of merging two option runs", async () => {
  let inventoried = false;
  const result = await importQuizDocument("Câu 1. First question?\nA. One\nB. Two\nUnnumbered second question?\nA. Three\nB. Four", async prompt => {
    if (prompt.startsWith("Inventory")) {
      inventoried = true;
      return { complete: true, questions: [{ startLine: 1, endLine: 3 }, { startLine: 4, endLine: 6 }] };
    }
    if (prompt.startsWith("Classify")) return { classifications: ["line-1", "line-4"].map(sourceId => ({ sourceId, type: "multiple_choice" })) };
    return { answers: ["line-1", "line-4"].map(sourceId => ({ sourceId, verified: true, solution: "Checked", correctOptionIndex: 0 })) };
  });
  assert.equal(inventoried, true);
  assert.equal(result.questions.length, 2);
  assert.equal(result.questions[1].question, "Unnumbered second question?");
});

test("unaccounted inventory source remains visible and cannot be scored without review", async () => {
  const result = await importQuizDocument("First original question?\nA. One\nB. Two\nSecond original question?\nA. Three\nB. Four", async prompt => {
    if (prompt.startsWith("Inventory")) return { complete: true, questions: [{ startLine: 1, endLine: 3 }] };
    if (prompt.startsWith("Classify")) return { classifications: [{ sourceId: "line-1", type: "multiple_choice" }] };
    return { answers: [{ sourceId: "line-1", verified: true, solution: "Checked", correctOptionIndex: 0 }] };
  });
  assert.equal(result.questions.length, 2);
  assert.match(result.questions[1].question, /Second original question/);
  assert.equal(result.questions[1].importReview?.stage, "inventory");
  assert.throws(() => confirmImportedQuestion(result.questions[1]), /correct answer/);
});
