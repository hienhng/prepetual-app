import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, X, Loader2, File, CheckCircle2, ArrowRight } from "lucide-react";
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

  // Pending files that haven't been processed yet
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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

      // Always pass images if available
      if (combinedImages.length > 0) {
        onTextExtracted(combinedText, true, combinedImages);
      } else if (combinedText) {
        onTextExtracted(combinedText, false, []);
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
  }, [activeJobs, isAllCompleted, completedJobs.length, getCombinedText, getCombinedDocumentImages, onTextExtracted, errorJobs, pendingFiles.length]);

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
            className="flex flex-col items-center justify-center py-16 px-8 rounded-3xl bg-background/50 backdrop-blur-md border border-border/50 shadow-2xl relative overflow-hidden"
          >
            {/* Mesh pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '16px 16px' }} />

            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full border-4 border-muted flex items-center justify-center">
                <div
                  className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] rounded-full border-4 border-primary border-t-transparent animate-spin"
                  style={{ animationDuration: "0.8s" }}
                />
                <Upload className="h-10 w-10 text-primary animate-bounce fill-current opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin-slow opacity-80" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">
              {loadingMessage}
            </h3>
            <p className="text-muted-foreground font-medium mb-6">
              Synthesizing {processingJobs.length} of {activeJobs.length} assets
            </p>

            <div className="w-full max-w-xs space-y-3">
              <div className="h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50 p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Progress</span>
                <span className="text-xs font-black text-primary">{overallProgress}%</span>
              </div>
            </div>
          </motion.div>
        ) : pendingFiles.length > 0 ? (
          <motion.div
            key="pending-files"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* File list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <File className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">
                    {pendingFiles.length} Selection{pendingFiles.length !== 1 ? 's' : ''} Ready
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAllFiles}
                  className="rounded-xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  data-testid="button-clear-pending"
                >
                  Discard All
                </Button>
              </div>

              <div className="grid gap-3">
                {pendingFiles.map((file, index) => (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 flex items-center justify-between gap-4 border-border/50 bg-background/50 backdrop-blur-sm group hover:border-primary/30 transition-all duration-300">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold truncate tracking-tight">{file.name}</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive group/close"
                        onClick={() => removePendingFile(file.name)}
                        data-testid={`button-remove-pending-${index}`}
                      >
                        <X className="h-5 w-5 transition-transform group-hover/close:rotate-90" />
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Add more files dropzone */}
            <Card
              {...getRootProps()}
              className={`
                relative p-6 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 group
                ${isDragActive
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40"
                }
              `}
              data-testid="dropzone-add-more"
            >
              <input {...getInputProps()} data-testid="input-file-more" />
              <div className="flex items-center justify-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                <div className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">Append more assets</span>
              </div>
            </Card>

            {/* Proceed button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-2"
            >
              <Button
                size="xl"
                onClick={handleProceed}
                className="w-full gap-3 rounded-2xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 group"
                data-testid="button-proceed-scan"
              >
                <span>Ready to Scan</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
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
              {/* Mesh background */}
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
                    {isDragActive ? "Release to Scan" : "Upload your materials"}
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
                      className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-background/50 border border-border/50 transition-colors group-hover:border-primary/20`}
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

      {/* Active jobs display (processing/completed) */}
      {activeJobs.length > 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-lg font-black tracking-tight text-foreground">
                {completedJobs.length === activeJobs.length
                  ? `${completedJobs.length} Knowledge Asset${completedJobs.length !== 1 ? 's' : ''} Synced`
                  : `Scanning ${activeJobs.length} Asset${activeJobs.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/10" data-testid="button-clear-all">
                  Wipe Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-border/50 backdrop-blur-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black tracking-tight">Erase all assets?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base font-medium">
                    This will remove all uploaded knowledge and extracted information from the current session.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={removeAllFiles} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold">
                    Erase Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid gap-3">
            {activeJobs.map((job) => (
              <Card key={job.jobId} className="p-4 flex items-center justify-between gap-4 border-border/50 bg-background/50 backdrop-blur-sm group hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${job.status === "completed" ? "bg-emerald-500/10" : "bg-muted/50"} group-hover:scale-110`}>
                    {getFileIcon(job.fileType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold truncate tracking-tight">{job.fileName}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-black uppercase tracking-widest ${job.status === "completed" ? "text-emerald-500" : job.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                        {job.status === "completed" ? "Synchronized" : job.status === "error" ? "Failed" : `Analyzing ${job.progress}%`}
                      </p>
                      {job.status === "error" && (
                        <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[150px]">
                          ({job.error})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${job.status === "completed" ? "bg-emerald-500/20" : "bg-muted"}`}>
                    {getStatusIcon(job.status)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive group/close"
                    onClick={(e) => {
                      e.stopPropagation();
                      const remainingJobs = activeJobs.filter(j => j.jobId !== job.jobId && j.status === "completed" && j.text);
                      const remainingText = remainingJobs.map(j => j.text).join("\n\n---\n\n");
                      const remainingImages = remainingJobs.flatMap(j => j.documentImages || []);
                      const hasRemainingImages = remainingJobs.some(j => j.isOfficeWithImages);

                      removeJob(job.jobId);

                      if (remainingJobs.length === 0) {
                        onTextExtracted("");
                        setSourceMaterial({ type: null, text: null, imageDataUrl: null });
                      } else {
                        onTextExtracted(remainingText, hasRemainingImages, remainingImages);
                      }
                    }}
                    data-testid={`button-remove-file-${job.jobId}`}
                  >
                    <X className="h-5 w-5 transition-transform group-hover/close:rotate-90" />
                  </Button>
                </div>
              </Card>
            ))}
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
    </div>
  );
}
