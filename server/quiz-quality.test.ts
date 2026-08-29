import assert from "node:assert/strict";
import test from "node:test";

import {
  getMultipleChoiceOptionQualityIssue,
  hasEmbeddedMultipleChoiceOptions,
  isSourceStructureMetadataQuestion,
  normalizeMultipleChoiceAnswerSet,
  stripChoicePrefix,
} from "./quiz-quality.js";

test("rejects answer choices embedded at the end of a reading question", () => {
  const question = `The benefits of regular exercise are numerous. Regular exercise can reduce the risk of chronic diseases and improve mental health. The author's use of "additionally" serves to A) Introduce a contrasting idea. B) Emphasize a particular point. C) Add a new idea to the discussion. D) Conclude the passage.`;

  assert.equal(hasEmbeddedMultipleChoiceOptions(question), true);
});

test("recognizes embedded choices across lines and Markdown emphasis", () => {
  const question = "Which conclusion is best supported?\n**A)** First option\n**B)** Second option\n**C)** Third option\n**D)** Fourth option";

  assert.equal(hasEmbeddedMultipleChoiceOptions(question), true);
});

test("does not reject ordinary references to letters", () => {
  assert.equal(
    hasEmbeddedMultipleChoiceOptions("How does vitamin A support normal vision?"),
    false,
  );
});

test("rejects generated questions about source page and question locations", () => {
  assert.equal(isSourceStructureMetadataQuestion("Which page is Question 3 on?"), true);
  assert.equal(isSourceStructureMetadataQuestion("On which page does question 3 appear?"), true);
  assert.equal(isSourceStructureMetadataQuestion("Câu hỏi số 3 nằm ở trang nào?"), true);
  assert.equal(isSourceStructureMetadataQuestion("How many questions are in this worksheet?"), true);
});

test("keeps real subject-matter questions that happen to mention pages", () => {
  assert.equal(
    isSourceStructureMetadataQuestion(
      "A book has 120 pages and Lan reads 30 pages per day. How many days will she need?",
    ),
    false,
  );
  assert.equal(
    isSourceStructureMetadataQuestion("How does page replacement work in virtual memory?"),
    false,
  );
});

test("rejects bare answer labels in any order", () => {
  assert.match(getMultipleChoiceOptionQualityIssue(["A", "C", "B", "D"]) ?? "", /choice labels/);
});

test("rejects generic placeholders", () => {
  assert.match(
    getMultipleChoiceOptionQualityIssue(["Option 1", "Option 2", "Option 3", "Option 4"]) ?? "",
    /placeholder/,
  );
});

test("rejects labels with no answer text", () => {
  assert.match(getMultipleChoiceOptionQualityIssue(["A)", "B)", "C)", "D)"]) ?? "", /without answer text/);
});

test("rejects the same content hidden behind different labels", () => {
  assert.match(
    getMultipleChoiceOptionQualityIssue(["A) Sóng cơ", "B) Sóng cơ", "C) Âm thanh", "D) Ánh sáng"]) ?? "",
    /duplicate answer text/,
  );
});

test("accepts meaningful Vietnamese answer choices", () => {
  assert.equal(
    getMultipleChoiceOptionQualityIssue([
      "Truyền năng lượng mà không truyền vật chất theo sóng",
      "Chỉ truyền được trong chân không",
      "Luôn là sóng ngang",
      "Không phụ thuộc vào môi trường",
    ]),
    null,
  );
});

test("accepts concise numeric choices used by math questions", () => {
  assert.equal(getMultipleChoiceOptionQualityIssue(["1", "2", "3", "4"]), null);
});

test("strips common letter and numeric choice-prefix styles", () => {
  assert.equal(stripChoicePrefix("C. Compressible"), "Compressible");
  assert.equal(stripChoicePrefix("(b) Expands to fill a container"), "Expands to fill a container");
  assert.equal(stripChoicePrefix("2: Fixed equilibrium positions"), "Fixed equilibrium positions");
  assert.equal(stripChoicePrefix("1.5 kg"), "1.5 kg");
});

test("keeps the correct answer attached to its text while removing shuffled source labels", () => {
  assert.deepEqual(
    normalizeMultipleChoiceAnswerSet(
      [
        "C. Easy to compress",
        "D. Moves continuously and randomly",
        "B. Expands to fill its container",
        "A. Oscillates around fixed equilibrium positions",
      ],
      "A. Oscillates around fixed equilibrium positions",
    ),
    {
      options: [
        "Easy to compress",
        "Moves continuously and randomly",
        "Expands to fill its container",
        "Oscillates around fixed equilibrium positions",
      ],
      correctAnswer: "Oscillates around fixed equilibrium positions",
    },
  );
});

test("resolves a label-only answer against the source labels before removing them", () => {
  const normalized = normalizeMultipleChoiceAnswerSet(
    ["C. Third", "A. First", "D. Fourth", "B. Second"],
    "A",
  );

  assert.equal(normalized?.correctAnswer, "First");
});

test("rejects an answer that cannot be mapped uniquely to an option", () => {
  assert.equal(
    normalizeMultipleChoiceAnswerSet(
      ["A. Same", "B. Same", "C. Different", "D. Another"],
      "Same",
    ),
    null,
  );
});
