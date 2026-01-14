import { useLocation } from "wouter";
import { ArrowLeft, FileText, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizPlayer } from "@/components/quiz-player";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
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

export default function Quiz() {
  const [, setLocation] = useLocation();
  const { currentQuiz, resetQuiz, clearUserAnswers } = useQuiz();
  const { user } = useAuth();
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    if (!currentQuiz) {
      setLocation(user ? "/create" : "/");
    }
  }, [currentQuiz, setLocation, user]);

  // Handle browser back button and beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleBackClick = () => {
    setShowExitDialog(true);
  };

  const handleSaveAndExit = () => {
    // Keep quiz progress in context, just navigate away
    setShowExitDialog(false);
    setLocation(user ? "/dashboard" : "/");
  };

  const handleQuitAndReset = () => {
    // Clear all progress and reset
    clearUserAnswers();
    resetQuiz();
    setShowExitDialog(false);
    setLocation(user ? "/dashboard" : "/");
  };

  if (!currentQuiz) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="gap-2"
            data-testid="button-back-generate"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-sm" data-testid="text-quiz-title">
              {currentQuiz.title}
            </span>
          </div>
        </motion.div>

        <QuizPlayer />
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a quiz in progress. Would you like to save your progress for later or quit entirely?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel data-testid="button-cancel-exit">
              Continue Quiz
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleSaveAndExit}
              className="gap-2"
              data-testid="button-save-exit"
            >
              <Save className="h-4 w-4" />
              Save & Exit
            </Button>
            <AlertDialogAction
              onClick={handleQuitAndReset}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-quit-reset"
            >
              <LogOut className="h-4 w-4" />
              Quit & Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
