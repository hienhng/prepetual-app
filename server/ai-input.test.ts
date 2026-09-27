import assert from "node:assert/strict";
import test from "node:test";

import {
  generateExplanationRequestSchema,
  generateLectureRequestSchema,
  gradeShortAnswerRequestSchema,
  importQuizRequestSchema,
  quizChatRequestSchema,
  reviseQuizRequestSchema,
  summarizeTextRequestSchema,
} from "./ai-input.js";
import {
  MAX_SOURCE_IMAGE_CHARS,
  MAX_SOURCE_IMAGES_TOTAL_CHARS,
} from "../shared/schema.js";

test("rejects oversized provider text inputs", () => {
  assert.equal(summarizeTextRequestSchema.safeParse({ text: "x".repeat(50_001) }).success, false);
  assert.equal(gradeShortAnswerRequestSchema.safeParse({ question: "q", userAnswer: "x".repeat(4_001) }).success, false);
});

test("rejects oversized individual and combined import images", () => {
  const oversizedImage = "x".repeat(MAX_SOURCE_IMAGE_CHARS + 1);
  assert.equal(importQuizRequestSchema.safeParse({ text: "valid text", documentImages: [oversizedImage] }).success, false);

  const third = "x".repeat(Math.floor(MAX_SOURCE_IMAGES_TOTAL_CHARS / 3) + 1);
  assert.equal(importQuizRequestSchema.safeParse({ text: "valid text", documentImages: [third, third, third] }).success, false);
});

test("accepts image-only imports but rejects an entirely empty import", () => {
  assert.equal(importQuizRequestSchema.safeParse({ text: "", documentImages: ["data:image/png;base64,abc"] }).success, true);
  assert.equal(importQuizRequestSchema.safeParse({ sourceImageUrl: "data:image/png;base64,abc" }).success, true);
  assert.equal(importQuizRequestSchema.safeParse({ text: "  " }).success, false);
});

test("bounds interactive AI prompts and chat history", () => {
  assert.equal(generateExplanationRequestSchema.safeParse({
    question: "q",
    correctAnswer: "a",
    selectedAnswer: "b",
    options: Array.from({ length: 11 }, () => "choice"),
  }).success, false);

  assert.equal(quizChatRequestSchema.safeParse({
    quizId: "quiz",
    currentQuestionIndex: 0,
    userMessage: "hello",
    chatHistory: Array.from({ length: 21 }, () => ({ role: "user", content: "hello" })),
  }).success, false);
});

test("bounds lecture and revision controls", () => {
  assert.equal(generateLectureRequestSchema.safeParse({ topicCount: 6 }).success, false);
  assert.equal(reviseQuizRequestSchema.safeParse({ userCorrectAnswer: "x".repeat(4_001) }).success, false);
});

test("accepts summary requests with text and source images", () => {
  const result = summarizeTextRequestSchema.safeParse({
    text: "Short extracted text can be supplemented by the original image.",
    documentImages: ["data:image/png;base64,abc"],
  });

  assert.equal(result.success, true);
});

test("accepts image-only summary requests", () => {
  const result = summarizeTextRequestSchema.safeParse({
    documentImages: ["data:image/png;base64,abc"],
  });

  assert.equal(result.success, true);
});

test("rejects empty summary requests", () => {
  const result = summarizeTextRequestSchema.safeParse({});

  assert.equal(result.success, false);
});
