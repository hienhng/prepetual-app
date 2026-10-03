import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "../../../shared/schema.js";
import { markQuestionFeedbackPrepared } from "../../../shared/quiz-feedback.js";
import { fetchJudgedShortAnswer, fetchVerifiedQuizFeedback, getQuestionFeedbackSignature, getQuizOptionExplanation, QuizFeedbackError } from "./verified-quiz-feedback.js";

const original: Question = { id: "q1", type: "multiple_choice", question: "Where does boiling vaporize liquid?", options: ["Inside only", "Inside and surface"], correctAnswer: "Inside and surface", explanation: "" };
const verified: Question = markQuestionFeedbackPrepared({ ...original, correctAnswer: "Inside and surface", explanation: "Boiling vaporizes liquid inside and at the surface.", wrongAnswerExplanations: { "Inside only": "The surface also vaporizes." } });

test("short answers use the judge endpoint and retain its correct, partial or incorrect verdict", async t => {
  const question: Question = { id: "short", type: "short_answer", question: "What is France's capital?", correctAnswer: "Paris" };
  for (const verdict of [{ isCorrect: true, isPartial: false }, { isCorrect: false, isPartial: true }, { isCorrect: false, isPartial: false }]) {
    t.mock.method(globalThis, "fetch", async (url, init) => {
      assert.equal(url, "/api/grade-short-answer");
      const sent = JSON.parse(String(init?.body));
      assert.equal(sent.questionId, "short");
      assert.equal(sent.quizId, "quiz");
      assert.equal(sent.userAnswer, "The city of Paris");
      return new Response(JSON.stringify({ ...verdict, explanation: "Model assessment.", gradingToken: "receipt" }));
    });
    const result = await fetchJudgedShortAnswer("quiz", question, "The city of Paris");
    assert.equal(result.isCorrect, verdict.isCorrect);
    assert.equal(result.isPartial, verdict.isPartial);
    assert.equal(result.judgedAnswer, "The city of Paris");
    t.mock.restoreAll();
  }
  for (const response of [{}, { isCorrect: true, isPartial: true, explanation: "Conflicting verdict.", gradingToken: "receipt" },
    { isCorrect: false, isPartial: false, explanation: "", gradingToken: "receipt" }]) {
    t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(response)));
    await assert.rejects(fetchJudgedShortAnswer("quiz", question, "Paris"), QuizFeedbackError);
    t.mock.restoreAll();
  }
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ message: "Unavailable" }), { status: 502 }));
  await assert.rejects(fetchJudgedShortAnswer("quiz", question, "Paris"), QuizFeedbackError);
});

test("explanation response preserves the saved answer key and identifies the stored question", async t => {
  let sent: any;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    sent = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ verified: true, question: verified, correctAnswer: verified.correctAnswer, isCorrect: true, explanation: verified.explanation,
      optionExplanations: { "Inside and surface": verified.explanation } }));
  });
  const feedback = await fetchVerifiedQuizFeedback("quiz", original, "Inside and surface");
  assert.equal(sent.quizId, "quiz");
  assert.equal(sent.questionId, "q1");
  assert.equal(feedback.question.correctAnswer, "Inside and surface");
  assert.equal(original.correctAnswer, "Inside and surface");
});

test("unverified or stale responses cannot replace the player's question", async t => {
  for (const response of [
    { verified: false, question: verified }, { verified: true, question: markQuestionFeedbackPrepared({ ...verified, correctAnswer: "Inside only" }) }, { verified: true, question: { ...verified, id: "other" } },
    { verified: true, question: { ...verified, explanation: "" } },
    { verified: true, question: { ...verified, options: ["Different options"] } },
    { verified: true, question: { ...verified, correctAnswer: "Not an option" } },
  ]) {
    t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(response)));
    await assert.rejects(fetchVerifiedQuizFeedback("quiz", original, "Inside and surface"), QuizFeedbackError);
    t.mock.restoreAll();
  }
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ code: "ANSWER_REVIEW_REQUIRED" }), { status: 422 }));
  await assert.rejects(fetchVerifiedQuizFeedback("quiz", original, "Inside and surface"), (error: unknown) => error instanceof QuizFeedbackError && error.code === "ANSWER_REVIEW_REQUIRED");
});

test("restored feedback becomes invalid when its answer or explanations change", () => {
  const signature = getQuestionFeedbackSignature(verified);
  assert.notEqual(signature, getQuestionFeedbackSignature({ ...verified, correctAnswer: "Inside only" }));
  assert.notEqual(signature, getQuestionFeedbackSignature({ ...verified, explanation: "A contradictory explanation" }));
  assert.notEqual(signature, getQuestionFeedbackSignature({ ...verified, wrongAnswerExplanations: original.wrongAnswerExplanations }));
  assert.equal(signature, getQuestionFeedbackSignature({ ...verified, id: "retry-q1" }));
});

