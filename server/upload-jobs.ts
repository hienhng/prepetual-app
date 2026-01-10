import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { parseOffice } from "officeparser";

export interface UploadJob {
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  message: string;
  text?: string;
  error?: string;
  fileType: string;
  createdAt: Date;
}

const jobs = new Map<string, UploadJob>();
const jobBuffers = new Map<string, Buffer>();

let tesseractWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function getOCRWorker() {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker("eng+vie");
  }
  return tesseractWorker;
}

export function createJob(id: string, fileType: string): UploadJob {
  const job: UploadJob = {
    id,
    status: "pending",
    progress: 0,
    message: "Queued for processing...",
    fileType,
    createdAt: new Date(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): UploadJob | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<UploadJob>) {
  const job = jobs.get(id);
  if (job) {
    Object.assign(job, updates);
  }
}

export function storeBuffer(id: string, buffer: Buffer) {
  jobBuffers.set(id, buffer);
}

export function cleanupBuffer(id: string) {
  jobBuffers.delete(id);
}

export function deleteJob(id: string) {
  jobs.delete(id);
  jobBuffers.delete(id);
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    let lastY: number | null = null;
    const pageTextParts: string[] = [];
    
    for (const item of content.items as any[]) {
      if (item.str) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageTextParts.push("\n");
        } else if (pageTextParts.length > 0 && !pageTextParts[pageTextParts.length - 1].endsWith(" ")) {
          pageTextParts.push(" ");
        }
        pageTextParts.push(item.str);
        lastY = item.transform[5];
      }
    }
    
    fullText += pageTextParts.join("") + "\n\n";
  }
  
  return fullText
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const worker = await getOCRWorker();
  const { data: { text } } = await worker.recognize(buffer);
  return text.trim();
}

async function extractTextFromOfficeDocument(buffer: Buffer): Promise<string> {
  try {
    const result = await parseOffice(buffer);
    const text = typeof result === 'string' ? result : String(result);
    console.log("Office parser result type:", typeof result);
    console.log("Office parser text length:", text.length);
    console.log("Office parser text preview:", text.substring(0, 200));
    return text.trim();
  } catch (error) {
    console.error("Office parser error:", error);
    throw new Error("Failed to parse Office document: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

export async function processJob(id: string) {
  const job = jobs.get(id);
  const buffer = jobBuffers.get(id);
  
  if (!job || !buffer) {
    return;
  }
  
  try {
    updateJob(id, { status: "processing", progress: 10, message: "Starting text extraction..." });
    
    let extractedText = "";
    const fileType = job.fileType;
    
    if (fileType === "application/pdf") {
      updateJob(id, { progress: 20, message: "Extracting text from PDF..." });
      extractedText = await extractTextFromPDF(buffer);
    } else if (fileType.startsWith("image/")) {
      updateJob(id, { progress: 20, message: "Running OCR on image..." });
      extractedText = await extractTextFromImage(buffer);
    } else if (
      fileType.includes("wordprocessingml") ||
      fileType.includes("presentationml") ||
      fileType.includes("spreadsheetml") ||
      fileType === "application/msword" ||
      fileType === "application/vnd.ms-powerpoint" ||
      fileType === "application/vnd.ms-excel"
    ) {
      updateJob(id, { progress: 20, message: "Extracting text from document..." });
      extractedText = await extractTextFromOfficeDocument(buffer);
    }
    
    updateJob(id, { progress: 80, message: "Finalizing..." });
    
    if (!extractedText || extractedText.length < 50) {
      throw new Error("Not enough text could be extracted from this document. Please try a different file with more readable content.");
    }
    
    updateJob(id, {
      status: "completed",
      progress: 100,
      message: "Extraction complete!",
      text: extractedText,
    });
    cleanupBuffer(id);
  } catch (error) {
    console.error("Job processing error:", error);
    updateJob(id, {
      status: "error",
      progress: 0,
      message: "Extraction failed",
      error: error instanceof Error ? error.message : "Failed to extract text",
    });
    cleanupBuffer(id);
  }
}
