import assert from "node:assert/strict";
import test from "node:test";
import { importQuizDocument } from "./quiz-import.js";
import { validatedQuestionSchema } from "../shared/schema.js";

const assigned = (prompt: string) => JSON.parse(prompt.split("\nITEMS:\n")[1])[0];
const layout = (sourceId: string, extra = {}) => ({
  sourceId, singleQuestion: true, type: "multiple_choice", stemBlockIds: ["b1"],
  optionBlockIds: [["b2"], ["b3"]], ignoredBlocks: [], ...extra,
});
const answer = (sourceId: string, extra = {}) => ({
  sourceId, verified: true, solution: "Calculated and checked against the original source.", correctOptionIndex: 0, ...extra,
});
const classify = (prompt: string, type = "multiple_choice") => ({
  classifications: JSON.parse(prompt.split("\nSOURCE ITEMS:\n")[1]).map((item: any) => ({ sourceId: item.sourceId, type })),
});

test("only flagged questions get one fresh layout-and-answer pass with the previous failure reason", async () => {
  const recovered: string[] = [];
  const result = await importQuizDocument("Câu 1. Evaluate √(9 + 16).\nA. 5\nB. 7\nCâu 2. Evaluate 2 + 2.\nA. 4\nB. 5", async prompt => {
    if (prompt.startsWith("Classify")) return classify(prompt);
    if (prompt.startsWith("Reassess")) {
      const item = assigned(prompt);
      recovered.push(item.sourceId);
      assert.equal(item.previousReview.stage, "answer");
      assert.equal(item.previousReview.reason, "Check the formula layout.");
      assert.equal(item.source, "Evaluate √(9 + 16).\nA. 5\nB. 7");
      return { questions: [layout(item.sourceId)], answers: [answer(item.sourceId)] };
    }
    return { answers: [answer("source-1", { verified: false, reason: "Check the formula layout." }), answer("source-2")] };
  });
  assert.deepEqual(recovered, ["source-1"]);
  assert.equal(result.questions.length, 2);
  assert.equal(result.questions[0].question, "Evaluate √(9 + 16).");
  assert.deepEqual(result.questions[0].options, ["5", "7"]);
  assert.ok(result.questions.every(q => !q.importReview && q.correctAnswer === q.options![0]));
});

test("recovery determines previously unknown types and solves written answers", async () => {
  let recoveries = 0;
  const result = await importQuizDocument("Câu 1. Calculate 6 × 7.", async prompt => {
    if (prompt.startsWith("Classify")) return classify(prompt, "unknown");
    assert.ok(prompt.startsWith("Reassess"));
    const item = assigned(prompt);
    recoveries++;
    assert.equal(item.previousReview.stage, "classification");
    return { questions: [layout(item.sourceId, { type: "short_answer", optionBlockIds: [] })], answers: [answer(item.sourceId, { correctAnswer: "42" })] };
  });
  assert.equal(recoveries, 1);
  assert.equal(result.questions[0].type, "short_answer");
  assert.equal(result.questions[0].correctAnswer, "42");
  assert.equal(result.questions[0].options, undefined);
  assert.equal(result.questions[0].importReview, undefined);
  assert.equal(result.importSummary.unresolvedTypeCount, 0);
  assert.equal(result.importSummary.shortAnswerCount, 1);
});

test("a failed ambiguous layout gets a fresh recovery instead of remaining raw immediately", async () => {
  let copies = 0;
  let recoveries = 0;
  const result = await importQuizDocument("Câu 1. Evaluate √(9 + 16).\n• 5\n• 7", async prompt => {
    if (prompt.startsWith("Classify")) return classify(prompt);
    if (prompt.startsWith("Copy")) { copies++; return { questions: [] }; }
    assert.ok(prompt.startsWith("Reassess"));
    const item = assigned(prompt);
    recoveries++;
    assert.equal(item.previousReview.stage, "structure");
    return { questions: [layout(item.sourceId)], answers: [answer(item.sourceId)] };
  });
  assert.equal(copies, 2);
  assert.equal(recoveries, 1);
  assert.deepEqual(result.questions[0].options, ["5", "7"]);
  assert.equal(result.questions[0].correctAnswer, "5");
  assert.equal(result.questions[0].importReview, undefined);
});

test("recovery can restore source content incorrectly treated as supporting material", async () => {
  let recoveries = 0;
  const result = await importQuizDocument("Câu 1. Choose the correct explanation.\n• First explanation\n• Second explanation\nwith its necessary continuation.", async prompt => {
    if (prompt.startsWith("Classify")) return classify(prompt);
    if (prompt.startsWith("Copy")) return { questions: [{ ...layout("source-1"), ignoredBlocks: [{ blockIds: ["b4"], reason: "footer" }] }] };
    if (prompt.startsWith("Reassess")) {
      const item = assigned(prompt);
      recoveries++;
      assert.equal(item.previousReview.stage, "structure");
      return { questions: [layout(item.sourceId, { optionBlockIds: [["b2"], ["b3", "b4"]] })], answers: [answer(item.sourceId, { correctOptionIndex: 1 })] };
    }
    return { answers: [answer("source-1")] };
  });
  assert.equal(recoveries, 1);
  assert.deepEqual(result.questions[0].options, ["First explanation", "Second explanation\nwith its necessary continuation."]);
  assert.equal(result.questions[0].correctAnswer, result.questions[0].options![1]);
  assert.equal(result.questions[0].importReview, undefined);
});

