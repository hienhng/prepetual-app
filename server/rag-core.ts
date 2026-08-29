export const RAG_EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_RAG_CHUNK_CHARS = 1_800;
export const DEFAULT_RAG_OVERLAP_CHARS = 260;

export interface SourceTextChunk {
  chunkIndex: number;
  content: string;
  startOffset: number;
  endOffset: number;
  sectionLabel?: string;
}

export interface RagRetrievalCandidate extends SourceTextChunk {
  id: string;
  embedding: number[];
  similarity: number;
  queryIndexes: number[];
}

export interface RagContextChunk extends SourceTextChunk {
  id: string;
  similarity: number;
}

function normalizeSourceText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function normalizeSourceChunkIds(
  value: unknown,
  allowedIds: ReadonlySet<string>,
  maxIds = 4,
): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids = [...new Set(value.map((id) => String(id).trim()).filter(Boolean))];
  if (ids.length === 0 || ids.length > maxIds) return null;
  if (ids.some((id) => !allowedIds.has(id))) return null;
  return ids;
}

function findChunkEnd(text: string, start: number, maxChars: number): number {
  const hardEnd = Math.min(text.length, start + maxChars);
  if (hardEnd === text.length) return hardEnd;

  const searchStart = start + Math.floor(maxChars * 0.55);
  const window = text.slice(searchStart, hardEnd);
  const boundaries = ["\n\n", "\n", ". ", "? ", "! ", "; "];

  for (const boundary of boundaries) {
    const relativeIndex = window.lastIndexOf(boundary);
    if (relativeIndex >= 0) {
      return searchStart + relativeIndex + boundary.length;
    }
  }

  const lastSpace = window.lastIndexOf(" ");
  return lastSpace >= 0 ? searchStart + lastSpace + 1 : hardEnd;
}

function detectSectionLabel(content: string): string | undefined {
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const heading = lines.find((line) =>
    /^#{1,6}\s+\S/.test(line) ||
    (/^[\p{L}\p{N}][^.!?]{2,90}:?$/u.test(line) && line.split(/\s+/).length <= 12),
  );
  return heading?.replace(/^#{1,6}\s+/, "").slice(0, 120);
}

export function chunkSourceText(
  rawText: string,
  options: { maxChars?: number; overlapChars?: number } = {},
): SourceTextChunk[] {
  const text = normalizeSourceText(rawText);
  if (!text) return [];

  const maxChars = Math.max(600, options.maxChars ?? DEFAULT_RAG_CHUNK_CHARS);
  const overlapChars = Math.max(0, Math.min(options.overlapChars ?? DEFAULT_RAG_OVERLAP_CHARS, maxChars - 200));
  const chunks: SourceTextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = findChunkEnd(text, start, maxChars);
    const content = text.slice(start, end).trim();
    if (content) {
      chunks.push({
        chunkIndex: chunks.length,
        content,
        startOffset: start,
        endOffset: end,
        sectionLabel: detectSectionLabel(content),
      });
    }

    if (end >= text.length) break;
    let nextStart = Math.max(start + 1, end - overlapChars);
    const nextBoundary = text.indexOf(" ", nextStart);
    if (nextBoundary >= 0 && nextBoundary < end) nextStart = nextBoundary + 1;
    start = nextStart;
  }

  return chunks;
}

function compactExcerpt(content: string, maxChars: number): string {
  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length <= maxChars ? compact : `${compact.slice(0, maxChars - 1)}…`;
}

export function buildDocumentMap(chunks: SourceTextChunk[], maxEntries = 36): string {
  if (chunks.length === 0) return "";
  const entryCount = Math.min(Math.max(1, maxEntries), chunks.length);
  const indexes = new Set<number>();

  if (entryCount === 1) {
    indexes.add(0);
  } else {
    for (let i = 0; i < entryCount; i++) {
      indexes.add(Math.round((i * (chunks.length - 1)) / (entryCount - 1)));
    }
  }

  return [...indexes]
    .sort((a, b) => a - b)
    .map((index) => {
      const chunk = chunks[index];
      const label = chunk.sectionLabel ? ` — ${chunk.sectionLabel}` : "";
      return `[Chunk ${chunk.chunkIndex + 1}/${chunks.length}${label}] ${compactExcerpt(chunk.content, 240)}`;
    })
    .join("\n");
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function candidateCost(candidate: RagRetrievalCandidate): number {
  return candidate.content.length + 150;
}

export function selectDiverseChunks(
  candidates: RagRetrievalCandidate[],
  options: { maxChunks?: number; maxChars?: number; relevanceWeight?: number } = {},
): RagContextChunk[] {
  const maxChunks = Math.max(1, options.maxChunks ?? 10);
  const maxChars = Math.max(1_000, options.maxChars ?? 14_000);
  const relevanceWeight = Math.min(1, Math.max(0, options.relevanceWeight ?? 0.72));
  const unique = new Map<string, RagRetrievalCandidate>();

  for (const candidate of candidates) {
    const existing = unique.get(candidate.id);
    if (!existing || candidate.similarity > existing.similarity) {
      unique.set(candidate.id, {
        ...candidate,
        queryIndexes: [...new Set([...(existing?.queryIndexes ?? []), ...candidate.queryIndexes])],
      });
    } else {
      existing.queryIndexes = [...new Set([...existing.queryIndexes, ...candidate.queryIndexes])];
    }
  }

  const pool = [...unique.values()];
  const selected: RagRetrievalCandidate[] = [];
  let usedChars = 0;

  // Seed coverage with the strongest result for each retrieval query.
  const queryIndexes = [...new Set(pool.flatMap((candidate) => candidate.queryIndexes))].sort((a, b) => a - b);
  for (const queryIndex of queryIndexes) {
    if (selected.length >= maxChunks) break;
    const best = pool
      .filter((candidate) => candidate.queryIndexes.includes(queryIndex) && !selected.some((item) => item.id === candidate.id))
      .sort((a, b) => b.similarity - a.similarity)[0];
    if (!best || usedChars + candidateCost(best) > maxChars) continue;
    selected.push(best);
    usedChars += candidateCost(best);
  }

  while (selected.length < maxChunks) {
    let best: RagRetrievalCandidate | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const candidate of pool) {
      if (selected.some((item) => item.id === candidate.id)) continue;
      if (usedChars + candidateCost(candidate) > maxChars) continue;
      const redundancy = selected.length === 0
        ? 0
        : Math.max(...selected.map((item) => cosineSimilarity(candidate.embedding, item.embedding)));
      const mmrScore = relevanceWeight * candidate.similarity - (1 - relevanceWeight) * Math.max(0, redundancy);
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        best = candidate;
      }
    }

    if (!best) break;
    selected.push(best);
    usedChars += candidateCost(best);
  }

  return selected
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map(({ embedding: _embedding, queryIndexes: _queryIndexes, ...chunk }) => chunk);
}

export function formatRagContext(chunks: RagContextChunk[], maxChars = 15_000): string {
  const parts: string[] = [];
  let usedChars = 0;

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    const header = `[SOURCE_CHUNK id="${chunk.id}" citation="S${index + 1}" position="${chunk.chunkIndex + 1}"${chunk.sectionLabel ? ` section="${chunk.sectionLabel.replace(/"/g, "'")}"` : ""}]`;
    const block = `${header}\n${chunk.content}\n[/SOURCE_CHUNK]`;
    if (usedChars + block.length > maxChars) break;
    parts.push(block);
    usedChars += block.length + 2;
  }

  return parts.join("\n\n");
}
