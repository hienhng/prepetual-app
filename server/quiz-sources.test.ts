import assert from "node:assert/strict";
import test from "node:test";

import { generateQuizRequestSchema } from "../shared/schema.js";
import { resolveQuizGenerationSources } from "./quiz-sources.js";

const quizSettings = {
  questionCount: 10,
  questionTypes: ["multiple_choice"] as const,
  difficulty: "medium" as const,
};

test("accepts material, a prompt, and images in one quiz request", () => {
  const parsed = generateQuizRequestSchema.safeParse({
    ...quizSettings,
    materialText: "A sufficiently detailed set of study notes about plant cells and photosynthesis.",
    prompt: "Focus on cause and effect for a high-school learner.",
    documentImages: ["data:image/png;base64,abc"],
  });

  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  const sources = resolveQuizGenerationSources(parsed.data);
  assert.match(sources.materialText, /plant cells/);
  assert.match(sources.prompt, /cause and effect/);
  assert.equal(sources.hasImages, true);
  assert.equal(sources.promptOnly, false);
});

test("keeps prompt-only generation distinct from mixed-source generation", () => {
  const promptOnly = generateQuizRequestSchema.parse({
    ...quizSettings,
    prompt: "Create a quiz about plate tectonics.",
  });
  assert.equal(resolveQuizGenerationSources(promptOnly).promptOnly, true);

  const promptWithImage = generateQuizRequestSchema.parse({
    ...quizSettings,
    prompt: "Focus on the labelled structures.",
    documentImages: ["data:image/png;base64,abc"],
    isImageOnly: true,
  });
  assert.equal(resolveQuizGenerationSources(promptWithImage).promptOnly, false);
});

test("continues to accept legacy single-source clients", () => {
  const legacyPrompt = generateQuizRequestSchema.parse({
    ...quizSettings,
    text: "Create a quiz about the water cycle.",
    sourceType: "prompt",
  });
  const resolvedPrompt = resolveQuizGenerationSources(legacyPrompt);
  assert.equal(resolvedPrompt.promptOnly, true);
  assert.equal(resolvedPrompt.materialText, "");

  const legacyMaterial = generateQuizRequestSchema.parse({
    ...quizSettings,
    text: "These are detailed legacy study notes about evaporation, condensation, and precipitation.",
    sourceType: "material",
  });
  assert.match(resolveQuizGenerationSources(legacyMaterial).materialText, /evaporation/);
});

test("rejects a request without any source", () => {
  assert.equal(generateQuizRequestSchema.safeParse(quizSettings).success, false);
});
