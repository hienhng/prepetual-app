import assert from "node:assert/strict";
import test from "node:test";
import { reconcileImportAnswerChecks, verifyImportAnswersWithRetry, type ImportAnswerItem } from "./import-answer-verification.js";
import { importQuizDocument } from "./quiz-import.js";

const answer = (index: number, sourceId = "source-1") => ({ sourceId, verified: true, solution: "Independently checked.", correctOptionIndex: index });

test("disagreement, missing checks and uncertainty cannot be accepted as verified", () => {
  const result = reconcileImportAnswerChecks({ answers: [answer(0), answer(1, "source-2"), answer(0, "source-3")] }, { answers: [answer(2), { ...answer(1, "source-2"), verified: false, reason: "Ambiguous alternatives." }] });
  assert.ok((result.answers as any[]).every(item => item.verified === false));
  assert.match((result.answers as any[])[1].reason, /Ambiguous/);
  const agreed = reconcileImportAnswerChecks({ answers: [answer(0)] }, { answers: [answer(0)] });
  assert.equal((agreed.answers as any[])[0].verified, true);
});

test("complete selection sets must agree; an all-false set is a valid agreement", () => {
  const first = { sourceId: "source-1", verified: true, correctOptionIndexes: [2, 0] };
  const result = reconcileImportAnswerChecks({ answers: [first] }, { answers: [{ ...first, correctOptionIndexes: [0, 2] }] });
  assert.equal((result.answers as any[])[0].verified, true);
  const empty = { ...first, correctOptionIndexes: [] };
  assert.equal((reconcileImportAnswerChecks({ answers: [empty] }, { answers: [empty] }).answers as any[])[0].verified, true);
});

test("truth and written answers are compared by their response type, not irrelevant option-index fields", () => {
  const types = new Map<string, "true_false" | "short_answer">([["source-1", "true_false"], ["source-2", "short_answer"]]);
  const one = { ...answer(0), correctAnswer: "True" };
  const two = { ...answer(0, "source-2"), correctAnswer: "42" };
  const disagreed = reconcileImportAnswerChecks({ answers: [one, two] }, { answers: [{ ...one, correctAnswer: "False" }, { ...two, correctAnswer: "24" }] }, types);
  assert.ok((disagreed.answers as any[]).every(item => item.verified === false));
  const agreed = reconcileImportAnswerChecks({ answers: [one] }, { answers: [{ ...one, correctAnswer: "Đúng" }] }, types);
  assert.equal((agreed.answers as any[])[0].verified, true);
});

test("answer disagreement stays flagged rather than being overridden by automatic recovery", async () => {
  let calls = 0;
  const result = await importQuizDocument("Câu 1: Which year?\nA. 1998\nB. 1997", async () => {
    calls++;
    return reconcileImportAnswerChecks({ answers: [answer(0)] }, { answers: [answer(1)] });
  }, [{ label: "Câu 1:", type: "multiple_choice" }]);
  assert.equal(calls, 1);
  assert.equal(result.questions[0].correctAnswer, "");
  assert.match(result.questions[0].importReview!.reason, /Independent answer checks/);
});

test("a redundant context copy is ignored without duplicating the question or rejecting its answer", async () => {
  const text = "Câu 1: Stem\nA. One\nB. Two";
  const result = await importQuizDocument(text, async () => ({ answers: [{ ...answer(0), context: "Stem\nA. One\nB. Two" }] }), [{ label: "Câu 1:", type: "multiple_choice" }]);
  assert.equal(result.questions[0].question, "Stem");
  assert.equal(result.questions[0].correctAnswer, "One");
  assert.equal(result.questions[0].importReview, undefined);
});

const item = (sourceId: string): ImportAnswerItem => ({ sourceId, type: "multiple_choice", question: "Which?", options: ["One", "Two"] });
const retryPrompt = (items: ImportAnswerItem[]) => `Independently solve these original questions.\nITEMS:\n${JSON.stringify(items)}`;

test("missing batch answers are retried individually without repeating completed checks", async () => {
  const items = [item("source-1"), item("source-2"), item("source-3")];
  const calls: Array<{ ids: string[]; visual: boolean }> = [];
  const result = await verifyImportAnswersWithRetry(retryPrompt(items), items, async (prompt, visual) => {
    const assigned = JSON.parse(prompt.split("\nITEMS:\n")[1]) as ImportAnswerItem[];
    calls.push({ ids: assigned.map(i => i.sourceId), visual });
    return { title: "Exam", answers: (visual || assigned.length === 1 ? assigned : assigned.slice(0, 1)).map(i => answer(0, i.sourceId)) };
  });
  assert.deepEqual(calls, [
    { ids: items.map(i => i.sourceId), visual: false }, { ids: items.map(i => i.sourceId), visual: true },
    { ids: ["source-2"], visual: false }, { ids: ["source-3"], visual: false },
  ]);
  assert.equal(result.title, "Exam");
  assert.ok((result.answers as any[]).every(a => a.verified));
});

