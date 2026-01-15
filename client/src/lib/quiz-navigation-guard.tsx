import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { useQuiz } from "@/lib/quiz-context";
import { Save } from "lucide-react";
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
  const { currentQuiz, userAnswers, saveCurrentProgress } = useQuiz();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const hasAddedHistoryEntry = useRef(false);

  const isQuizInProgress = location === "/quiz" && !!currentQuiz && Object.keys(userAnswers).length > 0;

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

  return (
    <QuizNavigationGuardContext.Provider value={{ navigateWithGuard, isQuizInProgress, handleLinkClick }}>
      {children}
      <AlertDialog open={showExitDialog} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a quiz in progress. Would you like to save your progress for later?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancel} data-testid="button-cancel-nav-exit">
              Continue Quiz
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveAndExit}
              className="gap-2"
              data-testid="button-save-nav-exit"
            >
              <Save className="h-4 w-4" />
              Save & Exit
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
