import assert from "node:assert/strict";
import test from "node:test";
import { runValidationBatchWithIsolation } from "./validation-batch.js";

test("isolates a permanently failing item without rejecting its batch-mates", async () => {
  const calls: number[][] = [];
  const rejected = await runValidationBatchWithIsolation(
    [1, 2, 3, 4, 5],
    "[TEST]",
    async (batch) => {
      calls.push(batch);
      if (batch.includes(3)) throw new Error("malformed validator response");
      return new Set<number>();
    },
    () => undefined,
  );

  assert.deepEqual([...rejected], [3]);
  assert.deepEqual(calls[0], [1, 2, 3, 4, 5]);
  assert.ok(calls.some((batch) => batch.length === 1 && batch[0] === 3));
  assert.ok(calls.some((batch) => batch.includes(1) && !batch.includes(3)));
});

test("preserves normal per-question rejections without splitting a successful batch", async () => {
  let calls = 0;
  const rejected = await runValidationBatchWithIsolation(
    [1, 2, 3],
    "[TEST]",
    async () => {
      calls += 1;
      return new Set([2]);
    },
    () => undefined,
  );

  assert.equal(calls, 1);
  assert.deepEqual([...rejected], [2]);
});
