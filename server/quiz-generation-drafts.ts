import { randomUUID } from "node:crypto";
import { and, eq, lt, ne, or, desc, sql } from "drizzle-orm";
import { db } from "./db.js";
import { quizzes, ragSources, quizGenerationDrafts as drafts, type QuizCategory } from "../shared/schema.js";
import { generateQuizQuestions, type QuizGenerationParams } from "./openai.js";
import { indexRagSource } from "./rag.js";

type Payload = {
  generation: Omit<QuizGenerationParams, "onProgress" | "onCheckpoint" | "resumeState">;
  quiz: Omit<typeof quizzes.$inferInsert, "questions" | "title" | "category">;
  indexingText: string;
};
type Draft = typeof drafts.$inferSelect;
const lease = () => new Date(Date.now() + 120_000);
const ownsRun = (draft: Draft) => and(eq(drafts.id, draft.id), eq(drafts.userId, draft.userId), eq(drafts.runToken, draft.runToken), eq(drafts.status, "running"));

export function draftSummary(draft: Draft) {
  return { id: draft.id, title: draft.title, requested: draft.requested, generated: draft.questions.length,
    status: draft.status === "running" && draft.leaseUntil <= new Date() ? "paused" : draft.status };
}

export async function listGenerationDrafts(userId: string) {
  // Poll only summaries, not source documents, images, or answer keys.
  const rows = await db.select({ id: drafts.id, title: drafts.title, requested: drafts.requested,
    generated: sql<number>`jsonb_array_length(${drafts.questions})`, status: drafts.status, leaseUntil: drafts.leaseUntil,
  }).from(drafts).where(and(eq(drafts.userId, userId), ne(drafts.status, "complete"))).orderBy(desc(drafts.updatedAt));
  return rows.map(({ leaseUntil, ...row }) => ({ ...row,
    status: row.status === "running" && leaseUntil <= new Date() ? "paused" : row.status }));
}

export async function createGenerationDraft(userId: string, payload: Payload) {
  const [draft] = await db.insert(drafts).values({ userId, payload, requested: payload.generation.questionCount,
    status: "running", runToken: randomUUID(), leaseUntil: lease() }).returning();
  return draft;
}

export async function claimGenerationDraft(userId: string, id: string) {
  const [draft] = await db.update(drafts).set({ status: "running", runToken: randomUUID(), leaseUntil: lease(), updatedAt: new Date() })
    .where(and(eq(drafts.id, id), eq(drafts.userId, userId), or(eq(drafts.status, "paused"), and(eq(drafts.status, "running"), lt(drafts.leaseUntil, new Date()))))).returning();
  return draft;
}

export async function runGenerationDraft(draft: Draft, onProgress?: QuizGenerationParams["onProgress"], ready?: Promise<{ ok: true } | { ok: false; error: unknown }>) {
  const payload = draft.payload as Payload;
  // Renew the lease while model calls are in flight; stale writers are fenced by runToken.
  const heartbeat = setInterval(() => {
    void db.update(drafts).set({ leaseUntil: lease() }).where(ownsRun(draft)).catch((error) => console.error("Draft heartbeat failed", error));
  }, 30_000);
  heartbeat.unref();
  try {
    if (!ready && payload.generation.ragGrounding) {
      const grounding = payload.generation.ragGrounding;
      const [source] = await db.select({ id: ragSources.id }).from(ragSources)
        .where(and(eq(ragSources.id, grounding.sourceId), eq(ragSources.userId, draft.userId)));
      if (!source) {
        // A short-source run may pause before its parallel index could finish.
        await indexRagSource({ userId: draft.userId, text: payload.indexingText,
          sourceId: grounding.sourceId, chunkIds: grounding.allowedChunkIds });
      }
    }
    const result = await generateQuizQuestions({ ...payload.generation,
      resumeState: draft.questions.length ? { questions: draft.questions, title: draft.title, category: draft.category as QuizCategory } : undefined,
      onProgress,
      onCheckpoint: async (checkpoint) => {
        // Persist accepted questions even if parallel indexing needs another try.
        // The source context and citation IDs are already part of the draft.
        const [saved] = await db.update(drafts).set({ ...checkpoint, leaseUntil: lease(), updatedAt: new Date() })
          .where(ownsRun(draft)).returning();
        if (!saved) throw new Error("This draft is being resumed by another request.");
        draft = saved;
        onProgress?.("checkpoint", Math.round(95 * checkpoint.questions.length / draft.requested),
          `${checkpoint.questions.length} of ${draft.requested} validated questions saved.`);
      },
    });
    const indexed = await ready;
    if (indexed && !indexed.ok) throw indexed.error;
    // Completing and saving are atomic; retries cannot create a second quiz.
    const quiz = await db.transaction(async (tx) => {
      const [owned] = await tx.update(drafts).set({ status: "complete", payload: null, updatedAt: new Date() }).where(ownsRun(draft)).returning({ id: drafts.id });
      if (!owned) throw new Error("This draft is being resumed by another request.");
      const [saved] = await tx.insert(quizzes).values({ ...payload.quiz, ...result, id: draft.id, userId: draft.userId }).returning();
      return saved;
    });
    return { type: "complete" as const, quiz };
  } catch (error) {
    console.warn("Quiz generation paused; checkpoint retained", { draftId: draft.id, error });
    await ready;
    const [paused] = await db.update(drafts).set({ status: "paused", updatedAt: new Date() }).where(ownsRun(draft)).returning();
    if (!paused) throw new Error("This draft is being resumed by another request.");
    return { type: "paused" as const, draft: draftSummary(paused), message: `${paused.questions.length} of ${paused.requested} questions saved. Resume when you’re ready.` };
  } finally {
    clearInterval(heartbeat);
  }
}
