import { createWorker } from "tesseract.js";

let tesseractWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

export interface OcrOptions {
  languages?: string;
  cachePath?: string;
}

export async function getOCRWorker(options: OcrOptions = {}) {
  if (!tesseractWorker) {
    const languages = options.languages ?? "eng+vie";
    tesseractWorker = await createWorker(languages, 1, {
      cachePath: options.cachePath ?? "/tmp",
    });
  }
  return tesseractWorker;
}

export async function ocrImageBuffer(buffer: Buffer, options: OcrOptions = {}): Promise<string> {
  try {
    const worker = await getOCRWorker(options);
    const { data: { text } } = await worker.recognize(buffer);
    return (text ?? "").trim();
  } catch (error) {
    if (tesseractWorker) {
      try { await tesseractWorker.terminate(); } catch {}
      tesseractWorker = null;
    }
    throw error;
  }
}

export async function terminateOCRWorker() {
  if (!tesseractWorker) return;
  try { await tesseractWorker.terminate(); } catch {}
  tesseractWorker = null;
}

