import assert from "node:assert/strict";
import test from "node:test";
import { prepareQuizSource } from "./quiz-source-preparation.js";

const params = { userId: "owner", text: "Photosynthesis converts light into chemical energy. ".repeat(8), questionCount: 10, questionTypes: ["multiple_choice" as const], difficulty: "medium" as const };

function harness() {
  let finishIndex!: () => void;
  const barrier = new Promise<void>((resolve) => { finishIndex = resolve; });
  const calls: string[] = [];
  let indexing: any;
  const deps = {
    async indexRagSource(input: any) {
      indexing = input;
      calls.push("index");
      await barrier;
      calls.push("indexed");
      return { sourceId: input.sourceId, chunks: [], documentMap: "", embeddingModel: "test" };
    },
    async planQuizRetrievalQueries() { calls.push("plan"); return ["biology"]; },
    async retrieveRagContext() { calls.push("retrieve"); return { chunks: [], context: "evidence", allowedChunkIds: ["evidence"] }; },
    async deleteRagSource() { calls.push("delete"); },
  };
  return { deps, calls, finishIndex, indexing: () => indexing };
}

test("short source is available before indexing, with the same persistent citation IDs", async () => {
  const h = harness();
  const result = await prepareQuizSource(params, h.deps);
  assert.deepEqual(h.calls, ["index"]);
  assert.equal(result.sourceId, h.indexing().sourceId);
  assert.deepEqual(result.retrieved.allowedChunkIds, h.indexing().chunkIds);
  assert.ok(result.retrieved.context.includes(params.text.trim()));
  h.finishIndex();
  assert.deepEqual(await result.ready, { ok: true });
});

test("long-source planning overlaps indexing, but retrieval waits for it", async () => {
  const h = harness();
  const pending = prepareQuizSource({ ...params, text: params.text.repeat(80) }, h.deps);
  await Promise.resolve();
  assert.deepEqual(h.calls, ["index", "plan"]);
  h.finishIndex();
  const result = await pending;
  assert.deepEqual(h.calls, ["index", "plan", "indexed", "retrieve"]);
  assert.equal(result.retrieved.context, "evidence");
});

test("failed planning waits for the index writer before deleting its source", async () => {
  const h = harness();
  h.deps.planQuizRetrievalQueries = async () => { throw new Error("planner failed"); };
  const pending = prepareQuizSource({ ...params, text: params.text.repeat(80) }, h.deps);
  const rejected = assert.rejects(pending, /planner failed/);
  await Promise.resolve();
  assert.deepEqual(h.calls, ["index"]);
  h.finishIndex();
  await rejected;
  assert.deepEqual(h.calls, ["index", "indexed", "delete"]);
});

test("background indexing failure is retained for the route to reject before saving", async () => {
  const h = harness();
  const error = new Error("embedding unavailable");
  h.deps.indexRagSource = async () => { throw error; };
  const result = await prepareQuizSource(params, h.deps);
  assert.deepEqual(await result.ready, { ok: false, error });
});
