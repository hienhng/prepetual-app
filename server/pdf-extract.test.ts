import assert from "node:assert/strict";
import test from "node:test";
import { jsPDF } from "jspdf";

import { extractTextFromPDFWithOCR } from "./pdf-extract.js";
import { assessPdfText, buildPdfTextBlocks } from "./pdf-layout.js";

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

test("blank separator pages are skipped without requesting transcription or rejecting the document", async () => {
  const pdf = new jsPDF();
  pdf.text("A readable exam page with sufficient selectable text to avoid unnecessary transcription.", 20, 20);
  pdf.addPage();
  const result = await extractTextFromPDFWithOCR(Buffer.from(pdf.output("arraybuffer")), {
    requireComplete: true, transcribePage: async () => { throw new Error("Blank page must not reach provider"); },
  });
  assert.equal(result.pages[1].blank, true);
  assert.equal(result.pagesProcessed, 2);
  assert.equal(result.pagesOcred.length, 0);
});

test("PDF layout preserves columns and coordinates instead of interleaving options", async () => {
  const pdf = new jsPDF();
  for (let row = 0; row < 4; row++) {
    pdf.text(["1. Left question?", "A. Left one", "B. Left two", "C. Left three"][row], 15, 40 + row * 8);
    pdf.text(["2. Right question?", "A. Right one", "B. Right two", "C. Right three"][row], 115, 40 + row * 8);
  }
  const result = await extractTextFromPDFWithOCR(Buffer.from(pdf.output("arraybuffer")), { performOcr: false });
  assert.ok(result.text.indexOf("C. Left three") < result.text.indexOf("2. Right question"));
  assert.equal(result.pages[0].blocks.length, 8);
  assert.ok(result.pages[0].blocks.every(block => block.width > 0 && block.height > 0 && block.source === "selectable"));
});

test("OCR quality checks detect corrupt text and a readable header over a scanned page", () => {
  const blocks = buildPdfTextBlocks([{ str: "Readable running header ".repeat(4), width: 250, height: 12, transform: [1, 0, 0, 1, 20, 750] }], 1, 612);
  assert.ok(assessPdfText(blocks[0].text, true, blocks, 612 * 792).includes("image_with_limited_text"));
  assert.ok(assessPdfText("Bad \uFFFD\uFFFD\uFFFD characters ".repeat(10), false, blocks, 612 * 792).includes("corrupt_text"));
  assert.deepEqual(assessPdfText("Readable document content. ".repeat(10), false, blocks, 612 * 792), []);
});

test("layout keeps raised exponents with their baseline instead of moving them before the question", () => {
  const blocks = buildPdfTextBlocks([
    { str: "20 cm", width: 30, height: 12, transform: [1, 0, 0, 1, 30, 200] },
    { str: "3", width: 4, height: 7, transform: [1, 0, 0, 1, 60, 205] },
    { str: "B. Next option", width: 70, height: 12, transform: [1, 0, 0, 1, 30, 180] },
  ], 1, 612);
  assert.deepEqual(blocks.map(block => block.text), ["20 cm3", "B. Next option"]);
});

test("dense selectable exam pages still transcribe missing graph and equation data", async () => {
  const pdf = new jsPDF();
  pdf.text("Question 9: The graph below shows an ideal gas. Select the correct process. ".repeat(2), 20, 20);
  pdf.rect(30, 50, 80, 40, "S");
  let calls = 0;
  const result = await extractTextFromPDFWithOCR(Buffer.from(pdf.output("arraybuffer")), { requireComplete: true,
    transcribePage: async () => { calls++; return "Question 9: Graph axes V and T; state 1 and state 2 lie on a line through the origin."; } });
  assert.equal(calls, 1);
  assert.ok(result.pages[0].ocrReasons.includes("visual_stimulus"));
  assert.match(result.text, /axes V and T/);
  const text = "Câu 14. d =1 2, mm. " + "Dense readable material. ".repeat(20);
  assert.ok(assessPdfText(text, false, [], 600_000).includes("fragmented_equations"));
});

test("question generation receives a visually reviewed transcript instead of conflicting OCR givens", async () => {
  const pdf = new jsPDF();
  pdf.text("Question 1: The graph below gives a heater energy of 720 J. Find the useful energy.", 20, 20);
  let reviews = 0;
  const result = await extractTextFromPDFWithOCR(Buffer.from(pdf.output("arraybuffer")), { requireComplete: true,
    transcribePage: async () => "Question 1: The graph supplies 7200 J.",
    verifyTranscription: async (image, selectable, initial) => {
      reviews++;
      assert.match(image, /^data:image\/png;base64,/);
      assert.match(selectable, /720 J/);
      assert.match(initial, /7200 J/);
      return "Question 1: The heater supplies 720 J. Graph efficiency is [unresolved: axis label].";
    } });
  assert.equal(reviews, 1);
  assert.match(result.text, /720 J/);
  assert.doesNotMatch(result.text, /7200 J/);
  assert.match(result.text, /\[unresolved:/);
});
