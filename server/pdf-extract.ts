import path from "path";
import { createRequire } from "module";

import { ocrImageBuffer } from "./ocr.js";
import { assessPdfText, buildPdfTextBlocks, type PdfTextBlock } from "./pdf-layout.js";

export interface PdfExtractOptions {
  sparseTextThresholdChars?: number;
  maxPages?: number;
  renderScale?: number;
  maxRenderPixels?: number;
  performOcr?: boolean;
  requireComplete?: boolean;
  transcribePage?: (imageUrl: string) => Promise<string>;
  verifyTranscription?: (imageUrl: string, selectableText: string, transcription: string) => Promise<string>;
  onProgress?: (completedPages: number, totalPages: number) => void;
}

export interface PdfExtractResult {
  text: string;
  pagesProcessed: number;
  pagesOcred: number[];
  totalPages: number;
  pages: Array<{ pageNumber: number; blocks: PdfTextBlock[]; transcription?: string; ocrReasons: string[]; blank: boolean }>;
}

export interface PdfRenderOptions {
  maxPages?: number;
  renderScale?: number;
  maxRenderPixels?: number;
  format?: "png" | "jpeg";
  jpegQuality?: number;
}

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

async function loadPdfJs(): Promise<PdfJsModule> {
  // PDF.js and the rendering context must use the same native Path2D class.
  // Initialize it here too, since extraction can run outside server/index.ts.
  const canvas = await loadCanvas();
  for (const name of ["Path2D", "DOMMatrix", "ImageData"] as const) {
    if (canvas[name]) Object.defineProperty(globalThis, name, { value: canvas[name], configurable: true, writable: true });
  }
  return await import("pdfjs-dist/legacy/build/pdf.mjs");
}

