import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "../shared/schema.js";
import { signShortAnswerGrade, verifyShortAnswerGrade } from "./short-answer-grade.js";

process.env.SESSION_SECRET ||= "short-answer-grade-test-secret";
const question: Question = { id: "q1", type: "short_answer", question: "What energy does a stretched spring store?", correctAnswer: "Elastic potential energy" };

test("the final score retains a model verdict for differently worded and partial answers", () => {
  for (const verdict of [{ isCorrect: true, isPartial: false }, { isCorrect: false, isPartial: true }, { isCorrect: false, isPartial: false }]) {
    const answer = "Energy stored by stretching";
    const token = signShortAnswerGrade("quiz", question, answer, verdict);
    assert.deepEqual(verifyShortAnswerGrade(token, "quiz", question, answer), verdict);
  }
});

test("missing, tampered, stale and mismatched model verdicts cannot score a short answer", () => {
  const answer = "Energy stored by stretching";
  const token = signShortAnswerGrade("quiz", question, answer, { isCorrect: true, isPartial: false });
  for (const candidate of [undefined, "garbage", token + "extra", token + ".extra"]) {
    assert.equal(verifyShortAnswerGrade(candidate, "quiz", question, answer), null);
  }
  assert.equal(verifyShortAnswerGrade(token, "another-quiz", question, answer), null);
  assert.equal(verifyShortAnswerGrade(token, "quiz", { ...question, id: "q2" }, answer), null);
  assert.equal(verifyShortAnswerGrade(token, "quiz", { ...question, question: "Changed question" }, answer), null);
  assert.equal(verifyShortAnswerGrade(token, "quiz", question, "Changed answer"), null);
  const [payload, mac] = token.split(".");
  const forged = JSON.parse(Buffer.from(payload, "base64url").toString());
  forged.isCorrect = false;
  assert.equal(verifyShortAnswerGrade(`${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${mac}`, "quiz", question, answer), null);
});
