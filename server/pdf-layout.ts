export interface PdfTextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  source: "selectable" | "transcription";
}

/** Group spatially adjacent fragments, then read columns within full-width
 * heading bands. Retain coordinates so layout decisions can be inspected. */
export function buildPdfTextBlocks(items: any[], pageNumber: number, pageWidth: number): PdfTextBlock[] {
  const fragments = items.filter(item => typeof item?.str === "string" && item.str.trim()).map(item => ({
    text: item.str as string, x: Number(item.transform?.[4]) || 0, y: Number(item.transform?.[5]) || 0,
    width: Math.abs(Number(item.width) || 0), height: Math.abs(Number(item.height) || 12),
  })).sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: typeof fragments[] = [];
  for (const fragment of fragments) {
    const row = rows.find(row => row.some(part => {
      const delta = Math.abs(part.y - fragment.y);
      if (delta <= Math.min(part.height, fragment.height) * 0.35) return true;
      const large = Math.max(part.height, fragment.height), small = Math.min(part.height, fragment.height);
      const horizontalGap = Math.max(part.x, fragment.x) - Math.min(part.x + part.width, fragment.x + fragment.width);
      return small < large * 0.85 && delta < large * 0.8 && horizontalGap < large;
    }));
    if (row) row.push(fragment); else rows.push([fragment]);
  }
  const blocks: PdfTextBlock[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    let block: PdfTextBlock | undefined;
    for (const part of row) {
      if (!block || part.x - (block.x + block.width) > Math.max(18, part.height * 2.5)) {
        block = { ...part, id: `p${pageNumber}-b${blocks.length + 1}`, source: "selectable" };
        blocks.push(block);
      } else {
        const gap = part.x - (block.x + block.width);
        block.text += `${gap > part.height * 0.15 ? " " : ""}${part.text}`;
        block.width = Math.max(block.width, part.x + part.width - block.x);
        block.height = Math.max(block.height, part.height);
      }
    }
  }
  // Infer a gutter from aligned starts in the right half, rather than assuming
  // every page uses columns. A few isolated right-side labels are insufficient.
  const candidates = blocks.map(block => block.x).filter(x => x > pageWidth * 0.4 && x < pageWidth * 0.7);
  const rightStart = candidates.find(x => candidates.filter(other => Math.abs(other - x) < 12).length >= 3);
  if (rightStart === undefined) return blocks;
  const gutter = rightStart - 12;
  if (blocks.filter(block => block.x + block.width < gutter).length < 3) return blocks;
  const ordered: PdfTextBlock[] = [];
  let band: PdfTextBlock[] = [];
  const flush = () => {
    ordered.push(...band.filter(block => block.x < gutter), ...band.filter(block => block.x >= gutter));
    band = [];
  };
  for (const block of blocks) {
    if (block.x < gutter && block.x + block.width > rightStart) { flush(); ordered.push(block); }
    else band.push(block);
  }
  flush();
  return ordered;
}

export function assessPdfText(text: string, hasImages: boolean, blocks: PdfTextBlock[], pageArea: number, sparseThreshold = 60) {
  const compact = text.replace(/\s/g, "");
  const corrupt = (compact.match(/[\uFFFD\u0000-\u0008\u000E-\u001F]/gu) || []).length;
  const textArea = blocks.reduce((sum, block) => sum + block.width * block.height, 0);
  const reasons: string[] = [];
  if (compact.length < sparseThreshold) reasons.push("sparse_text");
  if (corrupt >= 2 && corrupt / Math.max(1, compact.length) > 0.02) reasons.push("corrupt_text");
  // Image-backed pages can have a perfectly readable running header above a scan.
  if (hasImages && (textArea / Math.max(1, pageArea) < 0.035 || blocks.length < 5)) reasons.push("image_with_limited_text");
  return reasons;
}
