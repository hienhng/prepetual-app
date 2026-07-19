import assert from "node:assert/strict";
import test from "node:test";

import { getMultipleChoiceOptionQualityIssue } from "./quiz-quality.js";

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
