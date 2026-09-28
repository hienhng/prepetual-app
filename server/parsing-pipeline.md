# Import parsing

The importer preserves multiple choice, selection, single-statement true/false,
and short/free-response questions. A common stem followed by individual truth
statements is one `selection` question. `selectionMode: "truth_statements"`
allows any number of true statements, including none. Answers remain JSON arrays
of exact option strings, so shuffling options does not change correctness.
Ordinary generated selection questions still require at least two correct options.

## Stages

1. PDF extraction groups text fragments using coordinates and reads detected
   columns within heading bands. Its result retains per-page selectable blocks,
   coordinates, OCR reasons, and transcription. OCR considers sparse text,
   corrupt text, and image-backed pages with limited selectable text. Visually
   empty pages are skipped without calling the transcription model. Unreadable
   nonblank pages still fail explicitly instead of silently returning a partial PDF.
2. Recognizable question numbering supplies a fast inventory. Repeated option
   runs or unnumbered choices before the first heading trigger model inventory.
   Model inventory uses absolute source line ranges, retries with more context,
   and splits difficult assignments. Unexplained source ranges become review
   items; a model's `complete:true` alone is insufficient to discard those ranges.
3. Classify response formats before extracting options. Unknown types are kept
   as raw, unscored review items. Explicit binary truth options and complete local
   statement truth keys provide additional checks on the model's classification.
4. Copy clear option layouts directly. For ambiguous layouts, the model references
   numbered source blocks and code copies their original text. Block references
   must cover every nonempty block without reuse or reordering. Inline layouts
   can use the previous exact-quote fallback. Omitted supporting material or
   unexplained trailing content requires structure review.
5. Separate local answers from learner-facing stems/options. Audit answers using
   type-specific fields: one option index, a complete index set, a truth value,
   or a written answer. A recognized statement key must agree with the audited
   set. Retry unresolved items individually and preserve remaining problems.
6. Save review stages (`inventory`, `classification`, `structure`, `answer`). The
   editor can save unfinished reviews and confirm complete selection answer sets.
   Scoring and publishing remain blocked until review is completed.

## Regression coverage

`fixtures/import-mixed-exam.txt` contains the supplied Vietnamese rectangular-block
example alongside the other question types. `import-source.test.ts`,
`quiz-import.test.ts`, `quiz-import-provider.test.ts`, `pdf-extract.test.ts`, and
`shared/selection-answer.test.ts` cover source fidelity, missing/duplicate ranges,
provider failures, math typography, question order, answer conflicts, all-false
sets, review confirmation, two-column PDFs, and blank pages. Model responses are
mocked; these tests verify pipeline behavior, not live model accuracy.

## Current boundaries

The upload API still passes text and its existing image array. PDF coordinates
are used during extraction but are not yet persisted as a cross-format document
model in the browser/database. Per-question diagram crops, persistent visual
provenance, and an evaluation corpus of real scanned exams remain follow-up work.
The column detector handles common two-column text, not arbitrary magazine/table
layouts. Model boundary/classification mistakes remain possible; review items are
the recovery path rather than a promise of automatic correctness.
