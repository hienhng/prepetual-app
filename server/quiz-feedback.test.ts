import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import type { Question, Quiz } from "../shared/schema.js";
import { createQuizFeedbackHandler } from "./quiz-feedback.js";
import { markQuestionFeedbackPrepared } from "../shared/quiz-feedback.js";
import { UnverifiedAnswerError, type FeedbackCompletion } from "./verified-feedback.js";
import { createSubmittedAnswerExplainer } from "./submitted-answer-feedback.js";

const question: Question = { id: "q1", type: "multiple_choice", question: "Where does boiling vaporize liquid?",
  options: ["Inside only", "Inside and surface"], correctAnswer: "Inside and surface" };
const quiz = { id: "quiz", userId: "owner", isPublic: 0, questions: [question], sourceText: "Actual source", sourceImages: ["source-image"] } as Quiz;

async function request(options: { body?: Record<string, unknown>; public?: boolean; requester?: string; missing?: boolean;
  error?: Error; changedKey?: boolean; question?: Question; complete?: FeedbackCompletion } = {}) {
  let status = 200;
  let body: any;
  let explained: any;
  const storedQuestion = options.question || question;
  const explainer = options.complete ? createSubmittedAnswerExplainer(options.complete) : undefined;
  const handler = createQuizFeedbackHandler({
    storage: { getQuiz: async () => options.missing ? undefined : { ...quiz, isPublic: options.public ? 1 : 0, questions: [storedQuestion] } },
    explain: async (item, selectedAnswer, evidence) => {
      explained = { question: item, selectedAnswer, evidence };
      if (options.error) throw options.error;
      if (explainer) return explainer(item, selectedAnswer, evidence);
      return { question: markQuestionFeedbackPrepared({ ...item, explanation: "Generated explanation",
        ...(options.changedKey ? { correctAnswer: "Inside only" } : {}) }), explanation: "Generated explanation",
        wrongExplanation: "The surface also vaporizes.", wrongAnswerExplanations: { "Inside only": "The surface also vaporizes." } };
    },
  });
  await handler({ body: { quizId: "quiz", questionId: "q1", question: "Forged stem", correctAnswer: "Inside only",
    selectedAnswer: "Inside and surface", isCorrect: false, sourceText: "Forged source", quizLanguageContext: "Forged language", ...options.body },
    user: { claims: { sub: options.requester || "owner" } },
  } as unknown as Request, { status(code: number) { status = code; return this; }, json(value: unknown) { body = value; return this; } } as Response, () => {});
  return { status, body, explained };
}

test("explains the stored key and uses stored evidence, ignoring client grade and key", async () => {
  const result = await request();
  assert.equal(result.status, 200);
  assert.equal(result.explained.question, question);
  assert.equal(result.explained.evidence.sourceText, "Actual source");
  assert.deepEqual(result.explained.evidence.images, ["source-image"]);
  assert.match(result.explained.evidence.quizLanguageContext, /Where does boiling vaporize liquid/);
  assert.doesNotMatch(result.explained.evidence.quizLanguageContext, /Forged/);
  assert.equal(result.body.correctAnswer, question.correctAnswer);
  assert.equal(result.body.isCorrect, true);
  assert.equal(question.explanation, undefined);
});

test("incorrect answers retain their saved-key grade", async () => {
  const result = await request({ body: { selectedAnswer: "Inside only", isCorrect: true } });
  assert.equal(result.body.isCorrect, false);
  assert.equal(result.body.correctAnswer, question.correctAnswer);
  assert.equal(result.explained.selectedAnswer, "Inside only");
});

test("short answers require the model judge while empty truth-statement selections use their saved keys", async () => {
  const short = await request({ question: { ...question, type: "short_answer", options: undefined, correctAnswer: "Paris" }, body: { selectedAnswer: " PARIS " } });
  assert.equal(short.status, 400);
  assert.equal(short.body.isCorrect, undefined);
  assert.equal(short.explained, undefined);
  const empty = await request({ question: { ...question, type: "selection", selectionMode: "truth_statements", correctAnswer: "[]" }, body: { selectedAnswer: "[]" } });
  assert.equal(empty.status, 200);
  assert.equal(empty.body.isCorrect, true);
});

