import assert from "node:assert/strict";
import test from "node:test";
import { parseExamImagePageReview, joinVerifiedExamImagePages, prepareExamImageSource, type VerifiedExamImagePage } from "./exam-image-source.js";
import { importQuizDocument } from "./quiz-import.js";

const question = (number: number, labels = ["A", "B", "C", "D"], continues = false) => ({
  label: `Câu ${number}:`, type: "multiple_choice" as const,
  optionLabels: labels, expectedOptionLabels: ["A", "B", "C", "D"],
  continuesOnNextPage: continues, unreadable: false, truthStatements: false,
});
const page = (transcription: string, questions: VerifiedExamImagePage["questions"], leadingOptionLabels: string[] = []) => parseExamImagePageReview({ transcription, questions, leadingOptionLabels });

test("joins split choices without injecting page notes and locks a cropped final MC item", async () => {
  const source = joinVerifiedExamImagePages([
    page("Phần 1: mỗi câu hỏi chỉ chọn một phương án\nCâu 10: Choose ten.\nA. First\nB. Second", [question(10, ["A", "B"], true)]),
    page("C. Third\nD. Fourth\nCâu 11: Choose eleven.\nA. One", [question(11, ["A"], true)], ["C", "D"]),
    page("B. Two\nC. Three\nD. Four\nCâu 12: Cropped final question", [question(12, [], true)], ["B", "C", "D"]),
  ]);
  assert.equal(source.sourceChecks![0].reason, undefined);
  assert.equal(source.sourceChecks![1].reason, undefined);
  assert.match(source.sourceChecks![2].reason!, /final question/);
  const solved: string[] = [];
  const quiz = await importQuizDocument(source.text, async prompt => {
    assert.ok(prompt.startsWith("Independently solve"), "verified source types should not be reclassified or repaired");
    const items = JSON.parse(prompt.split("\nITEMS:\n")[1]);
    solved.push(...items.map((item: any) => item.sourceId));
    return { answers: items.map((item: any) => ({ sourceId: item.sourceId, verified: true, solution: "Checked.", correctOptionIndex: 0 })) };
  }, source.sourceChecks);
  assert.deepEqual(solved, ["source-1", "source-2"]);
  assert.deepEqual(quiz.questions[0].options, ["First", "Second", "Third", "Fourth"]);
  assert.deepEqual(quiz.questions[1].options, ["One", "Two", "Three", "Four"]);
  assert.equal(quiz.questions[2].type, "multiple_choice");
  assert.equal(quiz.questions[2].correctAnswer, "");
  assert.match(quiz.questions[2].importReview!.reason, /final question/);
});

test("rejects draft duplicates, changed labels, missing choices, and commentary that disagree with the visual inventory", () => {
  assert.throws(() => page("Câu 1: First\nA. One\nB. Two\nCâu 1: Invented repeat\nA. One\nB. Two", [question(1, ["A", "B"])]), /coverage/);
  assert.throws(() => page("Câu 2: Wrong label\nA. One\nB. Two", [question(1, ["A", "B"])]), /coverage/);
  assert.throws(() => page("Câu 1: Missing choice\nA. One", [question(1, ["A", "B"])]), /coverage/);
  assert.throws(() => page("Câu 1: Stem\nA. One\nB. Two\n[Note: photo is cropped]", [question(1, ["A", "B"])]), /commentary/);
  assert.throws(() => page("C. Continuation\nCâu 2: Stem\nA. One\nB. Two", [question(2, ["A", "B"])]), /continuation/);
});

test("preserves genuine repeated questions while blocking scoring on numbering overlap", () => {
  const source = joinVerifiedExamImagePages([page("Câu 8: Same stem\nA. One\nB. Two\nCâu 8: Same stem\nA. One\nB. Two", [question(8, ["A", "B"]), question(8, ["A", "B"])])]);
  assert.equal(source.sourceChecks!.length, 2);
  assert.ok(source.sourceChecks!.every(check => check.reason));
  assert.equal(source.text.match(/Câu 8:/gu)?.length, 2);
});

test("unreadable source issues cannot be cleared by answer solving or recovery", async () => {
  const source = joinVerifiedExamImagePages([page("Câu 1: [unreadable] value\nA. One\nB. Two", [{ ...question(1, ["A", "B"]), expectedOptionLabels: ["A", "B"], unreadable: true }])]);
  const quiz = await importQuizDocument(source.text, async () => assert.fail("Do not solve or recover unreadable evidence"), source.sourceChecks);
  assert.equal(quiz.questions[0].correctAnswer, "");
  assert.deepEqual(quiz.questions[0].options, ["One", "Two"]);
  assert.match(quiz.questions[0].importReview!.reason, /unreadable/);
});

test("verification failures stop import rather than falling back to an unverified transcript", async () => {
  const calls: string[] = [];
  await assert.rejects(prepareExamImageSource(["page-one", "page-two"], {
    transcribe: async image => { calls.push(image); return "draft"; },
    verify: async () => { throw new Error("review unavailable"); },
  }), /review unavailable/);
  assert.deepEqual(calls, ["page-one"]);
});

test("continuation pages inherit section instructions and unnumbered source keeps its line parser", async () => {
  const seen: string[] = [];
  const source = await prepareExamImageSource(["one", "two"], {
    transcribe: async image => image,
    verify: async (_image, initial, sections) => {
      seen.push(sections);
      return page(initial === "one" ? "Phần 1: mỗi câu hỏi chỉ chọn một phương án\nChoose a number.\nA. One\nB. Two" : "Choose another number.\nA. Three\nB. Four", []);
    },
  });
  assert.match(seen[1], /chỉ chọn một phương án/);
  assert.equal(source.sourceChecks, undefined);
  assert.match(source.text, /Choose another number/);
});

test("a mismatched image inventory aborts before model calls", async () => {
  await assert.rejects(importQuizDocument("Câu 1: Stem\nA. One\nB. Two", async () => assert.fail("must not make a model call"), [{ label: "Câu 2:", type: "multiple_choice" }]), /inventory differs/);
});
