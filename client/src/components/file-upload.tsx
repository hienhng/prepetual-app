import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, X, Loader2, File } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/lib/upload-context";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onTextExtracted: (text: string, isOfficeWithImages?: boolean, documentImages?: string[], isImageOnly?: boolean) => void;
}

function isSizeRelatedError(errorMessage: string): boolean {
  const sizeLimitPatterns = [
    /too\s*large/i,
    /size\s*limit/i,
    /exceeds/i,
    /maximum.*\d+\s*(mb|gb|bytes?)/i,
    /combined.*upload/i,
    /25\s*MB/i,
    /10\s*MB/i,
  ];
  return sizeLimitPatterns.some(pattern => pattern.test(errorMessage));
}

export function FileUpload({ onTextExtracted }: FileUploadProps) {
  const { activeJobs, startUpload, isAllCompleted, isAnyProcessing, getCombinedText, getCombinedDocumentImages, hasImageOnlyUploads } = useUpload();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadInitiatedRef = useRef(false);

  const isLoading = isUploading || isAnyProcessing();

  const completedJobs = activeJobs.filter(job => job.status === "completed");
  const processingJobs = activeJobs.filter(job => job.status === "pending" || job.status === "processing");
  const errorJobs = activeJobs.filter(job => job.status === "error");

  const loadingMessage = processingJobs.length > 0
    ? processingJobs[0].message || "Processing files..."
    : isUploading ? "Preparing files..." : "";

  useEffect(() => {
    if (uploadInitiatedRef.current && isAllCompleted() && completedJobs.length > 0) {
      uploadInitiatedRef.current = false;
      const combinedText = getCombinedText();
      const combinedImages = getCombinedDocumentImages();
      const isImageOnly = hasImageOnlyUploads();

      if (combinedImages.length > 0) {
        onTextExtracted(combinedText, true, combinedImages, isImageOnly);
      } else if (combinedText) {
        onTextExtracted(combinedText, false, []);
      }
    }

    if (activeJobs.length === 0) {
      setError(null);
    }

    const firstError = errorJobs[0];
    if (firstError) {
      const errorMessage = firstError.error || "An error occurred while processing files";
      setError(errorMessage);
      
      // Show toast for size-related errors
      if (isSizeRelatedError(errorMessage)) {
        toast({
          title: "File Size Limit Exceeded",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else if (activeJobs.length > 0) {
      setError(null);
    }
  }, [activeJobs, isAllCompleted, completedJobs.length, getCombinedText, getCombinedDocumentImages, hasImageOnlyUploads, onTextExtracted, errorJobs, toast]);

  const processFiles = useCallback(async (files: File[]) => {
    setError(null);
    setIsUploading(true);
    uploadInitiatedRef.current = true;

    try {
      await startUpload(files);
    } catch (err) {
      uploadInitiatedRef.current = false;
      const errorMessage = err instanceof Error ? err.message : "An error occurred while uploading files";
      setError(errorMessage);
      
      // Show toast for size-related errors with clear messaging
      if (isSizeRelatedError(errorMessage)) {
        toast({
          title: "File Size Limit Exceeded",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // Show toast for other upload errors
        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  }, [startUpload, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFiles(acceptedFiles);
    }
  }, [processFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/msword": [".doc"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 10,
    disabled: isLoading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-16 px-8 rounded-3xl bg-background/50 backdrop-blur-md border border-border/50 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '16px 16px' }} />

            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full border-4 border-muted flex items-center justify-center">
                <div
                  className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] rounded-full border-4 border-primary border-t-transparent animate-spin"
                  style={{ animationDuration: "0.8s" }}
                />
                <Loader2 className="h-12 w-12 text-primary animate-spin opacity-80" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">
              {loadingMessage}
            </h3>
            <p className="text-muted-foreground font-medium mb-6">
              {activeJobs.length > 0
                ? `Processing ${processingJobs.length} of ${activeJobs.length} files`
                : "Extracting available text and preserving visuals"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <Card
              {...getRootProps()}
              className={`
                relative p-12 sm:p-20 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all duration-500 overflow-hidden group
                ${isDragActive
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border/50 bg-muted/10 hover:border-primary/40 hover:bg-muted/20"
                }
                ${error ? "border-destructive/40 bg-destructive/5" : ""}
              `}
              data-testid="dropzone-upload"
            >
              <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '16px 16px' }} />

              <input {...getInputProps()} data-testid="input-file" />

              <div className="flex flex-col items-center text-center gap-6 relative z-10">
                <div className="relative">
                  <div className={`
                    absolute -inset-4 rounded-full blur-2xl transition-all duration-500
                    ${isDragActive ? "bg-primary/30 opacity-100" : "bg-primary/20 opacity-0 group-hover:opacity-100"}
                  `} />
                  <div className={`
                    w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl
                    ${isDragActive ? "bg-primary text-white scale-110 rotate-12" : "bg-background border border-border/50 group-hover:border-primary/50 group-hover:-translate-y-2"}
                  `}>
                    <Upload className={`h-10 w-10 transition-transform duration-500 ${isDragActive ? "" : "text-primary group-hover:scale-110"}`} />
                  </div>
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">
                    {isDragActive ? "Release to Upload" : "Upload your materials"}
                  </h3>
                  <p className="text-muted-foreground font-medium text-lg">
                    Drag and drop your files or <span className="text-primary font-bold">click to browse</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center mt-2 px-6">
                  {["PDF", "DOCX", "PPTX", "XLSX", "JPG", "PNG"].map((format) => (
                    <Badge
                      key={format}
                      variant="secondary"
                      className="text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-background/50 border border-border/50 transition-colors group-hover:border-primary/20"
                    >
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4"
          >
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-start gap-3">
                <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Upload failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="shrink-0"
                  data-testid="button-dismiss-error"
                >
                  Dismiss
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
