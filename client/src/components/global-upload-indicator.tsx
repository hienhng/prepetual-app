import { useUpload } from "@/lib/upload-context";
import { useQuiz } from "@/lib/quiz-context";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, XCircle, Loader2, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
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

export function GlobalUploadIndicator() {
  const { activeJobs, clearJobs, isAllCompleted, isAnyProcessing, getCombinedText, getCombinedDocumentImages, hasOfficeWithImages, hasImageOnlyUploads } = useUpload();
  const { setExtractedText, setSourceMaterial, sourceMaterial } = useQuiz();
  const [location, setLocation] = useLocation();

  const completedJobs = activeJobs.filter(job => job.status === "completed");
  const processingJobs = activeJobs.filter(job => job.status === "pending" || job.status === "processing");
  const errorJobs = activeJobs.filter(job => job.status === "error");

  const overallProgress = activeJobs.length > 0 
    ? Math.round(activeJobs.reduce((sum, job) => sum + job.progress, 0) / activeJobs.length)
    : 0;

  useEffect(() => {
    if (isAllCompleted() && completedJobs.length > 0) {
      const combinedText = getCombinedText();
      const combinedImages = getCombinedDocumentImages();
      const hasImages = hasOfficeWithImages();
      const isImageOnly = hasImageOnlyUploads();

      if (isImageOnly) {
        // For image-only uploads (PNG/JPG), set special source material
        setSourceMaterial({
          type: "image",
          text: null,
          imageDataUrl: null,
          isOfficeWithImages: true,
          documentImages: combinedImages,
          isImageOnly: true,
        });
        setExtractedText("[Images uploaded - AI will analyze visually]");
      } else {
        setSourceMaterial({
          type: "document",
          text: combinedText,
          imageDataUrl: null,
          isOfficeWithImages: hasImages,
          documentImages: combinedImages,
          isImageOnly: false,
        });
        setExtractedText(combinedText);
      }
    }
  }, [isAllCompleted, completedJobs.length, getCombinedText, getCombinedDocumentImages, hasOfficeWithImages, hasImageOnlyUploads, setSourceMaterial, setExtractedText]);

  // Auto-dismiss when landing on generate page - but only after source material is captured
  useEffect(() => {
    // Only clear jobs after source material has been set with images
    const hasImageData = sourceMaterial.documentImages && sourceMaterial.documentImages.length > 0;
    const hasTextData = sourceMaterial.text && sourceMaterial.text.length > 0;
    const isImageOnlyReady = sourceMaterial.isImageOnly && hasImageData;
    const isDocumentReady = !sourceMaterial.isImageOnly && hasTextData;
    
    if (location === "/generate" && activeJobs.length > 0 && (isImageOnlyReady || isDocumentReady)) {
      clearJobs();
    }
  }, [location, activeJobs.length, clearJobs, sourceMaterial.documentImages, sourceMaterial.text, sourceMaterial.isImageOnly]);

  if (activeJobs.length === 0) return null;
  if (location === "/" && isAnyProcessing()) {
    return null;
  }

  const isProcessing = isAnyProcessing();
  const isCompleted = isAllCompleted() && completedJobs.length > 0;
  const hasErrors = errorJobs.length > 0;

  const handleGoToQuiz = () => {
    setLocation("/generate");
  };

  const handleDismiss = () => {
    clearJobs();
  };

  const displayName = activeJobs.length === 1 
    ? activeJobs[0].fileName 
    : `${activeJobs.length} files`;

  const displayMessage = isProcessing 
    ? `Processing ${processingJobs.length} of ${activeJobs.length} files...`
    : hasErrors && completedJobs.length > 0
    ? `${completedJobs.length} completed, ${errorJobs.length} failed`
    : hasErrors
    ? `${errorJobs.length} file(s) failed`
    : `${completedJobs.length} files ready`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-card border rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              ${isProcessing ? "bg-primary/10" : isCompleted && !hasErrors ? "bg-green-100 dark:bg-green-900/30" : "bg-destructive/10"}
            `}>
              {isProcessing && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
              {isCompleted && !hasErrors && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
              {hasErrors && <XCircle className="h-5 w-5 text-destructive" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate flex items-center gap-1.5">
                {activeJobs.length > 1 && <Files className="h-3.5 w-3.5" />}
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {displayMessage}
              </p>
              
              {isProcessing && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${overallProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{overallProgress}%</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" data-testid="button-cancel-upload">
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel upload?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel the document processing?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, keep it</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDismiss} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
              
              {isCompleted && !hasErrors && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleGoToQuiz}>
                    Continue
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} data-testid="button-dismiss-upload">
                    Dismiss
                  </Button>
                </div>
              )}
              
              {hasErrors && completedJobs.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleGoToQuiz}>
                    Continue with {completedJobs.length}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} data-testid="button-dismiss-upload">
                    Dismiss
                  </Button>
                </div>
              )}
              
              {hasErrors && completedJobs.length === 0 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="ghost" onClick={handleDismiss} data-testid="button-dismiss-error">
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
