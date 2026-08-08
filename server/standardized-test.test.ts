import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAssessmentQuestionTypePreference,
  getAssessmentPracticeProfile,
  isOffScopeAssessmentMetadataQuestion,
} from "./standardized-test.js";

test("recognizes SAT Reading and Writing practice as a skill simulation", () => {
  const profile = getAssessmentPracticeProfile("Create a SAT Reading & Writing practice quiz");

  assert.equal(profile?.id, "digital-sat-reading-writing");
  assert.match(profile?.guidance ?? "", /25–150 words/);
  assert.match(profile?.guidance ?? "", /not as a request for trivia/i);
  assert.match(profile?.guidance ?? "", /Information and Ideas/);
});

test("prefers the authentic multiple-choice type when it is available", () => {
  const profile = getAssessmentPracticeProfile("SAT reading and writing practice");

  assert.deepEqual(
    applyAssessmentQuestionTypePreference(["multiple_choice", "true_false"], profile),
    ["multiple_choice"],
  );
});

test("does not invent an unsupported type when multiple choice was not allowed", () => {
  const profile = getAssessmentPracticeProfile("SAT verbal practice");

  assert.deepEqual(applyAssessmentQuestionTypePreference(["short_answer"], profile), ["short_answer"]);
});

test("distinguishes an explicit quiz about SAT metadata", () => {
  assert.equal(getAssessmentPracticeProfile("Quiz me about the SAT"), null);
  assert.equal(getAssessmentPracticeProfile("Quiz me on the SAT scoring and structure"), null);
  assert.equal(getAssessmentPracticeProfile("Create a quiz about the structure and scoring of the SAT"), null);
});

test("recognizes SAT Math separately", () => {
  assert.equal(getAssessmentPracticeProfile("Generate hard digital SAT math practice")?.id, "digital-sat-math");
});

test("flags obvious SAT trivia in an assessment-practice draft", () => {
  const profile = getAssessmentPracticeProfile("Create SAT Reading and Writing practice");

  assert.equal(isOffScopeAssessmentMetadataQuestion("What does SAT stand for?", profile), true);
  assert.equal(
    isOffScopeAssessmentMetadataQuestion("How many questions are on the digital SAT?", profile),
    true,
  );
  assert.equal(
    isOffScopeAssessmentMetadataQuestion(
      "A botanist compared leaf growth under red and blue light. Which choice best states the main idea of the text?",
      profile,
    ),
    false,
  );
});