async function loadCanvas() {
  // PDF.js creates internal image canvases with its own dependency. Mixing its
  // 1.x native canvas objects with the app's 0.x context can crash the process.
  const require = createRequire(import.meta.url);
  const pdfRequire = createRequire(require.resolve("pdfjs-dist/package.json"));
  return pdfRequire("@napi-rs/canvas") as typeof import("@napi-rs/canvas");
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractSelectableTextFromPage(page: any, pageNumber: number) {
  const textContent = await page.getTextContent();
  const blocks = buildPdfTextBlocks(textContent.items ?? [], pageNumber, page.getViewport({ scale: 1 }).width);
  return { text: normalizeText(blocks.map(block => block.text).join("\n")), blocks };
}

async function isBlankRenderedPage(buffer: Buffer): Promise<boolean> {
  const { createCanvas, loadImage } = await loadCanvas();
  const image = await loadImage(buffer);
  const canvas = createCanvas(160, 160);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white"; ctx.fillRect(0, 0, 160, 160);
  ctx.drawImage(image, 0, 0, 160, 160);
  const pixels = ctx.getImageData(0, 0, 160, 160).data;
  // Require visually empty output; a page containing a diagram is not blank.
  for (let i = 0; i < pixels.length; i += 4) {
    if (Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 245) return false;
  }
  return true;
}

function resolveStandardFontDataUrl(): string {
  // Use require.resolve to be resilient to different install layouts.
  const require = createRequire(import.meta.url);
  const pdfjsPkgJson = require.resolve("pdfjs-dist/package.json");
  const pdfjsRoot = path.dirname(pdfjsPkgJson);
  const fontsPath = path.join(pdfjsRoot, "standard_fonts");
  // pdf.js accepts a string base URL. In Node, a plain filesystem path is
  // the most compatible across environments (Windows + serverless).
  return fontsPath + path.sep;
}

function clampRenderScale(viewport: { width: number; height: number }, requestedScale: number, maxPixels: number) {
  const basePixels = viewport.width * viewport.height;
  if (basePixels <= 0) return requestedScale;
  const requestedPixels = basePixels * requestedScale * requestedScale;
  if (requestedPixels <= maxPixels) return requestedScale;
  const scale = Math.sqrt(maxPixels / basePixels);
  return Math.max(0.5, Math.min(requestedScale, scale));
}

async function renderPdfPageToImageBuffer(
  page: any,
  options: Required<Pick<PdfRenderOptions, "renderScale" | "maxRenderPixels" | "format" | "jpegQuality">>
): Promise<Buffer> {
  const canvasMod: any = await loadCanvas();
  const { createCanvas } = canvasMod;

  const baseViewport = page.getViewport({ scale: 1.0 });
  const scale = clampRenderScale(baseViewport, options.renderScale, options.maxRenderPixels);
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");

  await page.render({ canvasContext: ctx, viewport, intent: "display" }).promise;

  if (options.format === "jpeg") {
    return await canvas.encode("jpeg", options.jpegQuality);
  }
  return await canvas.encode("png");
}

export async function extractTextFromPDFWithOCR(buffer: Buffer, opts: PdfExtractOptions = {}): Promise<PdfExtractResult> {
  const sparseTextThresholdChars = opts.sparseTextThresholdChars ?? 60;
  const maxPages = opts.maxPages ?? 100;
  const renderScale = opts.renderScale ?? 1.4;
  const maxRenderPixels = opts.maxRenderPixels ?? 2_500_000;
  const performOcr = opts.performOcr ?? true;

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    // PDF.js can transfer/detach its input; retain the caller's upload buffer.
    data: Uint8Array.from(buffer),
    disableWorker: true,
    isEvalSupported: false,
    // In Node/serverless, font loading via URL can be flaky (especially on Windows).
    // We disable font-face embedding and rely on PDF.js built-in fallbacks.
    disableFontFace: true,
    useSystemFonts: true,
  } as any);

  const doc = await loadingTask.promise;
  if (opts.requireComplete && doc.numPages > maxPages) {
    await loadingTask.destroy();
    throw new Error(`This PDF has ${doc.numPages} pages. Please split it into files of at most ${maxPages} pages; no pages were silently omitted.`);
  }
  const pagesToProcess = Math.min(doc.numPages || 0, maxPages);
  opts.onProgress?.(0, pagesToProcess);

  const pageTexts: string[] = [];
  const pagesOcred: number[] = [];
  const pages: PdfExtractResult["pages"] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pagesToProcess; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const { text: selectableText, blocks } = await extractSelectableTextFromPage(page, pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const operators = performOcr ? await page.getOperatorList() : { fnArray: [] };
      const imageOps = [pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject, pdfjs.OPS.paintImageMaskXObject, pdfjs.OPS.paintImageXObjectRepeat];
      const reasons = assessPdfText(selectableText, operators.fnArray.some((op: number) => imageOps.includes(op)), blocks, viewport.width * viewport.height, sparseTextThresholdChars);
      const pageResult: PdfExtractResult["pages"][number] = { pageNumber, blocks, ocrReasons: reasons, blank: false };
      pages.push(pageResult);

      let pageText = selectableText;
      if (performOcr && reasons.length) {
        try {
          const imageBuffer = await renderPdfPageToImageBuffer(page, {
            renderScale,
            maxRenderPixels,
            format: "png",
            jpegQuality: 80,
          });

          pageResult.blank = !selectableText.trim() && await isBlankRenderedPage(imageBuffer);
          let ocrText = pageResult.blank ? "" : normalizeText(opts.transcribePage
            ? await opts.transcribePage(`data:image/png;base64,${imageBuffer.toString("base64")}`)
            : await ocrImageBuffer(imageBuffer, { languages: "eng+vie" }));
          if (ocrText && opts.verifyTranscription) {
            ocrText = normalizeText(await opts.verifyTranscription(`data:image/png;base64,${imageBuffer.toString("base64")}`, selectableText, ocrText));
          }
          if (ocrText) {
            pageResult.transcription = ocrText;
            pagesOcred.push(pageNumber);
            // Full-page transcription already includes headers/selectable text.
            pageText = ocrText;
          } else if (opts.requireComplete && !pageResult.blank) {
            throw new Error("No readable text returned");
          }
        } catch (error) {
          if (opts.requireComplete) {
            try { page.cleanup?.(); } catch {}
            throw new Error(`Could not read PDF page ${pageNumber}. Please provide a readable copy or remove it if it is blank; no partial document was imported.`);
          }
          // Rendering/OCR is best-effort; keep selectable text (if any) and continue.
          pageText = selectableText;
        }
      }

      if (pageText) {
        pageTexts.push(`(Page ${pageNumber})\n${pageText}`);
      }

      try { page.cleanup?.(); } catch {}
      opts.onProgress?.(pageNumber, pagesToProcess);
    }
  } finally {
    try { await doc.cleanup?.(); } catch {}
    try { await loadingTask.destroy(); } catch {}
  }

  return { text: normalizeText(pageTexts.join("\n\n")), pagesProcessed: pagesToProcess, pagesOcred, totalPages: doc.numPages, pages };
}

export async function renderPdfPagesAsDataUrls(buffer: Buffer, opts: PdfRenderOptions = {}): Promise<string[]> {
  const maxPages = opts.maxPages ?? 3;
  const renderScale = opts.renderScale ?? 1.2;
  const maxRenderPixels = opts.maxRenderPixels ?? 2_000_000;
  const format = opts.format ?? "jpeg";
  const jpegQuality = opts.jpegQuality ?? 70;

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: Uint8Array.from(buffer),
    disableWorker: true,
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: true,
  } as any);

  const doc = await loadingTask.promise;
  const pagesToRender = Math.min(doc.numPages || 0, maxPages);

  const urls: string[] = [];
  for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const imageBuffer = await renderPdfPageToImageBuffer(page, {
      renderScale,
      maxRenderPixels,
      format,
      jpegQuality,
    });
    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    urls.push(`data:${mime};base64,${imageBuffer.toString("base64")}`);
    try { page.cleanup?.(); } catch {}
  }

  try { await doc.cleanup?.(); } catch {}
  try { await loadingTask.destroy(); } catch {}

  return urls;
}
