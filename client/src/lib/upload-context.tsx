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
}

interface UploadContextType {
  activeJob: UploadJob | null;
  startUpload: (file: File) => Promise<void>;
  clearJob: () => void;
  pollJobStatus: () => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const STORAGE_KEY = "upload_job";

export function UploadProvider({ children }: { children: ReactNode }) {
  const [activeJob, setActiveJob] = useState<UploadJob | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const job = JSON.parse(stored);
        if (job.status === "completed" || job.status === "error") {
          return job;
        }
        if (job.status === "pending" || job.status === "processing") {
          return job;
        }
      }
    } catch {}
    return null;
  });

  const saveJob = useCallback((job: UploadJob | null) => {
    setActiveJob(job);
    if (job) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const pollJobStatus = useCallback(async () => {
    if (!activeJob || !activeJob.jobId) return;
    if (activeJob.status === "completed" || activeJob.status === "error") return;

    try {
      const response = await fetch(`/api/upload-status/${activeJob.jobId}`);
      
      if (response.status === 404) {
        const updatedJob = {
          ...activeJob,
          status: "error" as const,
          progress: 0,
          message: "Upload session expired",
          error: "The upload session has expired. Please try uploading again.",
        };
        saveJob(updatedJob);
        return;
      }
      
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      
      const updatedJob = {
        ...activeJob,
        status: data.status,
        progress: data.progress,
        message: data.message,
        text: data.text,
        error: data.error,
        isOfficeWithImages: data.isOfficeWithImages || false,
        documentImages: data.documentImages || [],
      };
      
      saveJob(updatedJob);
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, [activeJob, saveJob]);

  useEffect(() => {
    if (!activeJob) return;
    if (activeJob.status === "completed" || activeJob.status === "error") return;

    const interval = setInterval(pollJobStatus, 1000);
    return () => clearInterval(interval);
  }, [activeJob, pollJobStatus]);

  const startUpload = useCallback(async (file: File) => {
    let imageDataUrl: string | undefined;
    
    if (file.type.startsWith("image/")) {
      imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload-async", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Failed to upload file";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const data = await response.json();

    const job: UploadJob = {
      jobId: data.jobId,
      fileName: file.name,
      fileType: file.type,
      status: data.status,
      progress: 5,
      message: data.message,
      imageDataUrl,
    };

    saveJob(job);
  }, [saveJob]);

  const clearJob = useCallback(async () => {
    if (activeJob?.jobId) {
      try {
        await fetch(`/api/upload-job/${activeJob.jobId}`, { method: "DELETE" });
      } catch {}
    }
    saveJob(null);
  }, [activeJob?.jobId, saveJob]);

  return (
    <UploadContext.Provider value={{ activeJob, startUpload, clearJob, pollJobStatus }}>
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
