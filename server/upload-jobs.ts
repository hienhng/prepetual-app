import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { parseOffice } from "officeparser";
import JSZip from "jszip";
import { analyzeImageContent } from "./openai";

export interface UploadJob {
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  message: string;
  text?: string;
  error?: string;
  fileType: string;
  createdAt: Date;
  isOfficeWithImages?: boolean;
  documentImages?: string[];
  hasIllustrations?: boolean;
  imageDescription?: string;
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
    const text = typeof result === 'string' ? result : (result.toText ? result.toText() : String(result));
    console.log("Office parser text length:", text.length);
    console.log("Office parser text preview:", text.substring(0, 200));
    return text.trim();
  } catch (error) {
    console.error("Office parser error:", error);
    throw new Error("Failed to parse Office document: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

async function extractImagesFromOfficeDocument(buffer: Buffer): Promise<string[]> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const images: string[] = [];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.emf', '.wmf'];
    const maxImages = 10;
    const maxImageSizeKB = 500;
    
    const mediaFolders = [
      'word/media/',
      'ppt/media/',
      'xl/media/',
      'docProps/thumbnail',
    ];
    
    const imageFiles: { path: string; size: number }[] = [];
    
    zip.forEach((relativePath, file) => {
      if (file.dir) return;
      
      const isInMediaFolder = mediaFolders.some(folder => relativePath.toLowerCase().includes(folder.toLowerCase()));
      const hasImageExtension = imageExtensions.some(ext => relativePath.toLowerCase().endsWith(ext));
      
      if (isInMediaFolder || hasImageExtension) {
        imageFiles.push({ path: relativePath, size: 0 });
      }
    });
    
    const sortedFiles = imageFiles.slice(0, maxImages * 2);
    
    for (const fileInfo of sortedFiles) {
      if (images.length >= maxImages) break;
      
      try {
        const file = zip.file(fileInfo.path);
        if (!file) continue;
        
        const data = await file.async('base64');
        const sizeKB = (data.length * 0.75) / 1024;
        
        if (sizeKB > maxImageSizeKB) {
          console.log(`Skipping large image: ${fileInfo.path} (${sizeKB.toFixed(1)}KB)`);
          continue;
        }
        
        const ext = fileInfo.path.toLowerCase().split('.').pop() || 'png';
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                         ext === 'png' ? 'image/png' : 
                         ext === 'gif' ? 'image/gif' : 'image/png';
        
        const dataUrl = `data:${mimeType};base64,${data}`;
        images.push(dataUrl);
        console.log(`Extracted image: ${fileInfo.path} (${sizeKB.toFixed(1)}KB)`);
      } catch (err) {
        console.warn(`Failed to extract image ${fileInfo.path}:`, err);
      }
    }
    
    console.log(`Total images extracted: ${images.length}`);
    return images;
  } catch (error) {
    console.error("Error extracting images from Office document:", error);
    return [];
  }
}

function isOfficeDocument(fileType: string): boolean {
  return (
    fileType.includes("wordprocessingml") ||
    fileType.includes("presentationml") ||
    fileType.includes("spreadsheetml") ||
    fileType === "application/msword" ||
    fileType === "application/vnd.ms-powerpoint" ||
    fileType === "application/vnd.ms-excel"
  );
}

export async function processJob(id: string) {
  const job = jobs.get(id);
  const buffer = jobBuffers.get(id);
  
  if (!job || !buffer) {
    return;
  }
  
  try {
    updateJob(id, { status: "processing", progress: 10, message: "Starting document analysis..." });
    
    let extractedText = "";
    let documentImages: string[] = [];
    let isOfficeWithImages = false;
    const fileType = job.fileType;
    
    if (fileType === "application/pdf") {
      updateJob(id, { progress: 20, message: "Extracting text from PDF..." });
      extractedText = await extractTextFromPDF(buffer);
    } else if (fileType.startsWith("image/")) {
      updateJob(id, { progress: 15, message: "Running OCR on image..." });
      extractedText = await extractTextFromImage(buffer);
      
      // Convert buffer to base64 for vision analysis
      updateJob(id, { progress: 40, message: "Analyzing image for illustrations..." });
      const base64 = buffer.toString("base64");
      const mimeType = fileType;
      const imageDataUrl = `data:${mimeType};base64,${base64}`;
      
      try {
        const analysis = await analyzeImageContent(imageDataUrl);
        
        if (analysis.hasIllustrations || analysis.description) {
          // Combine OCR text with visual analysis
          let combinedText = extractedText;
          
          if (analysis.description) {
            combinedText = `[IMAGE DESCRIPTION: ${analysis.description}]\n\n${extractedText}`;
          }
          
          if (analysis.visualElements.length > 0) {
            combinedText += `\n\n[VISUAL ELEMENTS: ${analysis.visualElements.join(", ")}]`;
          }
          
          extractedText = combinedText;
          documentImages = [imageDataUrl];
          isOfficeWithImages = true;
          
          console.log(`Image has illustrations: ${analysis.visualElements.join(", ")}`);
        }
      } catch (err) {
        console.warn("Vision analysis failed, using OCR only:", err);
      }
    } else if (isOfficeDocument(fileType)) {
      updateJob(id, { progress: 15, message: "Extracting text from document..." });
      extractedText = await extractTextFromOfficeDocument(buffer);
      
      updateJob(id, { progress: 40, message: "Scanning for images and graphics..." });
      documentImages = await extractImagesFromOfficeDocument(buffer);
      
      if (documentImages.length > 0) {
        isOfficeWithImages = true;
        console.log(`Office document has ${documentImages.length} images - will use vision processing`);
      }
    }
    
    updateJob(id, { progress: 80, message: "Finalizing..." });
    
    if (isOfficeWithImages) {
      updateJob(id, {
        status: "completed",
        progress: 100,
        message: documentImages.length > 0 ? "Content with visuals ready!" : "Document ready for visual analysis!",
        text: extractedText,
        isOfficeWithImages: true,
        documentImages: documentImages,
      });
    } else {
      // For pure text extraction, require minimum text length
      // But if we have visual content, we can proceed with less text
      if (!extractedText || extractedText.length < 50) {
        throw new Error("Not enough text could be extracted from this document. Please try a different file with more readable content.");
      }
      
      updateJob(id, {
        status: "completed",
        progress: 100,
        message: "Extraction complete!",
        text: extractedText,
        isOfficeWithImages: false,
      });
    }
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
