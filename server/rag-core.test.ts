import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDocumentMap,
  chunkSourceText,
  cosineSimilarity,
  formatRagContext,
  normalizeSourceChunkIds,
  selectDiverseChunks,
  type RagRetrievalCandidate,
} from "./rag-core.js";

test("chunks the whole source with bounded overlap", () => {
  const source = Array.from({ length: 80 }, (_, index) => `Section ${index}\nThis paragraph contains fact number ${index} and enough detail for retrieval.`).join("\n\n");
  const chunks = chunkSourceText(source, { maxChars: 700, overlapChars: 100 });

  assert.ok(chunks.length > 1);
  assert.equal(chunks[0].startOffset, 0);
  assert.equal(chunks.at(-1)?.endOffset, source.length);
  for (let index = 1; index < chunks.length; index++) {
    assert.ok(chunks[index].startOffset < chunks[index - 1].endOffset);
    assert.ok(chunks[index].endOffset > chunks[index - 1].endOffset);
  }
});

test("builds a document map with beginning and ending coverage", () => {
  const chunks = chunkSourceText(Array.from({ length: 100 }, (_, index) => `Heading ${index}\nFact ${index}.`).join("\n\n"), {
    maxChars: 600,
    overlapChars: 0,
  });
  const map = buildDocumentMap(chunks, 4);
  assert.match(map, /Chunk 1\//);
  assert.match(map, new RegExp(`Chunk ${chunks.length}/${chunks.length}`));
});

test("computes cosine similarity and diversifies repeated retrieval results", () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);

  const candidates: RagRetrievalCandidate[] = [
    { id: "a", chunkIndex: 0, content: "A", startOffset: 0, endOffset: 1, embedding: [1, 0], similarity: 0.95, queryIndexes: [0] },
    { id: "b", chunkIndex: 1, content: "B", startOffset: 1, endOffset: 2, embedding: [0.99, 0.01], similarity: 0.94, queryIndexes: [0] },
    { id: "c", chunkIndex: 2, content: "C", startOffset: 2, endOffset: 3, embedding: [0, 1], similarity: 0.82, queryIndexes: [1] },
  ];

  const selected = selectDiverseChunks(candidates, { maxChunks: 2, maxChars: 2_000 });
  assert.deepEqual(selected.map((chunk) => chunk.id), ["a", "c"]);
});

test("formats retrieved chunks with machine-checkable evidence ids", () => {
  const formatted = formatRagContext([
    { id: "chunk-123", chunkIndex: 4, content: "Grounded fact.", startOffset: 20, endOffset: 34, similarity: 0.9 },
  ]);
  assert.match(formatted, /SOURCE_CHUNK id="chunk-123"/);
  assert.match(formatted, /citation="S1"/);
  assert.match(formatted, /Grounded fact/);
});

test("accepts only retrieved evidence ids", () => {
  const allowed = new Set(["chunk-a", "chunk-b"]);
  assert.deepEqual(normalizeSourceChunkIds(["chunk-a", "chunk-a", "chunk-b"], allowed), ["chunk-a", "chunk-b"]);
  assert.equal(normalizeSourceChunkIds([], allowed), null);
  assert.equal(normalizeSourceChunkIds(["invented"], allowed), null);
});
