import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "../shared/schema.js";
import { markQuestionFeedbackPrepared } from "../shared/quiz-feedback.js";
import { createWrongAnswerExplainer } from "./wrong-answer-feedback.js";
import { UnverifiedAnswerError } from "./verified-feedback.js";

const question = markQuestionFeedbackPrepared({ id: "q", type: "multiple_choice", question: "Where does boiling vaporize liquid?",
  options: ["Inside only", "Inside and surface", "Surface only", "Nowhere"], correctAnswer: "Inside and surface",
  explanation: "Boiling vaporizes liquid inside and at the surface." });
const mistake = { verified: true, wrongExplanation: "The surface also vaporizes.", wrongOptionExplanations: { "0": "Vaporization also occurs at the surface." } };

test("generates and independently reviews only the submitted wrong option, caching identical submissions", async () => {
  const prompts: string[] = [];
  const explain = createWrongAnswerExplainer(async prompt => {
    prompts.push(prompt);
    return prompt.startsWith("Explain this learner") ? mistake : { answerCorrect: true, feedbackConsistent: true };
  });
  const first = await explain(question, "Inside only");
  assert.deepEqual(first.wrongAnswerExplanations, { "Inside only": mistake.wrongOptionExplanations["0"] });
  assert.match(prompts[0], /"wrongOptionIndexes":\[0\]/);
  assert.match(prompts[0], /ONLY for wrongOptionIndexes/);
  first.wrongExplanation = "Mutation";
  assert.equal((await explain(question, "Inside only")).wrongExplanation, mistake.wrongExplanation);
  assert.equal(prompts.length, 2);
  await explain({ ...question, id: "retry-q" }, "Inside only");
  assert.equal(prompts.length, 2);
});

test("invalid or unreviewed feedback never reaches the player or cache", async () => {
  for (const result of [
    { ...mistake, verified: false }, { ...mistake, wrongExplanation: "" },
    { ...mistake, wrongOptionExplanations: {} },
    { ...mistake, wrongOptionExplanations: { "1": "The correct choice is wrong." } },
    { ...mistake, wrongOptionExplanations: { "0": "Surface also vaporizes.", "2": "An unselected distractor." } },
  ]) {
    let calls = 0;
    const explain = createWrongAnswerExplainer(async () => { calls++; return result; });
    await assert.rejects(explain(question, "Inside only"), UnverifiedAnswerError);
    await assert.rejects(explain(question, "Inside only"), UnverifiedAnswerError);
    assert.equal(calls, 2);
  }
  const explain = createWrongAnswerExplainer(async prompt => prompt.startsWith("Explain this learner") ? mistake : { answerCorrect: false, feedbackConsistent: true });
  await assert.rejects(explain(question, "Inside only"), UnverifiedAnswerError);
  await assert.rejects(explain(question, "Forged answer"), UnverifiedAnswerError);
});

test("selection with omitted correct choices explains the omission without criticizing selected correct choices", async () => {
  const selected = markQuestionFeedbackPrepared({ ...question, type: "selection", question: "Select all primes.", options: ["2", "3", "4", "9"], correctAnswer: '["2","3"]', explanation: "Two and three are prime." } as Question);
  let calls = 0;
  const explain = createWrongAnswerExplainer(async prompt => {
    calls++;
    if (prompt.startsWith("Explain this learner")) {
      assert.match(prompt, /"wrongOptionIndexes":\[\]/);
      return { verified: true, wrongExplanation: "Three is also prime and must be selected.", wrongOptionExplanations: {} };
    }
    return { answerCorrect: true, feedbackConsistent: true };
  });
  const [a, b] = await Promise.all([explain(selected, '["2"]'), explain(selected, '["2"]')]);
  assert.equal(calls, 2);
  assert.deepEqual(a.wrongAnswerExplanations, {});
  assert.match(a.wrongExplanation, /Three/);
  assert.deepEqual(a, b);
  assert.notEqual(a, b);
});
