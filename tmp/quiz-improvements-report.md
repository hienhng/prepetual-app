# Quiz generation and on-demand mistake feedback

Implemented the recommendations from the hard-exam test and restored submission-time wrong-answer explanations.

## Implemented

- Text-dense PDF pages now trigger visual transcription when they reference graphs, diagrams, tables, or contain fragmented equations. Transcription requests axes, points, dimensions, and table values tied to their questions. Provider reasoning tags are excluded from extracted source text.
- Fixed incompatible native canvas dependencies in PDF.js rendering. The supplied exam's six pages now render and transcribe successfully, including vector graphs.
- All four generated types receive independent answer solving without the original key or explanation. Numeric and conceptual short-answer keys receive a second independent final review.
- Source-grounded acceptance requires relevant verbatim quotes from every cited chunk. Existing citation IDs alone cannot approve an item.
- Required quality review rejects missing givens and unsupported source claims. Hard questions must demonstrate dependent reasoning; hard choice questions also require plausible distractors. Placeholder solutions and truncated audit outputs cannot pass.
- Hard audits use smaller batches and larger output budgets. Replacement rounds track missing requested types and reserve slots for them; completion requires both the requested count and all requested types.
- Generation, revision, import preparation, and legacy-quiz preparation approve the key and correct-answer explanation without generating distractor explanations.
- Wrong-answer explanations are requested only after the learner submits an incorrect response. Only selected incorrect options get individual explanations. Selection omissions receive feedback about missing correct choices. Correct submissions make no mistake-explanation request.
- Mistake feedback is independently reviewed, cached for identical submissions, and retained with attempts/retries. Failed verification leaves the answer unchecked for retry. Changed question content invalidates restored feedback.
- Old verification signatures require review again, including short-answer questions. A missing translation hook in the login dialog was repaired to unblock player verification.

## Verification

- Automated suite: **264 passed, 0 failed, 1 skipped**. The skipped test requires an opt-in database integration run; no test database records were created.
- TypeScript passes with `tsc --ignoreDeprecations 5.0`. The repository's existing `ignoreDeprecations: "6.0"` is incompatible with its installed TypeScript 5.6.3, so the command-line override was used without changing that configuration.
- Production client and server build passes.
- Browser fixture: selecting a wrong choice keeps explanation requests at zero; submitting it makes one request and displays feedback only beneath the selected wrong choice. A correct submitted choice makes zero explanation requests. Browser API responses are mocked; independent generation/review behavior is covered by server tests.

## Remaining live-provider limitation

The last live 20-question, hard, all-types attempt using the supplied PDF accepted **0/20** after stricter source, answer, formatting, and reasoning review. It published no quiz. Captured responses included unsupported citations, missing givens, insufficient reasoning, placeholder solutions, and truncated model output. The subsequent audit output-budget and batch-size adjustments passed local tests but have not been retested live. This implementation improves rejection and feedback timing; it does not demonstrate successful live generation of 20 hard questions or guarantee model correctness.

Live artifacts: `tmp/hard-quiz-after/`, `tmp/hard-quiz-final/`, and their corresponding logs. The original test report remains unchanged in `tmp/hard-quiz-live/TEST-REPORT.md`.
