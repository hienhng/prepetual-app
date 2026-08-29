import assert from "node:assert/strict";
import test from "node:test";

import {
  canManageQuiz,
  canReadQuiz,
  canReadQuizResult,
} from "./quiz-access.js";

const privateQuiz = { userId: "owner", isPublic: 0 };
const publicQuiz = { userId: "owner", isPublic: 1 };

test("public quizzes are readable without authentication", () => {
  assert.equal(canReadQuiz(publicQuiz), true);
  assert.equal(canReadQuiz(publicQuiz, "another-user"), true);
});

test("private quizzes are readable only by their owner", () => {
  assert.equal(canReadQuiz(privateQuiz), false);
  assert.equal(canReadQuiz(privateQuiz, "another-user"), false);
  assert.equal(canReadQuiz(privateQuiz, "owner"), true);
});

test("only the owner can mutate a quiz, including public quizzes", () => {
  assert.equal(canManageQuiz(publicQuiz), false);
  assert.equal(canManageQuiz(publicQuiz, "another-user"), false);
  assert.equal(canManageQuiz(publicQuiz, "owner"), true);
});

test("ownerless quizzes cannot be treated as privately owned", () => {
  assert.equal(canReadQuiz({ userId: null, isPublic: 0 }, "any-user"), false);
  assert.equal(canManageQuiz({ userId: null }, "any-user"), false);
  assert.equal(canReadQuiz({ userId: null, isPublic: 1 }), true);
});

test("quiz results are readable only by the participant or quiz owner", () => {
  const result = { userId: "participant" };

  assert.equal(canReadQuizResult(publicQuiz, result), false);
  assert.equal(canReadQuizResult(publicQuiz, result, "another-user"), false);
  assert.equal(canReadQuizResult(publicQuiz, result, "participant"), true);
  assert.equal(canReadQuizResult(publicQuiz, result, "owner"), true);
});

test("anonymous results are visible only to the quiz owner", () => {
  const anonymousResult = { userId: null };

  assert.equal(canReadQuizResult(publicQuiz, anonymousResult, "another-user"), false);
  assert.equal(canReadQuizResult(publicQuiz, anonymousResult, "owner"), true);
});
