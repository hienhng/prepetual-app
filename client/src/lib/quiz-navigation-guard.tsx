import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { useQuiz } from "@/lib/quiz-context";
import { Save, AlertTriangle } from "lucide-react";
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
  handleLinkClick: (e: MouseEvent, path: string, callback?: () => void) => void;
}

const QuizNavigationGuardContext = createContext<QuizNavigationGuardContextType | undefined>(undefined);

export function QuizNavigationGuardProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { currentQuiz, hasUnsavedChanges, saveCurrentProgress, userAnswers, checkedQuestions, playerRetryAnswers } = useQuiz();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const hasAddedHistoryEntry = useRef(false);

  // Only show dialog if there are new unsaved answers
  const isQuizInProgress = location === "/quiz" && !!currentQuiz && hasUnsavedChanges;
  
  // Check if user is in revision mode (completed first attempt with wrong answers)
  const isInRevisionMode = useMemo(() => {
    if (!currentQuiz || location !== "/quiz") return false;
    
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

  // Handle browser back button
  useEffect(() => {
    if (isQuizInProgress && !hasAddedHistoryEntry.current) {
      // Push an extra history entry so we can intercept back button
      window.history.pushState({ quizGuard: true }, "", window.location.href);
      hasAddedHistoryEntry.current = true;
    }

    if (!isQuizInProgress) {
      hasAddedHistoryEntry.current = false;
    }

    const handlePopState = (e: PopStateEvent) => {
      if (isQuizInProgress) {
        // Re-push the history entry to prevent navigation
        window.history.pushState({ quizGuard: true }, "", window.location.href);
        // Show the dialog
        setPendingPath("/dashboard");
        setShowExitDialog(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isQuizInProgress]);

  const navigateWithGuard = useCallback((path: string) => {
    if (isQuizInProgress && path !== "/quiz" && path !== "/results") {
      setPendingPath(path);
      setShowExitDialog(true);
    } else {
      setLocation(path);
    }
  }, [isQuizInProgress, setLocation]);

  const handleLinkClick = useCallback((e: MouseEvent, path: string, callback?: () => void) => {
    if (isQuizInProgress && path !== "/quiz" && path !== "/results") {
      e.preventDefault();
      setPendingPath(path);
      setShowExitDialog(true);
    } else {
      callback?.();
    }
  }, [isQuizInProgress]);

  const handleSaveAndExit = () => {
    saveCurrentProgress();
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

  // For revision mode: just exit without saving (retry progress is session-only)
  const handleExitRevision = () => {
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
        <AlertDialogContent data-testid={isInRevisionMode ? "dialog-revision-exit-warning" : "dialog-quiz-exit"}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isInRevisionMode && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {isInRevisionMode ? "Exit Revision Mode?" : "Leave Quiz?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isInRevisionMode 
                ? "You're currently revising incorrect answers. If you exit now, your revision progress will be lost, but your original answers will be preserved."
                : "You have a quiz in progress. Would you like to save your progress for later?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancel} data-testid="button-cancel-nav-exit">
              {isInRevisionMode ? "Keep Revising" : "Continue Quiz"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={isInRevisionMode ? handleExitRevision : handleSaveAndExit}
              className={isInRevisionMode ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2" : "gap-2"}
              data-testid={isInRevisionMode ? "button-confirm-revision-exit" : "button-save-nav-exit"}
            >
              {isInRevisionMode ? (
                <>Exit and Lose Revision Progress</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save & Exit
                </>
              )}
            </AlertDialogAction>
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
