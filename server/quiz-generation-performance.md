# Quiz generation performance

- Prompt-only requests create study material first, then generate and audit questions grounded in that material. The generated notes and their index are saved with the quiz and its resumable draft, supporting the material viewer and evidence-grounded chat. This adds a material-generation model call before question generation. Older prompt quizzes without saved material continue to use questions and general knowledge for chat.
- Sources whose complete formatted context fits within 14,000 characters bypass query planning and retrieval. Their index is built alongside generation using the same citation IDs. Saving waits for indexing to succeed.
- Larger sources index and plan retrieval queries concurrently. Retrieval waits for the index.
- Embeddings are reused only for the same user, exact source hash, model, dimensions, and chunk content. Each quiz receives its own index copy, preserving existing deletion behavior. No database migration is needed.
- Initial generation includes one or two reserve candidates. Only the requested number of validated questions is saved. Recovery requests contain the missing count plus one, capped at eight.
- Audits remain independent. Up to four batches run at once; set `QUIZ_VALIDATION_CONCURRENCY` to 1–4 for provider limits. Audit batches grow from five to at most six candidates to accommodate the reserve without a fifth batch for a 20-question quiz.
- Local normalization repairs whitespace and unambiguous choice labels before completion checks; it never supplies missing factual answers.

## Measurement

`[QUIZ TIMING]` logs stage and total milliseconds with a request ID. `[RAG TIMING]` logs indexing latency; `[RAG INDEX]` records cache hits. `[QUIZ COUNTS]` records initial/replacement requests, incomplete candidates, audited candidates, and rejections. Counts of generation requests include retries; audit candidate counts are not provider-call counts (failed batches can retry or split).

Compare equivalent inputs and counts separately for prompt-only, short-source, long-source, image, cache-hit, and cache-miss requests. Track median and p95 total latency alongside rejection and recovery rates. Reserve candidates increase initial output slightly, so their benefit depends on rejection rates. No live-provider speedup has been measured yet.

## Saved progress and resume

Apply `npm run db:generation-drafts` before deploying resumable generation (migration `0002_quiz_generation_drafts.sql`). This adds a private draft table without altering existing quizzes.

Each completed validation round checkpoints accepted questions, title, and category. Exhausted attempts return a `paused` event with the saved count instead of discarding the quiz. The Create page opens a confirmation dialog as soon as a run pauses, showing the saved count and offering Continue generation or Not now. It stays on Create until the full quiz completes; no recovery panel is shown in the library or dashboard. There is no automatic paid retry: users decide when to resume. Resuming reuses stored settings, source context, and question IDs, skips initial generation and revalidation of saved questions, and fills only the deficit. Only a complete quiz is published into the user's library.

Drafts survive page refreshes and server restarts. A database lease prevents concurrent resumes; a stopped server's lease becomes resumable after two minutes. Checkpoint writes are fenced with a run token, and quiz creation and draft completion commit in one transaction. Interrupted rounds retain the last saved checkpoint; model output that has not yet completed validation is not saved. Completed drafts discard their source payload.

Unit coverage: `node --import tsx --test server/quiz-generation-resume.test.ts`. Opt-in database integration coverage uses temporary test records and mocked AI: set `RUN_DRAFT_DB_TEST=1` and run `dotenv -e .env -- node --import tsx --test server/quiz-generation-drafts.integration.test.ts`.
