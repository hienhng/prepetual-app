import { randomUUID } from "node:crypto";
import { buildDocumentMap, chunkSourceText, formatRagContext } from "./rag-core.js";
import { getQuizRagBudget } from "./quiz-generation-policy.js";
import type { DifficultyLevel, QuestionType } from "../shared/schema.js";
import type * as Rag from "./rag.js";

type Dependencies = Pick<typeof Rag, "indexRagSource" | "planQuizRetrievalQueries" | "retrieveRagContext" | "deleteRagSource">;

export async function prepareQuizSource(params: {
  userId: string;
  text: string;
  sourceRequest?: string;
  questionCount: number;
  questionTypes: QuestionType[];
  difficulty: DifficultyLevel;
  onProgress?: (step: string, progress: number, message: string) => void;
}, deps: Dependencies) {
  const sourceId = randomUUID();
  const chunks = chunkSourceText(params.text).map((chunk) => ({ ...chunk, id: randomUUID(), similarity: 1 }));
  // Include framing and overlap in the threshold; never silently truncate a short source.
  const fullContext = formatRagContext(chunks, Number.MAX_SAFE_INTEGER);
  const direct = fullContext.length > 0 && fullContext.length <= 14_000;
  params.onProgress?.("indexing", 40, direct ? "Preparing source material..." : "Indexing source material...");
  const started = performance.now();
  // Settle immediately into a result to prevent unhandled rejections while generation runs.
  const ready = deps.indexRagSource({ ...params, sourceId, chunkIds: chunks.map((c) => c.id) })
    .then(() => ({ ok: true as const }), (error: unknown) => ({ ok: false as const, error }))
    .then((result) => {
      console.info("[RAG TIMING]", { sourceId, stage: "indexing", durationMs: Math.round(performance.now() - started), ok: result.ok });
      return result;
    });
  if (direct) {
    return { sourceId, ready, retrieved: { chunks, context: fullContext, allowedChunkIds: chunks.map((c) => c.id) } };
  }
  try {
    params.onProgress?.("retrieving", 48, "Finding relevant source evidence...");
    // Planning only needs the local document map, so overlap it with indexing.
    const queries = await deps.planQuizRetrievalQueries({ ...params, documentMap: buildDocumentMap(chunks) });
    const result = await ready;
    if (!result.ok) throw result.error;
    const retrieved = await deps.retrieveRagContext({ sourceId, ownerUserId: params.userId, queries, ...getQuizRagBudget(params.questionCount) });
    return { sourceId, ready, retrieved };
  } catch (error) {
    await ready;
    await deps.deleteRagSource({ sourceId, userId: params.userId });
    throw error;
  }
}
