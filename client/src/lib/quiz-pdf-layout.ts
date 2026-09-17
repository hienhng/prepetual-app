export interface PdfBlock {
  top: number;
  bottom: number;
}

/** Choose whitespace boundaries, keeping questions (or lines in long questions) intact. */
export function paginateQuiz(height: number, pageHeight: number, blocks: PdfBlock[]): PdfBlock[] {
  const pages: PdfBlock[] = [];
  let top = 0;
  while (top < height) {
    let bottom = Math.min(top + pageHeight, height);
    if (bottom < height) {
      let previous: number;
      do {
        previous = bottom;
        for (const block of blocks) {
          if (block.top < bottom && block.bottom > bottom) bottom = Math.min(bottom, block.top);
        }
      } while (bottom < previous);
    }
    if (bottom <= top) throw new Error("A quiz element is too tall to fit on a PDF page.");
    pages.push({ top, bottom });
    top = bottom;
  }
  return pages;
}

export function quizPdfFilename(title: string): string {
  const name = title.normalize("NFC").trim()
    .replace(/[^\p{L}\p{N}\p{M}_-]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return `${name || "quiz"}.pdf`;
}
