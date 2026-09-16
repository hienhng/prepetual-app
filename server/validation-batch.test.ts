import assert from "node:assert/strict";
import test from "node:test";
import {
  runValidationBatchWithIsolation,
  runValidationBatchesWithIsolation,
} from "./validation-batch.js";

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

test("processes top-level batches concurrently with a hard limit", async () => {
  let active = 0;
  let maxActive = 0;
  const rejected = await runValidationBatchesWithIsolation(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    {
      batchSize: 5,
      concurrency: 2,
      logPrefix: "[TEST]",
      action: "Auditing",
      log: () => undefined,
      warn: () => undefined,
    },
    async (batch) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;
      return new Set(batch.filter((item) => item % 5 === 0));
    },
  );

  assert.equal(maxActive, 2);
  assert.deepEqual([...rejected], [5, 10]);
});

test("reports completed items once per finished batch with four concurrent batches", async () => {
  let active = 0;
  let peak = 0;
  const progress: number[] = [];
  await runValidationBatchesWithIsolation(Array.from({ length: 20 }, (_, i) => i), {
    batchSize: 5, concurrency: 4, logPrefix: "[TEST]", action: "Auditing",
    log: () => undefined,
    onCompleted: (completed, total) => { assert.equal(total, 20); progress.push(completed); },
  }, async () => {
    peak = Math.max(peak, ++active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    return new Set<number>();
  });
  assert.equal(peak, 4);
  assert.deepEqual(progress, [5, 10, 15, 20]);
});
