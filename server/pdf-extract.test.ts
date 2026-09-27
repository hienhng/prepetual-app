import assert from "node:assert/strict";
import test from "node:test";
import { jsPDF } from "jspdf";

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

test("reads every page past the former 10-page limit and retains question line breaks", async () => {
  const pdf = new jsPDF();
  for (let page = 1; page <= 12; page++) {
    if (page > 1) pdf.addPage();
    pdf.text([`${page}. Original question on page ${page}?`, "A. First option", "B. Second option", "C. Third option", "D. Fourth option"], 20, 20);
  }
  const buffer = Buffer.from(pdf.output("arraybuffer"));
  const result = await extractTextFromPDFWithOCR(buffer, { performOcr: false, requireComplete: true });
  assert.equal(result.pagesProcessed, 12);
  assert.equal(result.totalPages, 12);
  assert.match(result.text, /12\. Original question on page 12/);
  assert.match(result.text, /\?\s*\n\s*A\. First option/);
  await assert.rejects(extractTextFromPDFWithOCR(buffer, { maxPages: 10, requireComplete: true }), /12 pages/);
});

test("transcribes every sparse page, including sparse pages mixed with selectable text", async () => {
  const pdf = new jsPDF();
  pdf.text("A selectable exam page with enough text to avoid OCR. Question 1 has four possible answers.", 20, 20);
  pdf.addPage();
  pdf.text("Scanned page", 20, 20);
  let calls = 0;
  const result = await extractTextFromPDFWithOCR(Buffer.from(pdf.output("arraybuffer")), {
    requireComplete: true,
    transcribePage: async (image) => { calls++; assert.match(image, /^data:image\/png;base64,/); return "2. Recovered original question\nA. First option\nB. Second option"; },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result.pagesOcred, [2]);
  assert.match(result.text, /2\. Recovered original question/);
});

test("reports unreadable pages instead of silently importing the remaining pages", async () => {
  await assert.rejects(extractTextFromPDFWithOCR(createSinglePagePdf("Unreadable page"), {
    requireComplete: true,
    transcribePage: async () => { throw new Error("Provider failed"); },
  }), /Could not read PDF page 1/);
});
