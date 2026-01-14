import { createContext, useContext, useState, useCallback, type ReactNode, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { useQuiz } from "@/lib/quiz-context";
import { LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { currentQuiz, resetQuiz, clearUserAnswers, userAnswers, saveCurrentProgress } = useQuiz();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const isQuizInProgress = location === "/quiz" && !!currentQuiz && Object.keys(userAnswers).length > 0;

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

  const handleQuitAndReset = () => {
    clearUserAnswers();
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

  return (
    <QuizNavigationGuardContext.Provider value={{ navigateWithGuard, isQuizInProgress, handleLinkClick }}>
      {children}
      <AlertDialog open={showExitDialog} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a quiz in progress. Would you like to save your progress for later or quit entirely?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancel} data-testid="button-cancel-nav-exit">
              Continue Quiz
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleSaveAndExit}
              className="gap-2"
              data-testid="button-save-nav-exit"
            >
              <Save className="h-4 w-4" />
              Save & Exit
            </Button>
            <AlertDialogAction
              onClick={handleQuitAndReset}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-quit-nav-reset"
            >
              <LogOut className="h-4 w-4" />
              Quit & Reset
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
