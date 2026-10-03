import assert from "node:assert/strict";
import test from "node:test";
import { advanceQuizGenerationProgress } from "./quiz-generation-progress";

test("stage and checkpoint events keep progress moving forward through completion", () => {
  // Checkpoints report the accepted question count and can trail an audit stage.
  const events = [5, 20, 35, 40, 59, 65, 69, 75, 83, 87, 89, 61, 90, 93, 100, 98];
  let progress = 0;
  const displayed = events.map(event => progress = advanceQuizGenerationProgress(progress, event));
  assert.deepEqual(displayed, [5, 20, 35, 40, 59, 65, 69, 75, 83, 87, 89, 89, 90, 93, 100, 100]);
});

test("a new run resets progress after a completed, failed, or paused attempt", () => {
  for (const previous of [100, 89, 61]) {
    const reset = advanceQuizGenerationProgress(previous, 0);
    assert.equal(reset, 0);
    assert.equal(advanceQuizGenerationProgress(reset, 5), 5);
  }
});

test("invalid updates cannot corrupt the bar and valid updates stay in bounds", () => {
  for (const invalid of [NaN, Infinity, -Infinity, -10]) {
    assert.equal(advanceQuizGenerationProgress(45, invalid), 45);
  }
  assert.equal(advanceQuizGenerationProgress(45, 150), 100);
});