test("a focused independent recheck can resolve disagreement without sharing candidate answers", async () => {
  const items = [item("source-1")];
  let calls = 0;
  const result = await verifyImportAnswersWithRetry(retryPrompt(items), items, async (prompt, visual) => {
    calls++;
    if (calls > 2) {
      assert.match(prompt, /AUTOMATIC TARGETED RECHECK/);
      assert.doesNotMatch(prompt, /correctOptionIndex/);
      assert.deepEqual(JSON.parse(prompt.split("\nITEMS:\n")[1]), items);
    }
    return { answers: [answer(calls <= 2 && visual ? 1 : 0)] };
  });
  assert.equal(calls, 4);
  assert.equal((result.answers as any[])[0].verified, true);
  assert.equal((result.answers as any[])[0].correctOptionIndex, 0);
});

test("persistent disagreement or uncertainty is left pending after the bounded recheck", async () => {
  for (const uncertain of [false, true]) {
    const items = [item("source-1")];
    let calls = 0;
    const result = await verifyImportAnswersWithRetry(retryPrompt(items), items, async (_prompt, visual) => {
      calls++;
      return { answers: [{ ...answer(visual ? 1 : 0), verified: !uncertain, reason: "The source remains ambiguous." }] };
    });
    assert.equal(calls, 4);
    assert.equal((result.answers as any[])[0].verified, false);
  }
});

test("duplicate IDs, invalid indexes and missing solutions trigger a retry instead of false agreement", async () => {
  for (const broken of [[answer(0), answer(0)], [{ ...answer(9) }], [{ ...answer(0), solution: "" }], ["not an answer"]]) {
    const items = [item("source-1")];
    let calls = 0;
    const result = await verifyImportAnswersWithRetry(retryPrompt(items), items, async () => ({ answers: ++calls === 1 ? broken : [answer(0)] }));
    assert.equal(calls, 3);
    assert.equal((result.answers as any[])[0].verified, true);
  }
});

test("failed or malformed responses cannot discard other completed answers or loop forever", async () => {
  const items = [item("source-1"), item("source-2")];
  let calls = 0;
  const result = await verifyImportAnswersWithRetry(retryPrompt(items), items, async (_prompt, visual) => {
    calls++;
    if (!visual) throw new Error("Import response truncated");
    return { answers: items.map(i => answer(0, i.sourceId)) };
  });
  assert.equal(calls, 4);
  assert.equal((result.answers as any[]).length, 2);
  assert.ok((result.answers as any[]).every(a => !a.verified && /automatic retry/.test(a.reason)));
});

test("a failed visual recheck retains the reason for review instead of trusting the text answer alone", async () => {
  const items = [item("source-1")];
  let calls = 0;
  const result = await verifyImportAnswersWithRetry(retryPrompt(items), items, async (_prompt, visual) => {
    calls++;
    if (visual) throw new Error("Import response invalid_json");
    return { answers: [answer(0)] };
  });
  assert.equal(calls, 3);
  assert.equal((result.answers as any[])[0].verified, false);
  assert.match((result.answers as any[])[0].reason, /visual.*automatic retry/);
});

test("legacy option letters and type-specific answer fields are normalized before comparison", async () => {
  const items: ImportAnswerItem[] = [item("source-1"), { sourceId: "source-2", type: "true_false" }, { sourceId: "source-3", type: "selection", options: ["One", "Two"] }];
  let calls = 0;
  const result = await verifyImportAnswersWithRetry(retryPrompt(items), items, async (_prompt, visual) => {
    calls++;
    return { answers: [
      visual ? { ...answer(0), correctOptionIndexes: [1] } : { ...answer(0), correctOptionIndex: undefined, correctAnswer: "A" },
      { ...answer(0, "source-2"), correctAnswer: visual ? "True" : "Đúng!" },
      { ...answer(0, "source-3"), correctOptionIndexes: [] },
    ] };
  });
  assert.equal(calls, 2);
  assert.ok((result.answers as any[]).every(a => a.verified));
});
