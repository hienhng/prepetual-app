# Writer/checker changes and live verification

The final live generation completed with three questions: one short answer, one selection and one multiple choice. It used the same synthetic Vietnamese physics fixture and hard difficulty as the previous run.

- Duration: 271.766 seconds (about 4 minutes 32 seconds).
- Provider requests: 40, including language/title handling and bounded recovery.
- All three items passed the closed-book independent answer check and final source/answer/explanation review.
- Upload/OCR, database retrieval, HTTP/SSE and library persistence were excluded.

## Changes

- Independent answer checks preserve the writer's answer and explanation. Choice-key disagreement triggers repair. Independently solved short answers are private evidence for final semantic comparison.
- The answer checker receives only learner-visible stems and options. Source facts and source images are withheld; grounding and literal source support are checked in the final review.
- Choice keys are derived from claims, removing the redundant answer-field requirement that discarded a valid selection structure.
- Malformed JSON and missing stage arrays receive a bounded retry at that stage.
- Writer and repair requests use the full resolved language instruction.
- Code normalizes uniformly doubled LaTeX escapes and simple number/unit presentation, keeping option texts and keys synchronized. It preserves existing formulas, matrix rows and unsupported/ambiguous expressions for validation rather than guessing repairs.

## Verification and remaining limits

61 targeted tests passed. TypeScript passed with the existing compiler-compatibility override `--ignoreDeprecations 5.0`.

The live run finished before the final presentation normalizer was added. Its original output had doubled short-answer escapes and a plain-unit distractor. Applying the same new production normalizer locally to the saved output passed all field checks and rendered 58 math expressions without errors or unintended newlines. No additional model run was used for these presentation-only corrections. Original provider responses and quiz.json remain unchanged; quiz-formatted.md is the corrected readable artifact.

Arithmetic spot checks: the short-answer minimum time is 560/3 seconds for 16/9 cycles A and 2 cycles B; the selection explanation's mixture satisfies the heat, time and work limits; the multiple-choice key's 2 cycles A and 1.8 cycles B yield 2160 kJ heat, 192 seconds, 792 kJ work and COP about 2.73.

This is one successful synthetic run. Generation remains expensive and slow: all replacement rounds were used, many drafts omitted givens, and altered source excerpts caused two extracted records to be discarded. Those are remaining reliability and performance issues, rather than resolved by this test.

The earlier rerun in ../quiz-writer-three-fixed stopped at 2/3 and manual inspection found missing givens in accepted items; its result should not be counted as a quality success. That finding prompted the closed-book checker separation.
