import assert from "node:assert/strict";
import test from "node:test";

import { extractTextFromPDFWithOCR } from "./pdf-extract.js";

function createSinglePagePdf(text: string): Buffer {
  const stream = `BT\n/F1 12 Tf\n72 120 Td\n(${text}) Tj\nET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "binary");
}

test("extracts text from an untrusted PDF with evaluation disabled", async () => {
  const result = await extractTextFromPDFWithOCR(
    createSinglePagePdf("PDF security smoke test"),
    { maxPages: 1, performOcr: false },
  );

  assert.equal(result.pagesProcessed, 1);
  assert.match(result.text, /PDF security smoke test/);
});
