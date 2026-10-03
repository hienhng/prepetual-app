# Three-question live generation result

The production generator did not complete the requested quiz: 1 of 3 questions passed before all three replacement rounds were exhausted. The accepted question was multiple choice. Selection and short answer remained missing.

- Requested: three HARD questions, Vietnamese, multiple choice / selection / short answer.
- Provider: configured Groq endpoint, model openai/gpt-oss-120b, real requests and audits.
- Duration: 273.958 seconds; 34 provider requests, including language detection and title handling.
- Final error: INSUFFICIENT_VALID_QUESTIONS at top_up.
- Scope: synthetic physics source; the generator, source-record checks, plan checks, writer, independent answer audits, final review, focused repairs, replacement limits and checkpoint callback were exercised. Upload/OCR, database retrieval, HTTP/SSE and persistence were excluded.

## Observed failures

1. The initial plan review returned HTTP 400 json_validate_failed. Its failed_generation had malformed objects inside the reviews array. The entire initial plan batch was discarded. See response-5.json.
2. Writer contract violations still occurred. In response-11.json the selection solution supplied answer as an array, while the solver parser requires a string. That candidate was discarded before presentation. Some other stems omitted source givens or left units outside math delimiters. Source instructions alone did not prevent these failures.
3. Language handling failed for some choice questions: Vietnamese stems with English answer choices. Repairs retained English choices, and the independent answer audit rejected them. See response-14.json and response-15.json.
4. Independent answer audits introduced formatting defects in their replacement answers/explanations. Code then rejected these audited fields for units/formulas outside math delimiters, including repaired questions. See response-22.json and response-24.json. This failure is downstream of the writer.
5. Some later plans were rejected for difficulty and rewritten; a later calorimetry stem still lacked required givens. No selection or short-answer question reached final acceptance.

## Outcome

One multiple-choice item passed the independent solution audit and final review in replacement round three. Its checkpoint passed an additional local formatting check and strict KaTeX rendering; its proposed heat, work, time and COP values also agree arithmetically. This is partial progress, not a working three-question generation pipeline.

No production code was changed during this test. The cached exam was not sent: automatic approval review rejected that payload, so the completed test used newly authored synthetic data containing no personal information. The first synthetic harness attempt stopped before writing questions because the harness used the wrong chunk field; that harness error was corrected before the reported run.

Artifacts: report.json, requests.json, request-N.json, response-N.json, checkpoint.json, checkpoint-checks.json and accepted-question.md. Full console log is ../quiz-writer-three-live.log.
