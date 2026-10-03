import JSZip from "jszip";
import { extractTextFromOfficeDocument } from "./office-extract.js";
import { extractTextFromPDFWithOCR } from "./pdf-extract.js";
import { transcribeExamImage, verifyExamPageTranscription } from "./openai.js";

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
  isImageOnly?: boolean;
}

const jobs = new Map<string, UploadJob>();
const jobBuffers = new Map<string, Buffer>();

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

// officeparser does not expose per-page or per-section progress. Advance through
// its known extraction phase while it works, then let the next real phase update
// take over. This keeps long Office parses from appearing frozen at 15%.
function startExtractionProgressTicker(id: string, message: string, start: number, end: number) {
  let progress = start;
  const timer = setInterval(() => {
    progress = Math.min(end, progress + 1);
    updateJob(id, { progress, message });
  }, 1000);
  return () => clearInterval(timer);
}

async function extractImagesFromOfficeDocument(buffer: Buffer): Promise<string[]> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const images: string[] = [];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.emf', '.wmf'];
    const maxImages = 5;
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
    let isImageFile = false;
    const fileType = job.fileType;
    
    if (fileType === "application/pdf") {
      updateJob(id, { progress: 20, message: "Extracting text from PDF..." });
      const result = await extractTextFromPDFWithOCR(buffer, {
        sparseTextThresholdChars: 60,
        maxPages: 100,
        renderScale: 1.4,
        maxRenderPixels: 2_500_000,
        performOcr: true,
        requireComplete: true,
        transcribePage: transcribeExamImage,
        verifyTranscription: verifyExamPageTranscription,
        onProgress: (completedPages, totalPages) => {
          const progress = totalPages > 0
            ? 20 + Math.round((completedPages / totalPages) * 55)
            : 75;
          updateJob(id, { progress, message: `Extracting text from PDF (page ${completedPages} of ${totalPages})...` });
        },
      });
      extractedText = result.text;
    } else if (fileType.startsWith("image/")) {
      isImageFile = true;
      updateJob(id, { progress: 45, message: "Preparing image for quiz generation..." });
    } else if (isOfficeDocument(fileType)) {
      const message = "Extracting text from document...";
      updateJob(id, { progress: 15, message });
      const stopProgressTicker = startExtractionProgressTicker(id, message, 15, 39);
      try {
        extractedText = await extractTextFromOfficeDocument(buffer);
      } finally {
        stopProgressTicker();
      }
      
      updateJob(id, { progress: 40, message: "Scanning for images and graphics..." });
      documentImages = await extractImagesFromOfficeDocument(buffer);
      
      if (documentImages.length > 0) {
        isOfficeWithImages = true;
        updateJob(id, { progress: 65, message: "Preparing embedded images for quiz generation..." });
      }
    }
    
    updateJob(id, { progress: 80, message: "Finalizing..." });
    
    if (isOfficeWithImages) {
      updateJob(id, {
        status: "completed",
        progress: 100,
        message: "Document ready for visual analysis!",
        text: extractedText,
        isOfficeWithImages: true,
        documentImages: documentImages,
        isImageOnly: extractedText.length < 50,
      });
    } else if (isImageFile) {
      updateJob(id, {
        status: "completed",
        progress: 100,
        message: "Image ready for visual analysis!",
        text: "",
        isOfficeWithImages: false,
        isImageOnly: true,
      });
    } else {
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
