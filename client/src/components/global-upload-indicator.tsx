import { useLanguage } from "@/lib/language-context";
import { useUpload } from "@/lib/upload-context";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
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
  const { t } = useLanguage();
  const { activeJobs: allJobs, discardPendingUploads } = useUpload();
  const [location, setLocation] = useLocation();
  const activeJobs = allJobs.filter(job => job.accepted === false);
  const completedJobs = activeJobs.filter(job => job.status === "completed");
  const processingJobs = activeJobs.filter(job => job.status === "pending" || job.status === "processing");
  const errorJobs = activeJobs.filter(job => job.status === "error");
  const overallProgress = activeJobs.length > 0
    ? Math.round(activeJobs.reduce((sum, job) => sum + job.progress, 0) / activeJobs.length)
    : 0;

  // The upload surfaces provide their own progress and confirmation controls.
  if (activeJobs.length === 0 || location === "/" || location === "/create") return null;

  const isProcessing = processingJobs.length > 0;
  const isCompleted = !isProcessing && completedJobs.length > 0;
  const hasErrors = errorJobs.length > 0;
  const handleReviewFiles = () => setLocation("/create");
  const handleDismiss = () => { discardPendingUploads(); };

  const displayName = activeJobs.length === 1 
    ? activeJobs[0].fileName 
    : t('fileUpload.filesCount', { count: activeJobs.length });

  const displayMessage = isProcessing 
    ? t('fileUpload.processingCount', { current: processingJobs.length, total: activeJobs.length })
    : hasErrors && completedJobs.length > 0
    ? t('fileUpload.completedFailed', { completed: completedJobs.length, failed: errorJobs.length })
    : hasErrors
    ? t('fileUpload.failedCount', { count: errorJobs.length })
    : t('fileUpload.readyCount', { count: completedJobs.length });

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
                          {t("common.cancel")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("fileUpload.cancelUpload")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("fileUpload.cancelDescription")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("fileUpload.keep")}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDismiss} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t("fileUpload.confirmCancel")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
              
              {isCompleted && !hasErrors && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleReviewFiles}>
                    {t("fileUpload.reviewFiles")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} data-testid="button-dismiss-upload">
                    {t("common.dismiss")}
                  </Button>
                </div>
              )}
              
              {hasErrors && completedJobs.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleReviewFiles}>
                    {t('fileUpload.reviewCount', { count: completedJobs.length })}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} data-testid="button-dismiss-upload">
                    {t("common.dismiss")}
                  </Button>
                </div>
              )}
              
              {hasErrors && completedJobs.length === 0 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="ghost" onClick={handleDismiss} data-testid="button-dismiss-error">
                    {t("common.dismiss")}
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