test("access failures and invalid choices stop before explanation generation", async () => {
  for (const [options, status] of [
    [{ requester: "other" }, 403], [{ missing: true }, 404],
    [{ body: { questionId: "missing" } }, 404], [{ body: { questionId: undefined } }, 400],
    [{ body: { selectedAnswer: "Forged choice" } }, 400],
    [{ question: { ...question, type: "selection", correctAnswer: '["Inside only","Inside and surface"]' }, body: { selectedAnswer: "invalid JSON" } }, 400],
  ] as const) {
    const result = await request(options);
    assert.equal(result.status, status);
    assert.equal(result.explained, undefined);
  }
  assert.equal((await request({ public: true, requester: "reader" })).status, 200);
});

test("explanation failure or a replacement key never changes the stored question", async () => {
  for (const options of [{ error: new UnverifiedAnswerError("Contradictory explanation") }, { changedKey: true }]) {
    const result = await request(options);
    assert.equal(result.status, 422);
    assert.equal(result.body.code, "ANSWER_REVIEW_REQUIRED");
    assert.equal(question.correctAnswer, "Inside and surface");
    assert.equal(question.explanation, undefined);
  }
});

test("selection feedback recovery returns reviewed explanations through the endpoint", async t => {
  t.mock.method(console, "warn", () => {});
  const energy: Question = { id: "q1", type: "selection", question: "Select ALL the examples that store energy:",
    options: ["A wooden table", "A battery", "Food", "A stretched rubber band"],
    correctAnswer: '["A battery","Food","A stretched rubber band"]' };
  let calls = 0;
  const result = await request({ question: energy, body: { selectedAnswer: '["A wooden table"]', isCorrect: true },
    complete: async prompt => {
      calls++;
      assert.match(prompt, /SOURCE EVIDENCE:\nActual source/);
      assert.doesNotMatch(prompt, /Forged source/);
      if (prompt.startsWith("Review")) return { answerCorrect: true, feedbackConsistent: calls === 4,
        reason: calls === 2 ? "Qualify the table explanation to the instructional scope." : "", feedbackIssues: [] };
      return { verified: true, explanation: "Chemical and elastic stores are the intended examples.",
        wrongExplanation: "The submission omits the intended examples.", optionExplanations: {
          "0": calls === 1 ? "A wooden table has no energy." : "An ordinary table is not presented as a practical energy store in this exercise.",
          "1": "A battery stores chemical energy.", "2": "Food stores chemical energy.", "3": "Stretching the rubber band stores elastic energy." } };
    } });
  assert.equal(result.status, 200);
  assert.equal(result.body.verified, true);
  assert.equal(result.body.isCorrect, false);
  assert.equal(result.body.correctAnswer, energy.correctAnswer);
  assert.equal(result.body.optionExplanations["A wooden table"], result.body.wrongAnswerExplanations["A wooden table"]);
  assert.doesNotMatch(result.body.optionExplanations["A wooden table"], /has no energy/);
  assert.equal(calls, 4);
});

test("the endpoint distinguishes failed explanation review from a rejected saved answer", async t => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(console, "error", () => {});
  for (const answerCorrect of [true, false]) {
    let calls = 0;
    const result = await request({ complete: async prompt => {
      calls++;
      return prompt.startsWith("Explain") ? { verified: true, explanation: "Vaporization takes place throughout and at the surface.",
        wrongExplanation: "", optionExplanations: { "1": "Vaporization takes place throughout and at the surface." } }
        : { answerCorrect, feedbackConsistent: false, reason: "The explanation needs a correction.", feedbackIssues: [] };
    } });
    assert.equal(result.status, answerCorrect ? 502 : 422);
    assert.equal(result.body.code, answerCorrect ? undefined : "ANSWER_REVIEW_REQUIRED");
    assert.equal(calls, answerCorrect ? 4 : 2);
  }
});

test("explanation generation failures return an unavailable response instead of answer review", async t => {
  t.mock.method(console, "error", () => {});
  for (const message of ["The AI returned a missing or empty quiz explanation after retry.",
    "The AI explanation failed feedback review after retry: An option explanation discussed another choice.",
    "The AI explanation reviewer returned an invalid verdict after retry.",
    "The AI returned invalid individual option feedback after retry: optionExplanations contains unexpected index 2.",
    "The AI returned invalid quiz explanation formatting after retry: explanation contains a Unicode math symbol outside delimiters."]) {
    const result = await request({ error: new Error(message) });
    assert.equal(result.status, 502);
    assert.equal(result.body.code, undefined);
    assert.match(result.body.message, /Unable to generate the explanation/);
  }
  assert.equal(question.correctAnswer, "Inside and surface");
});
