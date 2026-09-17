import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPromptMaterialSystemInstructions,
  buildPromptSettingsDetectionInstructions,
  resolvePromptQuizSettings,
  validateDetectedPromptSettings,
} from "./prompt-material.js";

test("builds a source-first material instruction for prompt quizzes", () => {
  const instructions = buildPromptMaterialSystemInstructions({
    questionCount: 12,
    questionTypes: ["multiple_choice", "short_answer"],
    difficulty: "hard",
  });

  assert.match(instructions, /ONLY instructional source/);
  assert.match(instructions, /12 HARD-difficulty questions/);
  assert.match(instructions, /multiple-choice, short-answer/);
  assert.match(instructions, /answered from it alone/);
  assert.match(instructions, /Do not write a quiz/);
});

test("includes assessment guidance in material creation", () => {
  const instructions = buildPromptMaterialSystemInstructions({
    questionCount: 8,
    questionTypes: ["multiple_choice"],
    difficulty: "medium",
    assessmentGuidance: "Create original reading stimuli, not assessment trivia.",
  });

  assert.match(instructions, /ASSESSMENT-SPECIFIC GUIDANCE/);
  assert.match(instructions, /original reading stimuli/);
});

test("builds focused model instructions for detecting prompt settings", () => {
  const instructions = buildPromptSettingsDetectionInstructions();

  assert.match(instructions, /Determine only these two settings/);
  assert.match(instructions, /World War 2/);
  assert.match(instructions, /cap it at 20/);
  assert.match(instructions, /use 10/);
  assert.match(instructions, /use "medium"/);
  assert.match(instructions, /ANY language/);
  assert.match(instructions, /omitted accents/);
});

test("uses explicit prompt settings when present", () => {
  assert.deepEqual(
    resolvePromptQuizSettings("Create a 10-question quiz in hard difficulty about biology."),
    { questionCount: 10, difficulty: "hard" },
  );
});

test("validates any model-extracted count within the slider range", () => {
  for (let count = 3; count <= 20; count++) {
    assert.deepEqual(resolvePromptQuizSettings("", {
      questionCount: count, questionCountSpecified: true,
      difficulty: "hard", difficultySpecified: true,
    }), { questionCount: count, difficulty: "hard" });
  }
});

test("prefills count and difficulty from descriptive question requests", () => {
  assert.deepEqual(
    resolvePromptQuizSettings("Make me 15 difficult questions focusing on Newton's laws and conceptual reasoning"),
    { questionCount: 15, difficulty: "hard" },
  );
  assert.deepEqual(
    resolvePromptQuizSettings("Make 8 easy questions about World War 2"),
    { questionCount: 8, difficulty: "easy" },
  );
  assert.deepEqual(
    resolvePromptQuizSettings("Create a quiz about hard water and World War 2"),
    { questionCount: 10, difficulty: "medium" },
  );
});

test("uses ten medium questions when prompt settings are absent", () => {
  assert.deepEqual(
    resolvePromptQuizSettings("Create a quiz about biology."),
    { questionCount: 10, difficulty: "medium" },
  );
});

test("defaults only the setting that is missing", () => {
  assert.deepEqual(
    resolvePromptQuizSettings("Create a quiz about biology at hard difficulty."),
    { questionCount: 10, difficulty: "hard" },
  );
  assert.deepEqual(
    resolvePromptQuizSettings("Create an 8-question quiz about biology."),
    { questionCount: 8, difficulty: "medium" },
  );
});

test("recognizes Vietnamese numeric and difficulty settings", () => {
  assert.deepEqual(
    resolvePromptQuizSettings("Tạo 15 câu hỏi sinh học với độ khó: khó."),
    { questionCount: 15, difficulty: "hard" },
  );
});

test("accepts model-recognized settings for natural phrasing", () => {
  assert.deepEqual(
    resolvePromptQuizSettings("Make me a dozen challenging questions about biology.", {
      questionCount: 12,
      questionCountSpecified: true,
      difficulty: "hard",
      difficultySpecified: true,
    }),
    { questionCount: 12, difficulty: "hard" },
  );
});

test("caps an explicit numeric question count above twenty", () => {
  assert.deepEqual(
    resolvePromptQuizSettings("Create a 25-question quiz about biology."),
    { questionCount: 20, difficulty: "medium", questionCountCapped: true },
  );
});

test("caps an above-limit count recognized by the model", () => {
  assert.deepEqual(
    resolvePromptQuizSettings("Make me twenty-five questions about biology.", {
      questionCount: 25,
      questionCountSpecified: true,
    }),
    { questionCount: 20, difficulty: "medium", questionCountCapped: true },
  );
});

test("does not use model values marked as unspecified", () => {
  assert.deepEqual(
    resolvePromptQuizSettings("Create a quiz about World War 2.", {
      questionCount: 20,
      questionCountSpecified: false,
      difficulty: "hard",
      difficultySpecified: false,
    }),
    { questionCount: 10, difficulty: "medium" },
  );
});

test("rejects malformed multilingual model output instead of silently defaulting", () => {
  for (const candidate of [{}, { questionCount: 15, difficulty: "khó" },
    { questionCount: "十五", difficulty: "hard" }, { questionCount: 15 }]) {
    assert.throws(() => validateDetectedPromptSettings(candidate));
  }
  assert.deepEqual(validateDetectedPromptSettings({ questionCount: 15, difficulty: "hard" }),
    { questionCount: 15, difficulty: "hard" });
});
