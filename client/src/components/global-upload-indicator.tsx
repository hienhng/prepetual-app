import { useUpload } from "@/lib/upload-context";
import { useQuiz } from "@/lib/quiz-context";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
  const { activeJob, clearJob } = useUpload();
  const { setExtractedText, setSourceMaterial } = useQuiz();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (activeJob?.status === "completed" && activeJob.text) {
      const isImage = activeJob.fileType.startsWith("image/");
      const isPdf = activeJob.fileType === "application/pdf";
      const isOfficeDoc = activeJob.fileType.includes("wordprocessingml") || 
                          activeJob.fileType.includes("presentationml") || 
                          activeJob.fileType.includes("spreadsheetml") ||
                          activeJob.fileType === "application/msword" ||
                          activeJob.fileType === "application/vnd.ms-powerpoint" ||
                          activeJob.fileType === "application/vnd.ms-excel";

      setSourceMaterial({
        type: isImage ? "image" : isPdf ? "pdf" : isOfficeDoc ? "document" : null,
        text: activeJob.text,
        imageDataUrl: activeJob.imageDataUrl || null,
      });
      setExtractedText(activeJob.text);
    }
  }, [activeJob?.status, activeJob?.text, setSourceMaterial, setExtractedText, activeJob?.fileType, activeJob?.imageDataUrl]);

  if (!activeJob) return null;
  if (location === "/" && (activeJob.status === "pending" || activeJob.status === "processing")) {
    return null;
  }

  const isProcessing = activeJob.status === "pending" || activeJob.status === "processing";
  const isCompleted = activeJob.status === "completed";
  const isError = activeJob.status === "error";

  const handleGoToQuiz = () => {
    setLocation("/generate");
    clearJob();
  };

  const handleDismiss = () => {
    clearJob();
  };

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
              ${isProcessing ? "bg-primary/10" : isCompleted ? "bg-green-100 dark:bg-green-900/30" : "bg-destructive/10"}
            `}>
              {isProcessing && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
              {isCompleted && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
              {isError && <XCircle className="h-5 w-5 text-destructive" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {activeJob.fileName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeJob.message}
              </p>
              
              {isProcessing && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${activeJob.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{activeJob.progress}%</p>
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
              
              {isCompleted && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleGoToQuiz}>
                    Continue
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" data-testid="button-dismiss-upload">
                        Dismiss
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove document?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the document from the queue. You'll need to upload it again to use it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDismiss} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              
              {isError && (
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
