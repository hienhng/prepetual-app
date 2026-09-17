import assert from "node:assert/strict";
import { test } from "node:test";
import { paginateQuiz, quizPdfFilename } from "./quiz-pdf-layout";

test("keeps questions together and creates no trailing page on an exact fit", () => {
  assert.deepEqual(paginateQuiz(200, 100, [{ top: 70, bottom: 130 }]), [
    { top: 0, bottom: 70 }, { top: 70, bottom: 170 }, { top: 170, bottom: 200 },
  ]);
  assert.deepEqual(paginateQuiz(200, 100, []), [{ top: 0, bottom: 100 }, { top: 100, bottom: 200 }]);
});

test("backs up across overlapping line/formula bounds without cutting content", () => {
  const blocks = [{ top: 90, bottom: 110 }, { top: 80, bottom: 95 }];
  const pages = paginateQuiz(250, 100, blocks);
  assert.equal(pages[0].bottom, 80);
  assert.equal(pages.at(-1)?.bottom, 250);
  for (const page of pages) for (const block of blocks) {
    assert.ok(!(block.top < page.bottom && block.bottom > page.bottom));
  }
});

test("reports an oversized unsplittable element instead of looping or clipping", () => {
  assert.throws(() => paginateQuiz(250, 100, [{ top: 0, bottom: 200 }]), /too tall/);
});

test("preserves international titles while removing unsafe filename characters", () => {
  assert.equal(quizPdfFilename("  Ôn tập: Vật lý / 2026?  "), "Ôn_tập_Vật_lý_2026.pdf");
  assert.equal(quizPdfFilename("数学"), "数学.pdf");
  assert.equal(quizPdfFilename("???"), "quiz.pdf");
});