test("multiple-choice and true/false dropdowns never fall back to whole-answer summaries", () => {
  for (const type of ["multiple_choice", "true_false"] as const) {
    const item: Question = type === "multiple_choice" ? original
      : { ...original, type, question: "Boiling vaporizes liquid internally.", options: undefined, correctAnswer: "True" };
    const options = type === "true_false" ? ["True", "False"] : original.options!;
    const feedback = { isCorrect: false, isPartial: false, explanation: "Summary discussing multiple choices.",
      wrongExplanation: "Summary comparing the submitted and correct answers.", wrongAnswerExplanations: { [options[1]]: "Legacy mistake explanation." },
      optionExplanations: { [options[0]]: "Explanation for this option alone.", [options[1]]: "Explanation for that option alone." },
      verifiedFeedbackSignature: getQuestionFeedbackSignature(item) };
    assert.equal(getQuizOptionExplanation(item, feedback, options[0]), "Explanation for this option alone.");
    assert.equal(getQuizOptionExplanation(item, feedback, options[1]), "Explanation for that option alone.");
    for (const option of options) assert.equal(getQuizOptionExplanation(item, { ...feedback, optionExplanations: undefined }, option), null);
    assert.equal(getQuizOptionExplanation({ ...item, question: "Changed stem" }, feedback, options[0]), null);
  }
});

test("multiple-choice and true/false responses require each displayed option's own feedback", async t => {
  for (const type of ["multiple_choice", "true_false"] as const) {
    const item = markQuestionFeedbackPrepared(type === "multiple_choice" ? { ...original, options: ["Inside only", "Inside and surface", "Surface only"], explanation: "Summary." }
      : { ...original, type, question: "Boiling vaporizes liquid internally.", options: undefined, correctAnswer: "True", explanation: "Summary." });
    const options = type === "true_false" ? ["True", "False"] : item.options!;
    const optionExplanations = { [options[0]]: "This option's explanation.", [options[1]]: "That option's explanation." };
    t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ verified: true, question: item, optionExplanations })));
    await fetchVerifiedQuizFeedback("quiz", item, options[type === "true_false" ? 1 : 0]);
    t.mock.restoreAll();
    for (const entries of [undefined, {}, { [item.correctAnswer]: "Only the correct answer explained." }, { ...optionExplanations, extra: "Unselected choice." }]) {
      t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ verified: true, question: item, optionExplanations: entries })));
      await assert.rejects(fetchVerifiedQuizFeedback("quiz", item, options[type === "true_false" ? 1 : 0]), QuizFeedbackError);
      t.mock.restoreAll();
    }
  }
});

test("selection dropdowns use the individual option explanation without summary fallback", () => {
  const selection: Question = { ...original, type: "selection", options: ["2", "3", "4"], correctAnswer: '["2","3"]' };
  const feedback = { isCorrect: false, isPartial: false, explanation: "Two and three are prime.",
    wrongExplanation: "Select two and three, omit four.", wrongAnswerExplanations: { "4": "Legacy summary." },
    optionExplanations: { "2": "Two is prime.", "3": "Three is prime.", "4": "Four is composite." },
    verifiedFeedbackSignature: getQuestionFeedbackSignature(selection) };
  assert.equal(getQuizOptionExplanation(selection, feedback, "2"), "Two is prime.");
  assert.equal(getQuizOptionExplanation(selection, feedback, "3"), "Three is prime.");
  assert.equal(getQuizOptionExplanation(selection, feedback, "4"), "Four is composite.");
  assert.equal(getQuizOptionExplanation(selection, { ...feedback, optionExplanations: undefined }, "2"), null);
  assert.equal(getQuizOptionExplanation(selection, { ...feedback, optionExplanations: undefined }, "4"), null);
  assert.equal(getQuizOptionExplanation({ ...selection, question: "Changed stem" }, feedback, "2"), null);
  assert.equal(getQuizOptionExplanation({ ...selection, id: "retry-q1" }, feedback, "2"), "Two is prime.");
});

test("selection response requires feedback for each displayed option", async t => {
  const selection: Question = markQuestionFeedbackPrepared({ ...original, type: "selection", options: ["2", "3", "4", "5"],
    correctAnswer: '["2","3"]', explanation: "Two and three are prime." });
  const response = { verified: true, question: selection, optionExplanations: { "2": "Two is prime.", "3": "Three is prime.", "4": "Four is composite." } };
  let sent: any;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    sent = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(response));
  });
  const feedback = await fetchVerifiedQuizFeedback(undefined, selection, '["2","4"]', "English source", "Ôn tập số học");
  assert.equal(feedback.optionExplanations["2"], "Two is prime.");
  assert.equal(sent.quizLanguageContext, "Ôn tập số học");
  t.mock.restoreAll();
  for (const optionExplanations of [undefined, {}, { "2": "Two is prime." }, { ...response.optionExplanations, "5": "Unselected distractor." }]) {
    t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ ...response, optionExplanations })));
    await assert.rejects(fetchVerifiedQuizFeedback("quiz", selection, '["2","4"]'), QuizFeedbackError);
    t.mock.restoreAll();
  }
});
