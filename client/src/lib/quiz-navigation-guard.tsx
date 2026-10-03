import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";
import { useLocation } from "wouter";
import { useQuiz } from "@/lib/quiz-context";
import { useUpload } from "@/lib/upload-context";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/language-context";
import { Save, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuizNavigationGuardContextType {
  navigateWithGuard: (path: string) => void;
  isQuizInProgress: boolean;
  handleLinkClick: (e: ReactMouseEvent, path: string, callback?: () => void) => void;
}

const QuizNavigationGuardContext = createContext<QuizNavigationGuardContextType | undefined>(undefined);

export function QuizNavigationGuardProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { currentQuiz, sourceMaterial, setSourceMaterial, setExtractedText, saveCurrentProgress, getPlayerProgress, userAnswers, checkedQuestions, playerRetryAnswers, resetQuiz } = useQuiz();
  const { activeJobs, clearJobs } = useUpload();
  const { user } = useAuth();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const hasAddedHistoryEntry = useRef(false);
  
  // Guests cannot save progress, so skip the guard entirely
  const isGuest = !user;
  const canPersistProgress = !!user && !!currentQuiz && currentQuiz.userId === user.id && currentQuiz.generationMode !== "review";
  const isQuizRoute = location === "/quiz";
  const isCreateRoute = location === "/create";
  const hasCreateMaterials = isCreateRoute && Boolean(
    sourceMaterial.uploadedText?.trim()
    || sourceMaterial.manualText?.trim()
    || sourceMaterial.youtubeTranscript?.trim()
    || sourceMaterial.prompt?.trim()
    || sourceMaterial.imageDataUrl
    || sourceMaterial.documentImages?.length
    || activeJobs.length,
  );

  // Show dialog if user is on quiz page with an active quiz that has any answers (only for authenticated users)
  const isQuizInProgress = !isGuest && isQuizRoute && !!currentQuiz && Object.keys(userAnswers).length > 0;
  
  // Check if user is in revision mode (completed first attempt with wrong answers)
  const isInRevisionMode = useMemo(() => {
    if (!currentQuiz || !isQuizRoute) return false;
    
    const questions = currentQuiz.questions || [];
    const totalQuestions = questions.length;
    const checkedCount = checkedQuestions.size;
    
    // Must have completed first attempt (all questions checked)
    const hasCompletedFirstAttempt = checkedCount >= totalQuestions && totalQuestions > 0;
    if (!hasCompletedFirstAttempt) return false;
    
    // Check if there are wrong answers
    let wrongCount = 0;
    for (const q of questions) {
      const userAnswer = userAnswers[q.id];
      if (userAnswer && userAnswer.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim()) {
        wrongCount++;
      }
    }
    
    // Check if there's any retry progress in session
    const hasRetryProgress = Object.keys(playerRetryAnswers).length > 0;
    
    return (hasCompletedFirstAttempt && wrongCount > 0) || hasRetryProgress;
  }, [currentQuiz, location, userAnswers, checkedQuestions, playerRetryAnswers]);

  const isReviewSession = currentQuiz?.generationMode === 'review';

  // Handle browser back button
  useEffect(() => {
    const shouldGuardNavigation = isQuizInProgress || hasCreateMaterials;
    if (shouldGuardNavigation && !hasAddedHistoryEntry.current) {
      // Push an extra history entry so we can intercept back button
      window.history.pushState({ quizGuard: true }, "", window.location.href);
      hasAddedHistoryEntry.current = true;
    }

    if (!shouldGuardNavigation) {
      hasAddedHistoryEntry.current = false;
    }

    const handlePopState = (e: PopStateEvent) => {
      if (shouldGuardNavigation) {
        // Re-push the history entry to prevent navigation
        window.history.pushState({ quizGuard: true }, "", window.location.href);
        // Show the dialog
        setPendingPath("/dashboard");
        setShowExitDialog(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isQuizInProgress, hasCreateMaterials]);

  useEffect(() => {
    if (!hasCreateMaterials) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleDocumentNavigation = (event: globalThis.MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement) || target.target === "_blank" || target.hasAttribute("download")) return;

      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === "/create") return;

      event.preventDefault();
      event.stopPropagation();
      setPendingPath(`${destination.pathname}${destination.search}${destination.hash}`);
      setShowExitDialog(true);
    };
    const handlePageHide = () => {
      sessionStorage.removeItem("source_material");
      sessionStorage.removeItem("extracted_text");
      sessionStorage.removeItem("upload_jobs");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("click", handleDocumentNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("click", handleDocumentNavigation, true);
    };
  }, [hasCreateMaterials]);

  const navigateWithGuard = useCallback((path: string) => {
    if ((isQuizInProgress && path !== "/quiz" && path !== "/quiz-results") || (hasCreateMaterials && path !== "/create")) {
      setPendingPath(path);
      setShowExitDialog(true);
    } else {
      setLocation(path);
    }
  }, [isQuizInProgress, hasCreateMaterials, setLocation]);

  const handleLinkClick = useCallback((e: ReactMouseEvent, path: string, callback?: () => void) => {
    if ((isQuizInProgress && path !== "/quiz" && path !== "/quiz-results") || (hasCreateMaterials && path !== "/create")) {
      e.preventDefault();
      setPendingPath(path);
      setShowExitDialog(true);
    } else {
      callback?.();
    }
  }, [isQuizInProgress, hasCreateMaterials]);

  const clearCreateMaterials = useCallback(async () => {
    setSourceMaterial({
      type: null,
      text: null,
      imageDataUrl: null,
      uploadedText: null,
      manualText: null,
      youtubeTranscript: null,
      youtubeUrl: null,
      prompt: null,
      isOfficeWithImages: false,
      documentImages: [],
      isImageOnly: false,
      autoGenerate: false,
    });
    setExtractedText("");
    await clearJobs();
  }, [clearJobs, setExtractedText, setSourceMaterial]);

  const handleDiscardCreateAndExit = async () => {
    const destination = pendingPath;
    setShowExitDialog(false);
    setPendingPath(null);
    await clearCreateMaterials();
    if (destination) setLocation(destination);
  };

  const handleSaveAndExit = () => {
    // Pass explicit player progress to ensure revision state is saved correctly
    saveCurrentProgress(getPlayerProgress());
    setShowExitDialog(false);
    if (pendingPath) {
      setLocation(pendingPath);
      setPendingPath(null);
    }
  };

  const handleDiscardExit = () => {
    resetQuiz();
    setShowExitDialog(false);
    if (pendingPath) {
      setLocation(pendingPath);
      setPendingPath(null);
    }
  };

  const handleCancel = () => {
    setShowExitDialog(false);
    setPendingPath(null);
  };

  // For revision mode: save progress including revision state before exiting
  const handleExitRevision = () => {
    // Pass explicit player progress to ensure revision state is saved correctly
    saveCurrentProgress(getPlayerProgress());
    setShowExitDialog(false);
    if (pendingPath) {
      setLocation(pendingPath);
      setPendingPath(null);
    }
  };

  return (
    <QuizNavigationGuardContext.Provider value={{ navigateWithGuard, isQuizInProgress, handleLinkClick }}>
      {children}
      <AlertDialog open={showExitDialog} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent data-testid={hasCreateMaterials ? "dialog-create-exit" : isReviewSession ? "dialog-review-exit" : isInRevisionMode ? "dialog-revision-exit-warning" : "dialog-quiz-exit"}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {hasCreateMaterials ? t('navigationGuard.leaveCreate') : isReviewSession ? t('navigationGuard.discardReview') : !canPersistProgress ? t('navigationGuard.leaveQuiz') : isInRevisionMode ? t('navigationGuard.saveRevision') : t('navigationGuard.leaveQuiz')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasCreateMaterials
                ? t('navigationGuard.leaveCreateDescription')
                : isReviewSession 
                ? t('navigationGuard.discardReviewDescription')
                : !canPersistProgress
                  ? t('navigationGuard.unsavedQuizDescription')
                  : isInRevisionMode 
                  ? t('navigationGuard.saveRevisionDescription')
                  : t('navigationGuard.saveQuizDescription')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancel} data-testid="button-cancel-nav-exit">
              {hasCreateMaterials ? t('navigationGuard.stayOnCreate') : isReviewSession || !canPersistProgress ? t('navigationGuard.continueQuiz') : isInRevisionMode ? t('dashboard.keepRevising') : t('navigationGuard.continueQuiz')}
            </AlertDialogCancel>
            
            {hasCreateMaterials ? (
              <AlertDialogAction
                onClick={handleDiscardCreateAndExit}
                className="gap-2 bg-destructive text-destructive-foreground border-destructive/10 shadow-destructive/70 hover:bg-destructive/90"
                data-testid="button-discard-create"
              >
                <Trash2 className="h-4 w-4" />
                {t('navigationGuard.discardAndLeave')}
              </AlertDialogAction>
            ) : isReviewSession || !canPersistProgress ? (
              <AlertDialogAction
                onClick={handleDiscardExit}
                className="bg-destructive text-destructive-foreground border-destructive/10 shadow-destructive/70 hover:bg-destructive/90"
                data-testid={isReviewSession ? "button-discard-review" : "button-discard-public-quiz"}
              >
                {t('navigationGuard.discardAndExit')}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={isInRevisionMode ? handleExitRevision : handleSaveAndExit}
                className="gap-2"
                data-testid={isInRevisionMode ? "button-confirm-revision-exit" : "button-save-nav-exit"}
              >
                <Save className="h-4 w-4" />
                {t('navigationGuard.saveAndExit')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </QuizNavigationGuardContext.Provider>
  );
}

export function useQuizNavigationGuard() {
  const context = useContext(QuizNavigationGuardContext);
  if (!context) {
    throw new Error("useQuizNavigationGuard must be used within QuizNavigationGuardProvider");
  }
  return context;
}
