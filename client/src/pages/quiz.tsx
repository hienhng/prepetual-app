import { useLocation, useSearch } from "wouter";
import { AlertCircle, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizPlayer } from "@/components/quiz-player";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useQuizNavigationGuard } from "@/lib/quiz-navigation-guard";
import { useLanguage } from "@/lib/language-context";
import { getPendingImportQuestions } from "@shared/import-review";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const {
    currentQuiz,
    userAnswers,
    savedProgresses,
    isLoadingSavedProgresses,
    setCurrentQuiz,
    loadSavedProgress,
  } = useQuiz();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { navigateWithGuard } = useQuizNavigationGuard();
  const quizId = new URLSearchParams(search).get("id");
  const [hasLoadError, setHasLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const restoredProgressIdRef = useRef<string | null>(null);
  const savedProgress = quizId
    ? savedProgresses.find((progress) => progress.quizId === quizId)
    : undefined;

  useEffect(() => {
    if (!quizId) {
      setHasLoadError(false);
      return;
    }

    // The active session may contain answers newer than the server snapshot.
    // Never restore over it when the saved-progress query arrives or refetches.
    if (currentQuiz?.id === quizId) {
      setHasLoadError(false);
      return;
    }

    if (isLoadingSavedProgresses) return;

    const controller = new AbortController();
    setHasLoadError(false);
    if (savedProgress && restoredProgressIdRef.current !== quizId) {
      void loadSavedProgress(quizId, controller.signal).then(() => {
        if (!controller.signal.aborted) restoredProgressIdRef.current = quizId;
      }).catch(error => {
        if (controller.signal.aborted) return;
        console.error("Failed to restore saved progress:", error);
        setHasLoadError(true);
      });
      return () => controller.abort();
    }

    const loadQuiz = async () => {
      try {
        const response = await fetch(`/api/quiz/${encodeURIComponent(quizId)}`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch quiz details");

        const fullQuiz = await response.json();
        if (controller.signal.aborted) return;

        setCurrentQuiz({
          ...fullQuiz,
          createdAt: typeof fullQuiz.createdAt === "string"
            ? fullQuiz.createdAt
            : fullQuiz.createdAt.toISOString(),
        } as any);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load quiz details:", error);
        setHasLoadError(true);
      }
    };

    loadQuiz();
    return () => controller.abort();
  }, [currentQuiz?.id, isLoadingSavedProgresses, loadAttempt, quizId, savedProgress, loadSavedProgress]);

  useEffect(() => {
    if (quizId) return;

    // Only redirect if we're sure there's no quiz after a short delay
    // to allow the context to initialize/restore from session storage
    const timer = setTimeout(() => {
      if (!currentQuiz) {
        setLocation(user ? "/create" : "/", { replace: true });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentQuiz, quizId, setLocation, user]);

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
    navigateWithGuard(user ? "/dashboard" : "/");
  };

  if (quizId && currentQuiz?.id !== quizId) {
    if (hasLoadError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
            <h1 className="text-xl font-semibold">{t("quiz.loadErrorTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("quiz.loadError")}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setLocation(user ? "/dashboard" : "/")}>
                {t("common.back")}
              </Button>
              <Button onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
                {t("common.retry")}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
        data-testid="quiz-loading-screen"
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{t("quiz.loading")}</p>
      </div>
    );
  }

  if (!currentQuiz) {
    return null;
  }

  const pendingImports = getPendingImportQuestions(currentQuiz.questions);
  if (pendingImports.length) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center" data-testid="import-review-required">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-600" />
        <h1 className="text-xl font-semibold">{t("quiz.reviewImported")}</h1>
        <p className="my-4 text-muted-foreground">{t('quiz.reviewRequired', { total: currentQuiz.questions.length, count: pendingImports.length })}</p>
        {currentQuiz.userId === user?.id && <Button onClick={() => setLocation("/edit-quiz")}>{t("quiz.reviewQuestions")}</Button>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <QuizPlayer header={
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
            {t('quiz.back')}
          </Button>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-sm" data-testid="text-quiz-title">
              {currentQuiz.title}
            </span>
          </div>
        </motion.div>

      } />
    </div>
  );
}
