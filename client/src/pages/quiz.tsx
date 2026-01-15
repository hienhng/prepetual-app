import { useLocation } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizPlayer } from "@/components/quiz-player";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useQuizNavigationGuard } from "@/lib/quiz-navigation-guard";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const { currentQuiz, userAnswers } = useQuiz();
  const { user } = useAuth();
  const { navigateWithGuard } = useQuizNavigationGuard();

  useEffect(() => {
    if (!currentQuiz) {
      setLocation(user ? "/create" : "/");
    }
  }, [currentQuiz, setLocation, user]);

  // Handle browser back button and beforeunload
  useEffect(() => {
    const hasProgress = Object.keys(userAnswers).length > 0;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasProgress) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [userAnswers]);

  const handleBackClick = () => {
    // If we're going to dashboard, we want to ensure fresh data
    if (user) {
      window.location.href = "/dashboard";
    } else {
      navigateWithGuard("/");
    }
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
    </div>
  );
}
