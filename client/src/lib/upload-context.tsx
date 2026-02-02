import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface UploadJob {
  jobId: string;
  fileName: string;
  fileType: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  message: string;
  text?: string;
  error?: string;
  imageDataUrl?: string;
  isOfficeWithImages?: boolean;
  documentImages?: string[];
  isImageOnly?: boolean;
}

interface UploadContextType {
  activeJobs: UploadJob[];
  startUpload: (files: File[]) => Promise<void>;
  clearJobs: () => void;
  removeJob: (jobId: string) => void;
  pollJobStatus: () => Promise<void>;
  getCombinedText: () => string;
  getCombinedDocumentImages: () => string[];
  hasOfficeWithImages: () => boolean;
  hasImageOnlyUploads: () => boolean;
  isAllCompleted: () => boolean;
  isAnyProcessing: () => boolean;
  // Legacy single-file support
  activeJob: UploadJob | null;
  clearJob: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const STORAGE_KEY = "upload_jobs";

export function UploadProvider({ children }: { children: ReactNode }) {
  const [activeJobs, setActiveJobs] = useState<UploadJob[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [];
  });

  const saveJobs = useCallback((jobs: UploadJob[]) => {
    setActiveJobs(jobs);
    if (jobs.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const pollJobStatus = useCallback(async () => {
    if (activeJobs.length === 0) return;
    
    const pendingJobs = activeJobs.filter(
      job => job.status === "pending" || job.status === "processing"
    );
    
    if (pendingJobs.length === 0) return;

    try {
      const updatedJobs = await Promise.all(
        activeJobs.map(async (job) => {
          if (job.status === "completed" || job.status === "error") {
            return job;
          }

          try {
            const response = await fetch(`/api/upload-status/${job.jobId}`);
            
            if (response.status === 404) {
              return {
                ...job,
                status: "error" as const,
                progress: 0,
                message: "Upload session expired",
                error: "The upload session has expired. Please try uploading again.",
              };
            }
            
            if (!response.ok) {
              return job;
            }

            const data = await response.json();
            
            return {
              ...job,
              status: data.status,
              progress: data.progress,
              message: data.message,
              text: data.text,
              error: data.error,
              isOfficeWithImages: data.isOfficeWithImages || false,
              documentImages: data.documentImages || [],
              isImageOnly: data.isImageOnly || false,
            };
          } catch {
            return job;
          }
        })
      );
      
      saveJobs(updatedJobs);
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, [activeJobs, saveJobs]);

  useEffect(() => {
    const pendingJobs = activeJobs.filter(
      job => job.status === "pending" || job.status === "processing"
    );
    
    if (pendingJobs.length === 0) return;

    const interval = setInterval(pollJobStatus, 1000);
    return () => clearInterval(interval);
  }, [activeJobs, pollJobStatus]);

  const startUpload = useCallback(async (files: File[]) => {
    const formData = new FormData();
    
    // Read image files as data URLs for preview
    const imageDataUrls: Map<string, string> = new Map();
    await Promise.all(files.map(async (file) => {
      if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        imageDataUrls.set(file.name, dataUrl);
      }
    }));
    
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await fetch("/api/upload-async", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Failed to upload files";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const data = await response.json();

    const newJobs: UploadJob[] = data.jobs.map((jobData: any, index: number) => {
      const file = files[index];
      const isImage = file.type.startsWith("image/");
      return {
        jobId: jobData.jobId,
        fileName: jobData.fileName || file.name,
        fileType: file.type,
        status: jobData.status,
        progress: 5,
        message: jobData.message,
        // Store image data URL for preview
        imageDataUrl: isImage ? imageDataUrls.get(file.name) : undefined,
      };
    });

    saveJobs([...activeJobs, ...newJobs]);
  }, [activeJobs, saveJobs]);

  const clearJobs = useCallback(async () => {
    for (const job of activeJobs) {
      try {
        await fetch(`/api/upload-job/${job.jobId}`, { method: "DELETE" });
      } catch {}
    }
    saveJobs([]);
  }, [activeJobs, saveJobs]);

  const removeJob = useCallback(async (jobId: string) => {
    try {
      await fetch(`/api/upload-job/${jobId}`, { method: "DELETE" });
    } catch {}
    saveJobs(activeJobs.filter(job => job.jobId !== jobId));
  }, [activeJobs, saveJobs]);

  const getCombinedText = useCallback(() => {
    return activeJobs
      .filter(job => job.status === "completed" && job.text)
      .map(job => job.text)
      .join("\n\n---\n\n");
  }, [activeJobs]);

  const getCombinedDocumentImages = useCallback(() => {
    const images: string[] = [];
    
    for (const job of activeJobs) {
      if (job.status !== "completed") continue;
      
      // Add document images from office files (if any)
      if (job.documentImages && job.documentImages.length > 0) {
        images.push(...job.documentImages);
      }
      
      // Also add image data URL from uploaded images (always check, not else-if)
      if (job.imageDataUrl) {
        images.push(job.imageDataUrl);
      }
    }
    
    return images;
  }, [activeJobs]);

  const hasOfficeWithImages = useCallback(() => {
    // Check for office docs with images OR uploaded images
    return activeJobs.some(job => 
      job.status === "completed" && (job.isOfficeWithImages || job.imageDataUrl)
    );
  }, [activeJobs]);

  const hasImageOnlyUploads = useCallback(() => {
    // Check if ALL completed jobs are image-only (PNG/JPG uploads with no text)
    const completedJobs = activeJobs.filter(job => job.status === "completed");
    return completedJobs.length > 0 && completedJobs.every(job => job.isImageOnly || job.imageDataUrl);
  }, [activeJobs]);

  const isAllCompleted = useCallback(() => {
    return activeJobs.length > 0 && activeJobs.every(job => job.status === "completed" || job.status === "error");
  }, [activeJobs]);

  const isAnyProcessing = useCallback(() => {
    return activeJobs.some(job => job.status === "pending" || job.status === "processing");
  }, [activeJobs]);

  // Legacy single-file support (returns first job)
  const activeJob = activeJobs.length > 0 ? activeJobs[0] : null;
  const clearJob = clearJobs;

  return (
    <UploadContext.Provider value={{ 
      activeJobs, 
      startUpload, 
      clearJobs, 
      removeJob,
      pollJobStatus, 
      getCombinedText,
      getCombinedDocumentImages,
      hasOfficeWithImages,
      hasImageOnlyUploads,
      isAllCompleted,
      isAnyProcessing,
      activeJob,
      clearJob,
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
