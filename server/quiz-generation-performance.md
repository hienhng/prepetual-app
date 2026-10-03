# Quiz generation and grading

Generation uses the direct writer flow: source preparation, one request for complete questions, local structure checks, and bounded top-ups for missing or malformed questions. The experimental source-record planner, plan reviews, independent answer audits, semantic review, focused repair, and math rewriting have been removed from generation. Questions are saved without an answer-verification marker.

Code checks question types, answer/option shape, duplicate stems and choices, basic math formatting, and allowed citation IDs. These checks do not establish factual correctness. The existing language preference is still resolved and included in writer requests. Prompt-material language checks and explicit edit-language checks remain separate from answer verification.

Opening a quiz only loads it. Imports, edits, and smart-review creation do not pre-verify answer feedback. Saving an unchanged question preserves an existing server verification; changing it or adding a new question removes client-supplied verification markers.

When the learner presses Check:

1. An unverified objective question is solved independently, without the writer's answer key. A second check reviews the answer and explanation.
2. The server saves verified feedback with a compare-and-update operation, then grades the selected answer against that key.
3. Incorrect submissions receive feedback about the selected wrong answers or omitted correct choices. Verified answers can be reused for subsequent checks.
4. If verification fails, the answer remains unchecked and the learner can retry. Short answers use their submission-time AI grader; a failed request does not fall back to the unverified writer key.

Final quiz submission verifies any answered objective question that has not already been checked. Unanswered questions do not trigger verification.

## Saved generation progress

Each successful local-validation round checkpoints its questions, title, and category. Exhausted top-ups pause the draft. Resume preserves saved questions and requests only the deficit, without re-auditing saved answers. Only the complete requested count is published.

The existing draft lease, fenced checkpoint writes, and atomic completion remain in place. The opt-in database integration test requires `RUN_DRAFT_DB_TEST=1`; ordinary regression tests use mocked model requests.

`[QUIZ TIMING]` reports stage and total durations. `[QUIZ COUNTS]` reports writer requests, replacement requests, locally rejected candidates, and accepted counts. Model latency is now primarily paid during answer checking rather than quiz generation.
