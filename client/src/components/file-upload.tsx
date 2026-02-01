import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, X, Loader2, File, CheckCircle2, ArrowRight, Crop } from "lucide-react";
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
import { ImageCropper } from "@/components/image-cropper";

interface CroppedIllustration {
  id: string;
  description: string;
  type: string;
  imageDataUrl: string;
}

interface FileUploadProps {
  onTextExtracted: (text: string, isOfficeWithImages?: boolean, documentImages?: string[], croppedIllustrations?: CroppedIllustration[]) => void;
}

interface ManualCrop {
  fileName: string;
  crops: CroppedIllustration[];
}

export function FileUpload({ onTextExtracted }: FileUploadProps) {
  const { activeJobs, startUpload, clearJobs, removeJob, isAllCompleted, isAnyProcessing, getCombinedText, getCombinedDocumentImages, getCroppedIllustrations, hasOfficeWithImages } = useUpload();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { setSourceMaterial } = useQuiz();
  
  // Pending files that haven't been processed yet
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // Manual cropping state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageUrl, setCropperImageUrl] = useState<string>("");
  const [cropperFileName, setCropperFileName] = useState<string>("");
  const [manualCrops, setManualCrops] = useState<ManualCrop[]>([]);

  const isLoading = isUploading || isAnyProcessing();
  
  const completedJobs = activeJobs.filter(job => job.status === "completed");
  
  // Open cropper for an image file (from pending files - no longer used but kept for reference)
  const openCropper = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setCropperImageUrl(result);
        setCropperFileName(file.name);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  }, []);
  
  // Open cropper from a completed job (after AI scan)
  const openCropperFromJob = useCallback((job: { jobId: string; fileName: string; imageDataUrl?: string }) => {
    if (job.imageDataUrl) {
      setCropperImageUrl(job.imageDataUrl);
      setCropperFileName(job.fileName);
      setCropperOpen(true);
    }
  }, []);
  
  // Handle completed crops from the cropper
  const handleCropsComplete = useCallback((crops: { id: string; description: string; imageDataUrl: string }[]) => {
    const cropsWithType: CroppedIllustration[] = crops.map(c => ({
      ...c,
      type: "manual",
    }));
    
    setManualCrops(prev => {
      const existing = prev.filter(m => m.fileName !== cropperFileName);
      return [...existing, { fileName: cropperFileName, crops: cropsWithType }];
    });
    
    setCropperOpen(false);
    setCropperImageUrl("");
    setCropperFileName("");
  }, [cropperFileName]);
  
  // Get count of manual crops for a file
  const getManualCropCount = useCallback((fileName: string) => {
    const found = manualCrops.find(m => m.fileName === fileName);
    return found ? found.crops.length : 0;
  }, [manualCrops]);
  
  // Get all manual crops
  const getAllManualCrops = useCallback(() => {
    return manualCrops.flatMap(m => m.crops);
  }, [manualCrops]);
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
      const aiIllustrations = getCroppedIllustrations();
      const manualIllustrations = getAllManualCrops();
      const allIllustrations = [...aiIllustrations, ...manualIllustrations];
      const hasImages = hasOfficeWithImages();
      
      if (hasImages && combinedImages.length > 0) {
        onTextExtracted(combinedText, true, combinedImages, allIllustrations);
      } else if (combinedText) {
        onTextExtracted(combinedText, false, [], allIllustrations);
      }
    }
    
    if (activeJobs.length === 0 && pendingFiles.length === 0) {
      setError(null);
    }
    
    const firstError = errorJobs[0];
    if (firstError) {
      setError(firstError.error || "An error occurred while processing files");
    } else if (activeJobs.length > 0) {
      setError(null);
    }
  }, [activeJobs, isAllCompleted, completedJobs.length, getCombinedText, getCombinedDocumentImages, getCroppedIllustrations, getAllManualCrops, hasOfficeWithImages, onTextExtracted, errorJobs, pendingFiles.length, manualCrops]);

  const processFiles = useCallback(async (files: File[]) => {
    setError(null);
    setIsUploading(true);
    setPendingFiles([]);

    try {
      await startUpload(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while uploading files");
    } finally {
      setIsUploading(false);
    }
  }, [startUpload]);

  const handleProceed = useCallback(() => {
    if (pendingFiles.length > 0) {
      processFiles(pendingFiles);
    }
  }, [pendingFiles, processFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Add to pending files instead of processing immediately
      setPendingFiles(prev => {
        const newFiles = [...prev];
        for (const file of acceptedFiles) {
          // Avoid duplicates by name
          if (!newFiles.some(f => f.name === file.name)) {
            newFiles.push(file);
          }
        }
        // Limit to 10 files
        return newFiles.slice(0, 10);
      });
      setError(null);
    }
  }, []);

  const removePendingFile = useCallback((fileName: string) => {
    setPendingFiles(prev => prev.filter(f => f.name !== fileName));
    setManualCrops(prev => prev.filter(m => m.fileName !== fileName));
  }, []);

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
    setPendingFiles([]);
    setManualCrops([]);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
        ) : pendingFiles.length > 0 ? (
          <motion.div
            key="pending-files"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* File list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">
                  {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} selected
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAllFiles}
                  className="text-muted-foreground hover:text-destructive"
                  data-testid="button-clear-pending"
                >
                  Clear all
                </Button>
              </div>
              
              {pendingFiles.map((file, index) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-3 flex items-center justify-between gap-3 hover-elevate">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getFileIcon(file.type)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removePendingFile(file.name)}
                      data-testid={`button-remove-pending-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Add more files dropzone */}
            <Card
              {...getRootProps()}
              className={`
                p-4 border-2 border-dashed cursor-pointer transition-all duration-200
                ${isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted hover:border-primary/50 hover:bg-muted/30"
                }
              `}
              data-testid="dropzone-add-more"
            >
              <input {...getInputProps()} data-testid="input-file-more" />
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Drop more files or click to add (max 10)</span>
              </div>
            </Card>

            {/* Proceed button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleProceed}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                size="lg"
                data-testid="button-proceed-scan"
              >
                <span>Proceed to Scan</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
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
                  w-14 h-14 rounded-full flex items-center justify-center transition-colors
                  ${isDragActive ? "bg-primary/20" : "bg-primary/10"}
                `}>
                  <Upload className={`h-7 w-7 ${isDragActive ? "text-primary" : "text-primary/80"}`} />
                </div>
                
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground">
                    {isDragActive ? "Drop files here" : "Drop files or click to upload"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, Word, PowerPoint, Excel, or images (up to 10 files)
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                  {["PDF", "DOCX", "PPTX", "XLSX", "JPG", "PNG"].map((format) => (
                    <Badge key={format} variant="secondary" className="text-xs px-2 py-0.5">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active jobs display (processing/completed) */}
      {activeJobs.length > 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {completedJobs.length === activeJobs.length 
                ? `${completedJobs.length} file${completedJobs.length !== 1 ? 's' : ''} ready`
                : `Processing ${activeJobs.length} files`}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" data-testid="button-clear-all">
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all files?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all uploaded files and extracted text.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={removeAllFiles} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <div className="space-y-2">
            {activeJobs.map((job) => {
              const isImage = job.fileType.includes("image");
              const isCompleted = job.status === "completed";
              const cropCount = getManualCropCount(job.fileName);
              const aiCropCount = job.croppedIllustrations?.length || 0;
              const totalCrops = cropCount + aiCropCount;
              
              return (
              <Card key={job.jobId} className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getFileIcon(job.fileType)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{job.fileName}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {job.status === "completed" ? "Ready" : job.status === "error" ? job.error : `${job.progress}%`}
                      </p>
                      {isCompleted && isImage && totalCrops > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {totalCrops} illustration{totalCrops !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted && isImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => openCropperFromJob(job)}
                      data-testid={`button-crop-${job.jobId}`}
                    >
                      <Crop className="h-3 w-3" />
                      {cropCount > 0 ? "Edit Crop" : "Crop"}
                    </Button>
                  )}
                  {getStatusIcon(job.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      const remainingJobs = activeJobs.filter(j => j.jobId !== job.jobId && j.status === "completed" && j.text);
                      const remainingText = remainingJobs.map(j => j.text).join("\n\n---\n\n");
                      const remainingImages = remainingJobs.flatMap(j => j.documentImages || []);
                      const aiIllustrations = remainingJobs.flatMap(j => j.croppedIllustrations || []);
                      const hasRemainingImages = remainingJobs.some(j => j.isOfficeWithImages);
                      
                      // Include manual crops (they're not tied to jobs, so keep all of them)
                      const allManualCrops = getAllManualCrops();
                      const allIllustrations = [...aiIllustrations, ...allManualCrops];
                      
                      removeJob(job.jobId);
                      
                      if (remainingJobs.length === 0) {
                        onTextExtracted("");
                        setSourceMaterial({ type: null, text: null, imageDataUrl: null });
                        setManualCrops([]);
                      } else {
                        onTextExtracted(remainingText, hasRemainingImages, remainingImages, allIllustrations);
                      }
                    }}
                    data-testid={`button-remove-file-${job.jobId}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
              );
            })}
          </div>
        </motion.div>
      )}

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
                  onClick={() => {
                    setError(null);
                    removeAllFiles();
                  }}
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
      
      {/* Manual Cropper Dialog */}
      <ImageCropper
        imageDataUrl={cropperImageUrl}
        isOpen={cropperOpen}
        onCropsComplete={handleCropsComplete}
        onCancel={() => {
          setCropperOpen(false);
          setCropperImageUrl("");
          setCropperFileName("");
        }}
      />
    </div>
  );
}
