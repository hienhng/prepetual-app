import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Question } from "../shared/schema.js";
import { getQuestionFeedbackSignature } from "../shared/quiz-feedback.js";

type Verdict = { isCorrect: boolean; isPartial: boolean };

function questionSignature(question: Question): string {
  return createHash("sha256").update(getQuestionFeedbackSignature(question)).digest("base64url");
}

function signature(payload: string): Buffer {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required to sign model grades");
  return createHmac("sha256", process.env.SESSION_SECRET).update(`short-answer-grade:${payload}`).digest();
}

export function signShortAnswerGrade(quizId: string | undefined, question: Question, answer: string, verdict: Verdict): string {
  const payload = Buffer.from(JSON.stringify({ quizId, questionId: question.id,
    questionSignature: questionSignature(question), answer, isCorrect: verdict.isCorrect, isPartial: verdict.isPartial })).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
}

/** Only accept a model verdict issued for this exact saved question and submitted answer. */
export function verifyShortAnswerGrade(token: string | undefined, quizId: string, question: Question, answer: string): Verdict | null {
  if (!token || question.type !== "short_answer") return null;
  try {
    const [payload, mac, extra] = token.split(".");
    if (!payload || !mac || extra !== undefined) return null;
    const expected = signature(payload);
    const actual = Buffer.from(mac, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const grade = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (grade.quizId !== quizId || grade.questionId !== question.id || grade.answer !== answer ||
        grade.questionSignature !== questionSignature(question) ||
        typeof grade.isCorrect !== "boolean" || typeof grade.isPartial !== "boolean" ||
        (grade.isCorrect && grade.isPartial)) return null;
    return { isCorrect: grade.isCorrect, isPartial: grade.isPartial };
  } catch { return null; }
}
