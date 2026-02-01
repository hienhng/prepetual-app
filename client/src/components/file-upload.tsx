import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, X, Loader2, File, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/lib/quiz-context";
import { useUpload } from "@/lib/upload-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FileUploadProps {
  onTextExtracted: (text: string, isOfficeWithImages?: boolean, documentImages?: string[]) => void;
}

export function FileUpload({ onTextExtracted }: FileUploadProps) {
  const { activeJobs, startUpload, clearJobs, removeJob, isAllCompleted, isAnyProcessing, getCombinedText, getCombinedDocumentImages, hasOfficeWithImages } = useUpload();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { setSourceMaterial } = useQuiz();

  const isLoading = isUploading || isAnyProcessing();
  
  const completedJobs = activeJobs.filter(job => job.status === "completed");
  const processingJobs = activeJobs.filter(job => job.status === "pending" || job.status === "processing");
  const errorJobs = activeJobs.filter(job => job.status === "error");
  
  const overallProgress = activeJobs.length > 0 
    ? Math.round(activeJobs.reduce((sum, job) => sum + job.progress, 0) / activeJobs.length)
    : 0;

  const loadingMessage = processingJobs.length > 0 
    ? processingJobs[0].message || "Processing files..."
    : isUploading ? "Uploading files..." : "";

  useEffect(() => {
    if (isAllCompleted() && completedJobs.length > 0) {
      const combinedText = getCombinedText();
      const combinedImages = getCombinedDocumentImages();
      const hasImages = hasOfficeWithImages();
      
      if (hasImages && combinedImages.length > 0) {
        onTextExtracted(combinedText, true, combinedImages);
      } else if (combinedText) {
        onTextExtracted(combinedText, false, []);
      }
    }
    
    if (activeJobs.length === 0) {
      setError(null);
    }
    
    const firstError = errorJobs[0];
    if (firstError) {
      setError(firstError.error || "An error occurred while processing files");
    } else {
      setError(null);
    }
  }, [activeJobs, isAllCompleted, completedJobs.length, getCombinedText, getCombinedDocumentImages, hasOfficeWithImages, onTextExtracted, errorJobs]);

  const processFiles = useCallback(async (files: File[]) => {
    setError(null);
    setIsUploading(true);

    try {
      await startUpload(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while uploading files");
    } finally {
      setIsUploading(false);
    }
  }, [startUpload]);

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

  const removeAllFiles = () => {
    clearJobs();
    setSourceMaterial({ type: null, text: null, imageDataUrl: null });
    onTextExtracted("");
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes("image")) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else {
      return <File className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {isLoading && processingJobs.length > 0 ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-muted animate-pulse" />
              <div 
                className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin"
                style={{ animationDuration: "1s" }}
              />
              <Upload className="absolute inset-0 m-auto h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">{loadingMessage}</p>
            <p className="text-sm text-muted-foreground mb-3">
              Processing {processingJobs.length} of {activeJobs.length} files
            </p>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-quiz-purple rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{overallProgress}% complete</p>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card
              {...getRootProps()}
              className={`
                relative p-6 sm:p-10 border-2 border-dashed cursor-pointer transition-all duration-200
                ${isDragActive 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-muted hover:border-primary/50 hover:bg-muted/30"
                }
                ${error ? "border-destructive/50" : ""}
              `}
              data-testid="dropzone-upload"
            >
              <input {...getInputProps()} data-testid="input-file" />
              
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`
                  w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors
                  ${isDragActive ? "bg-primary text-primary-foreground" : "bg-muted"}
                `}>
                  <Upload className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                
                <div>
                  <p className="text-base sm:text-lg font-semibold text-foreground mb-1">
                    {isDragActive ? "Drop your files here" : "Upload study materials"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop or click to browse (up to 10 files)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    PDF
                  </Badge>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <File className="h-3 w-3" />
                    DOCX
                  </Badge>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <File className="h-3 w-3" />
                    PPTX
                  </Badge>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Image className="h-3 w-3" />
                    Images
                  </Badge>
                </div>
              </div>
            </Card>

            {activeJobs.length > 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {completedJobs.length} of {activeJobs.length} files processed
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        data-testid="button-remove-all-files"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear all
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove all files?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove all uploaded files?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={removeAllFiles} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Remove all
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {activeJobs.map((job) => (
                  <Card key={job.jobId} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {getFileIcon(job.fileType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">
                          {job.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.status === "error" ? job.error : job.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusIcon(job.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Calculate remaining text after removal
                          const remainingJobs = activeJobs.filter(j => j.jobId !== job.jobId && j.status === "completed" && j.text);
                          const remainingText = remainingJobs.map(j => j.text).join("\n\n---\n\n");
                          const remainingImages = remainingJobs.flatMap(j => j.documentImages || []);
                          const hasRemainingImages = remainingJobs.some(j => j.isOfficeWithImages);
                          
                          removeJob(job.jobId);
                          
                          // Update extracted text with remaining content
                          if (remainingJobs.length === 0) {
                            onTextExtracted("");
                            setSourceMaterial({ type: null, text: null, imageDataUrl: null });
                          } else {
                            onTextExtracted(remainingText, hasRemainingImages, remainingImages);
                          }
                        }}
                        data-testid={`button-remove-file-${job.jobId}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {error && activeJobs.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Card className="p-4 bg-destructive/10 border-destructive/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <X className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-destructive">Upload failed</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