test("unassigned inventory questions also receive recovery and update type counts", async () => {
  const result = await importQuizDocument("First question?\nA. One\nB. Two\nSecond question?\nA. Three\nB. Four", async prompt => {
    if (prompt.startsWith("Inventory")) return { complete: true, questions: [{ startLine: 1, endLine: 3 }] };
    if (prompt.startsWith("Classify")) return classify(prompt);
    if (prompt.startsWith("Reassess")) {
      const item = assigned(prompt);
      assert.equal(item.sourceId, "line-4");
      assert.equal(item.previousReview.stage, "inventory");
      return { questions: [layout(item.sourceId)], answers: [answer(item.sourceId)] };
    }
    return { answers: [answer("line-1")] };
  });
  assert.equal(result.questions.length, 2);
  assert.equal(result.questions[1].question, "Second question?");
  assert.equal(result.questions[1].correctAnswer, "Three");
  assert.ok(result.questions.every(q => !q.importReview));
  assert.equal(result.importSummary.multipleChoiceCount, 2);
  assert.equal(result.importSummary.unresolvedTypeCount, 0);
});

test("invalid or unavailable recovery preserves the prior source and review reason", async t => {
  const cases = {
    "missing source option": [layout("source-1", { optionBlockIds: [["b2"]] })],
    "rewritten source": [{ sourceId: "source-1", singleQuestion: true, type: "multiple_choice", question: "Invented question", options: ["One", "Two"] }],
    "duplicate result": [layout("source-1"), layout("source-1")],
    "wrong source identity": [layout("unknown")],
    "uncertain boundaries": [layout("source-1", { singleQuestion: false })],
    "provider failure": undefined,
  };
  for (const [name, questions] of Object.entries(cases)) await t.test(name, async () => {
    let recoveries = 0;
    const result = await importQuizDocument("Câu 1. Which is correct?\nA. One\nB. Two", async prompt => {
      if (prompt.startsWith("Classify")) return classify(prompt);
      if (prompt.startsWith("Reassess")) {
        recoveries++;
        if (!questions) throw new Error("Service unavailable");
        return { questions, answers: [answer("source-1")] };
      }
      return { answers: [answer("source-1", { verified: false, reason: "The original answer needs checking." })] };
    });
    assert.equal(recoveries, 1);
    assert.equal(result.questions[0].question, "Which is correct?");
    assert.deepEqual(result.questions[0].options, ["One", "Two"]);
    assert.equal(result.questions[0].correctAnswer, "");
    assert.equal(result.questions[0].importReview?.reason, "The original answer needs checking.");
    assert.match(result.questions[0].importReview!.sourceText, /B\. Two/);
  });
});

test("recovered grouped truth layouts retain answer-key conflict checks", async () => {
  const result = await importQuizDocument("Câu 1. Judge each statement.\na) 2 > 1\nb) 1 > 2\nĐáp án: A đúng, B sai", async prompt => {
    if (prompt.startsWith("Classify")) return classify(prompt);
    if (prompt.startsWith("Reassess")) return {
      questions: [layout("source-1", { type: "selection", truthStatements: true })],
      answers: [answer("source-1", { correctOptionIndexes: [1] })],
    };
    return { answers: [answer("source-1", { verified: false })] };
  });
  assert.equal(result.questions[0].selectionMode, "truth_statements");
  assert.equal(result.questions[0].correctAnswer, "");
  assert.match(result.questions[0].importReview!.reason, /conflicts/);
});

test("a recovered layout remains reviewable if its answer is still uncertain, without further retries", async () => {
  let recoveries = 0;
  const result = await importQuizDocument("Câu 1. Which is correct?\n• One\n• Two", async prompt => {
    if (prompt.startsWith("Classify")) return classify(prompt);
    if (prompt.startsWith("Copy")) throw new Error("Service unavailable");
    recoveries++;
    return { questions: [layout("source-1")], answers: [answer("source-1", { verified: false, reason: "The required diagram is still unreadable." })] };
  });
  assert.equal(recoveries, 1);
  assert.deepEqual(result.questions[0].options, ["One", "Two"]);
  assert.equal(result.questions[0].correctAnswer, "");
  assert.equal(result.questions[0].importReview?.stage, "answer");
  assert.equal(result.questions[0].importReview?.reason, "The required diagram is still unreadable.");
  assert.equal(validatedQuestionSchema.safeParse(result.questions[0]).success, true);
});
