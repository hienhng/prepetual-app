# Live hard quiz generation test

Tested on 2026-10-03 using the supplied six-page Vietnamese physics PDF.

**Result: FAIL.** The generator exhausted its three recovery rounds with only **12/20 accepted questions**, and accepted questions still contain factual errors and basic recall tasks.

## Configuration and scope

- Requested: 20 questions, hard difficulty, all four supported types: multiple_choice, selection, true_false, short_answer.
- Source: `C:/Users/Gia Hien/Downloads/Đề thi kscl giữa hk1 lần5 .pdf`.
- Actual application functions: `extractTextFromPDFWithOCR`, `resolveQuizOutputLanguage`, `generateQuizQuestions`, source chunking and formatting, independent answer audits, final language/feedback audits, and checkpoint callbacks.
- Live provider: Groq, model `openai/gpt-oss-120b`. User explicitly approved sending the extracted PDF text to Groq.
- Detected output language: Vietnamese.
- Full locally constructed source chunks were passed into the generator with source grounding enabled. All six pages fit in the generator context. Database indexing/retrieval, authentication, HTTP/SSE, browser behavior, database draft persistence, and publication were not tested. No quiz was saved to the app library.
- No production application files were changed. The harness and evidence are under `tmp/`.

## Measured outcome

- PDF extraction: 6/6 pages, 15,404 characters, about 4.3 seconds in the initial extraction pass. No page triggered OCR/vision transcription.
- Generation and audits: 109.8 seconds. Total live harness run: 111.7 seconds using the cached, unchanged extraction.
- 18 real provider requests, all completed with HTTP 200 and finish reason `stop`.
- 22 initial candidates plus three rounds of 8 replacement candidates: 46 total candidates.
- Accepted counts by round: 6, then 7, then 10, then 12.
- Final error: `INSUFFICIENT_VALID_QUESTIONS`, stage `top_up`, requested 20, generated 12.
- Final checkpoint: 1 multiple-choice, 1 selection, 3 true/false, 7 short-answer questions. All types appear, but the count requirement fails.
- Existing targeted local tests: 44 passed, 0 failed. These cover PDF extraction/layout, generation policy, selection answers, completion, language, resume, and source preparation. They use mocked AI and did not predict the live failures.

## Confirmed quality defects

1. **Incorrect physics survived both audits.** Checkpoint Q2 says refrigerator COP is heat rejected to the environment divided by compressor work and marks it True. PDF page 3 explicitly defines COP as absorbed heat Q1 divided by work A. Q2 should be False. Its persisted feedback-verification marker therefore certifies incorrect feedback.
2. **An incorrect short answer survived final validation.** Checkpoint Q11 supplies A = 180 kJ and rejected heat Q2 = 720 kJ, asks for refrigerator COP, and answers 4. The correct result is (720 - 180)/180 = 3. Q8 in the same checkpoint correctly uses COP = 3 and Q2 = 720 kJ, exposing an internal contradiction. Short answers bypass the dedicated objective-answer audit; the final language/answer review failed to catch this error.
3. **Hard difficulty is not enforced by acceptance checks.** Accepted items ask for the symbol c, abbreviation COP, the word condensation, and a memorized heat-capacity value. Q3 essentially includes the answer in its own stem. These are recall tasks, not the requested complex reasoning.
4. **PDF extraction silently loses essential visual information.** On page 2, the state-process graphs and the X/Y calibration graph are absent from extracted text. Fractions and subscripts in the gas-law choices are scrambled. The laser diameter 1.2 mm appears as `d =1 2, mm`, encouraging a 12 mm misreading. The refrigerator COP fraction becomes unreadable punctuation. `requireComplete: true` checks page coverage but does not ensure these facts survive. OCR quality checks returned no reasons for any page.
5. **Accepted questions can lack needed givens.** Q12 asks for welding efficiency without specifying the aluminum's starting temperature. Its heat of fusion is also changed from the source's 4 x 10^5 J/kg to 4.10 x 10^5 J/kg, and its 56.4% key does not consistently follow that altered value.
6. **Citation validity is weaker than evidential support.** Accepted Q7 and Q12 cite the first chunk, which does not contain their source problems. The IDs are syntactically allowed, but the cited evidence does not support the questions. Several initial numerical questions were rejected as unverifiable because the necessary law/givens were absent from their selected chunks.
7. **Initial selection sets were unreliable.** Raw generation omitted an actually correct ideal-gas option, selected a rain/cooling explanation unsupported by the source, and returned a selection question with all four options correct. These initial candidates are recorded in `response-2.json`; they should not be treated as accepted final questions.

## Evidence and reproduction

- `checkpoint.json`: the 12 accepted questions, keys, explanations, citations, and feedback verification markers. This is a failed-run checkpoint, not a finished quiz.
- `failure.json`: final generator error and timing.
- `requests.json`: provider timings, usage, status, and finish reason.
- `response-*.json`: complete provider outputs, including initial candidates and audits.
- `source.txt`, `extraction.json`, `context.json`: exact extracted text and supplied source chunks.
- `source-page-1.png` through `source-page-6.png`: locally rendered originals for comparison.
- `../hard-quiz-live-test.log`: complete execution trace.
- `../hard-quiz-local-tests.log`: existing targeted local-test results.

Run from the project root after authorizing transmission to the configured provider:

```powershell
.\node_modules\.bin\dotenv.cmd -e .env -- node --import tsx tmp/hard-quiz-live-test.ts 'C:/Users/Gia Hien/Downloads/Đề thi kscl giữa hk1 lần5 .pdf'
```

This makes real provider calls and can incur normal API usage. Repeated runs overwrite the evidence folder. To reuse the exact saved extraction, append `--reuse-extraction`.

## Recommended fixes before repeating this test

Improve detection/transcription of diagram-dependent and malformed-equation pages; require independent numeric and conceptual answer validation for short answers; verify actual citation support; enforce self-contained givens and a hard-reasoning quality rubric; and track requested type coverage during replacement rounds. Fixes were not made as part of this test-only request.
