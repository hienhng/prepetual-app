import { useLanguage } from "@/lib/language-context";
import { localizeProgressMessage } from "@/lib/localized-progress";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Plus, X, Loader2, ArrowRight } from "lucide-react";
import { FileTypeIcon } from "@/components/file-type-icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/lib/upload-context";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface FileUploadProps {
  onTextExtracted: (text: string, isOfficeWithImages?: boolean, documentImages?: string[], isImageOnly?: boolean) => void;
  requireAuth?: boolean;
  onRequireAuth?: () => void;
}

function isSizeRelatedError(errorMessage: string): boolean {
  const sizeLimitPatterns = [
    /too\s*large/i,
    /size\s*limit/i,
    /exceeds/i,
    /maximum.*\d+\s*(mb|gb|bytes?)/i,
    /combined.*upload/i,
    /50\s*MB/i,
    /25\s*MB/i,
    /10\s*MB/i,
  ];
  return sizeLimitPatterns.some(pattern => pattern.test(errorMessage));
}

function formatFileSize(bytes: number | undefined, unavailable: string): string {
  if (bytes === undefined) return unavailable;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ onTextExtracted, requireAuth = false, onRequireAuth }: FileUploadProps) {
  const { t } = useLanguage();
  const { activeJobs, startUpload, acceptJobs, discardPendingUploads, getCombinedText, getCombinedDocumentImages, hasImageOnlyUploads } = useUpload();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const pendingUploads = activeJobs.filter(job => job.accepted === false);
  const completedJobs = pendingUploads.filter(job => job.status === "completed");
  const processingJobs = pendingUploads.filter(job => job.status === "pending" || job.status === "processing");
  const firstError = pendingUploads.find(job => job.status === "error");
  const isLoading = isUploading || processingJobs.length > 0;
  const canProceed = completedJobs.some(job => job.text?.trim() || job.documentImages?.length || (job.isImageOnly && job.imageDataUrl));

  const loadingMessage = processingJobs.length > 0
    ? localizeProgressMessage(processingJobs[0].message || '', t, 'fileUpload.processing')
    : isUploading ? t('fileUpload.preparing') : "";

  useEffect(() => {
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
    } else {
      setError(null);
    }
  }, [firstError?.error, firstError?.jobId, toast]);

  const handleProceed = () => {
    if (isLoading || !canProceed) return;
    const combinedText = getCombinedText();
    const combinedImages = getCombinedDocumentImages();
    acceptJobs(completedJobs.map(job => job.jobId));
    onTextExtracted(combinedText, combinedImages.length > 0, combinedImages, hasImageOnlyUploads());
  };

  const processFiles = useCallback(async (files: File[]) => {
    setError(null);
    setIsUploading(true);

    try {
      await startUpload(files);
    } catch (err) {
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
      const totalBytes = acceptedFiles.reduce((total, file) => total + file.size, 0);
      if (totalBytes > 50 * 1024 * 1024) {
        const message = "The combined upload must be 50 MB or smaller.";
        setError(message);
        toast({ title: "File Size Limit Exceeded", description: message, variant: "destructive" });
        return;
      }
      processFiles(acceptedFiles);
    }
  }, [processFiles, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (requireAuth && !isAuthenticated) {
        onRequireAuth?.();
        return;
      }
      onDrop(acceptedFiles);
    },
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
    maxSize: 50 * 1024 * 1024,
    onDropRejected: (rejections) => {
      if (rejections.some(({ errors }) => errors.some(({ code }) => code === "file-too-large"))) {
        const message = "Each file must be 50 MB or smaller.";
        setError(message);
        toast({ title: "File Size Limit Exceeded", description: message, variant: "destructive" });
      }
    },
    disabled: isLoading,
    noClick: false,
  });

  const rootProps = getRootProps();

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
                ? `Processing ${processingJobs.length} of ${pendingUploads.length} files`
                : t("fileUpload.extracting")}
            </p>
          </motion.div>
        ) : completedJobs.length > 0 ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
            data-testid="upload-preview"
          >
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tight">{t("fileUpload.preview")}</h3>
              <p className="text-sm text-muted-foreground">{t("fileUpload.previewDescription")}</p>
            </div>
            <div className="grid max-h-[45svh] grid-cols-1 gap-3 overflow-y-auto" data-testid="upload-preview-grid">
              {completedJobs.map(job => {
                return (
                  <Card key={job.jobId} className="flex min-w-0 items-center gap-3 rounded-xl p-4" data-testid="upload-file-preview">
                    <FileTypeIcon fileName={job.fileName} mimeType={job.fileType} />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="break-words text-sm font-bold" title={job.fileName}>{job.fileName}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(job.fileSize, t('fileUpload.sizeUnavailable'))}</p>
                    </div>
                  </Card>
                );
              })}
              <Card
                {...rootProps}
                onClick={(event) => {
                  if (requireAuth && !isAuthenticated) {
                    event.preventDefault();
                    event.stopPropagation();
                    onRequireAuth?.();
                    return;
                  }
                  rootProps.onClick?.(event);
                }}
                className={`flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-muted-foreground shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isDragActive ? "border-primary bg-primary/5 text-foreground" : "border-border/70 bg-transparent hover:border-foreground/30 hover:bg-muted/20 hover:text-foreground"}`}
                role="button"
                aria-label={t("fileUpload.addMore")}
                data-testid="button-add-more-files"
              >
                <input {...getInputProps()} data-testid="input-file" />
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">{isDragActive ? t("fileUpload.dropHere") : t("fileUpload.addMore")}</p>
              </Card>
            </div>
            {firstError && <p className="text-sm text-muted-foreground">{t("fileUpload.onlyProcessed")}</p>}
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => { discardPendingUploads(); setError(null); }} data-testid="button-cancel-upload-preview">{t("common.cancel")}</Button>
              <Button type="button" onClick={handleProceed} disabled={!canProceed} className="gap-2" data-testid="button-proceed-upload">{t("common.proceed")} <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <Card
              {...rootProps}
              onClick={(event) => {
                if (requireAuth && !isAuthenticated) {
                  event.preventDefault();
                  event.stopPropagation();
                  onRequireAuth?.();
                  return;
                }

                rootProps.onClick?.(event);
              }}
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
                    {isDragActive ? t("fileUpload.release") : t("fileUpload.uploadMaterials")}
                  </h3>
                  <p className="text-muted-foreground font-medium text-lg">
                    {t("fileUpload.dragDrop")} <span className="text-primary font-bold">{t("fileUpload.browse")}</span>
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
                  <p className="text-sm font-medium text-destructive">{t("fileUpload.failed")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="shrink-0"
                  data-testid="button-dismiss-error"
                >
                  {t("common.dismiss")}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
