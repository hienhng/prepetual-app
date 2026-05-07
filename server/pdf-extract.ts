import path from "path";
import { createRequire } from "module";

import { ocrImageBuffer } from "./ocr.js";

export interface PdfExtractOptions {
  sparseTextThresholdChars?: number;
  maxPages?: number;
  renderScale?: number;
  maxRenderPixels?: number;
}

export interface PdfExtractResult {
  text: string;
  pagesProcessed: number;
  pagesOcred: number[];
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
  return await import("pdfjs-dist/legacy/build/pdf.mjs");
}

async function loadCanvas() {
  return await import("@napi-rs/canvas");
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractSelectableTextFromPage(page: any): Promise<string> {
  const textContent = await page.getTextContent();
  const parts: string[] = [];
  for (const item of textContent.items ?? []) {
    const str = (item?.str ?? "").toString();
    if (str) parts.push(str);
  }
  return normalizeText(parts.join(" "));
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
  const maxPages = opts.maxPages ?? 10;
  const renderScale = opts.renderScale ?? 1.4;
  const maxRenderPixels = opts.maxRenderPixels ?? 2_500_000;

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    disableWorker: true,
    // In Node/serverless, font loading via URL can be flaky (especially on Windows).
    // We disable font-face embedding and rely on PDF.js built-in fallbacks.
    disableFontFace: true,
    useSystemFonts: true,
  } as any);

  const doc = await loadingTask.promise;
  const pagesToProcess = Math.min(doc.numPages || 0, maxPages);

  const pageTexts: string[] = [];
  const pagesOcred: number[] = [];

  for (let pageNumber = 1; pageNumber <= pagesToProcess; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const selectableText = await extractSelectableTextFromPage(page);

    let pageText = selectableText;
    if (selectableText.length < sparseTextThresholdChars) {
      try {
        const imageBuffer = await renderPdfPageToImageBuffer(page, {
          renderScale,
          maxRenderPixels,
          format: "png",
          jpegQuality: 80,
        });

        const ocrText = normalizeText(await ocrImageBuffer(imageBuffer, { languages: "eng+vie" }));
        if (ocrText) {
          pagesOcred.push(pageNumber);
          pageText = selectableText ? normalizeText(`${selectableText}\n\n${ocrText}`) : ocrText;
        }
      } catch (error) {
        // Rendering/OCR is best-effort; keep selectable text (if any) and continue.
        // The async upload path may still provide a "visual analysis" fallback if total text is sparse.
        pageText = selectableText;
      }
    }

    if (pageText) {
      pageTexts.push(`(Page ${pageNumber})\n${pageText}`);
    }

    try { page.cleanup?.(); } catch {}
  }

  try { await doc.cleanup?.(); } catch {}
  try { await doc.destroy?.(); } catch {}

  return { text: normalizeText(pageTexts.join("\n\n")), pagesProcessed: pagesToProcess, pagesOcred };
}

export async function renderPdfPagesAsDataUrls(buffer: Buffer, opts: PdfRenderOptions = {}): Promise<string[]> {
  const maxPages = opts.maxPages ?? 3;
  const renderScale = opts.renderScale ?? 1.2;
  const maxRenderPixels = opts.maxRenderPixels ?? 2_000_000;
  const format = opts.format ?? "jpeg";
  const jpegQuality = opts.jpegQuality ?? 70;

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    disableWorker: true,
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
  try { await doc.destroy?.(); } catch {}

  return urls;
}
