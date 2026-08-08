import assert from "node:assert/strict";
import test from "node:test";

import {
  getMultipleChoiceOptionQualityIssue,
  hasEmbeddedMultipleChoiceOptions,
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
