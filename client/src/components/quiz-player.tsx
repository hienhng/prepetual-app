import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Check, X, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCheck, RotateCcw, Zap, Trophy, Target, ChevronUp, ChevronDown, Star, Flame, BadgeCheck, BookCheck, Lock, MessageCircle, Lightbulb, AlertCircle, ZoomIn, FileImage, FileText, ChevronLeft, ChevronRight, Image, Flag, AlertTriangle, Clock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarOptional } from "@/components/ui/sidebar";
import { useLanguage } from "@/lib/language-context";
import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "@shared/schema";
import confetti from "canvas-confetti";
import { QuizChatbot, CutePenguin } from "@/components/quiz-chatbot";
import { MathText } from "@/components/formatted-text";

const getEncouragingMessages = (t: any) => ({
  correct: [
    t('quizPlayer.messages.correct.0'),
    t('quizPlayer.messages.correct.1'),
    t('quizPlayer.messages.correct.2'),
    t('quizPlayer.messages.correct.3'),
    t('quizPlayer.messages.correct.4'),
    t('quizPlayer.messages.correct.5'),
    t('quizPlayer.messages.correct.6'),
    t('quizPlayer.messages.correct.7'),
  ],
  retryCorrect: [
    t('quizPlayer.messages.retryCorrect.0'),
    t('quizPlayer.messages.retryCorrect.1'),
    t('quizPlayer.messages.retryCorrect.2'),
    t('quizPlayer.messages.retryCorrect.3'),
    t('quizPlayer.messages.retryCorrect.4'),
    t('quizPlayer.messages.retryCorrect.5'),
    t('quizPlayer.messages.retryCorrect.6'),
    t('quizPlayer.messages.retryCorrect.7'),
  ],
  incorrect: [
    t('quizPlayer.messages.incorrect.0'),
    t('quizPlayer.messages.incorrect.1'),
    t('quizPlayer.messages.incorrect.2'),
    t('quizPlayer.messages.incorrect.3'),
    t('quizPlayer.messages.incorrect.4'),
  ],
  streak: [
    t('quizPlayer.messages.streak.0'),
    t('quizPlayer.messages.streak.1'),
    t('quizPlayer.messages.streak.2'),
    t('quizPlayer.messages.streak.3'),
  ],
});

const getRandomMessage = (type: "correct" | "incorrect" | "retryCorrect", t: any) => {
  const messages = getEncouragingMessages(t)[type];
  return messages[Math.floor(Math.random() * messages.length)];
};

const getStreakMessage = (streak: number, t: any) => {
  const messages = getEncouragingMessages(t).streak;
  if (streak < 2) return null;
  if (streak === 2) return messages[0];
  if (streak === 3) return messages[1];
  if (streak === 4) return messages[2];
  return messages[3];
};

import { ThemeToggle } from "@/components/theme-toggle";

export function QuizPlayer() {
  const [, setLocation] = useLocation();
  const { 
    currentQuiz, 
    userAnswers, 
    setUserAnswer, 
    setQuizResult, 
    sourceMaterial, 
    setRevisedQuestionsCount, 
    setRetryCorrectCount, 
    checkedQuestions, 
    markQuestionChecked,
    restoredCurrentIndex,
    restoredRetryAnswers,
    restoredRetryCheckedQuestions,
    clearRestoredState,
    syncPlayerState,
    timeTaken,
    quizResult,
  } = useQuiz();
  const { t } = useLanguage();
  const { user } = useAuth();
  const sidebarContext = useSidebarOptional();
  const sidebarState = sidebarContext?.state ?? "expanded";
  const isMobile = sidebarContext?.isMobile ?? false;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [correctStreak, setCorrectStreak] = useState(0);
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, { message: string; streakAtTime: number }>>({}); 
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [aiGradingResults, setAiGradingResults] = useState<Record<string, { isCorrect: boolean; isPartial: boolean; explanation: string; wrongExplanation?: string }>>({});
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState<Record<string, boolean>>({});
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<string>("Correct answer is wrong");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { toast } = useToast();
  
  const wrongAnswerIds = useRef<Set<string>>(new Set());
  const [retryAnswers, setRetryAnswers] = useState<Record<string, string>>({});
  const [retryChecked, setRetryChecked] = useState<Set<string>>(new Set());
  const hasRestoredRef = useRef(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  const [sessionTime, setSessionTime] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const isFinished = !!quizResult;
  
  const isGuest = !user;

  if (!currentQuiz) {
    return null;
  }
  
  // Initialize from restored state on mount (from saved progress) - only for authenticated users
  useEffect(() => {
    if (hasRestoredRef.current || !currentQuiz || isGuest) {
      if (quizResult && !hasRestoredRef.current) {
        setQuizResult(null);
      }
      return;
    }
    
    // Clear any stale results when starting/resuming a quiz session
    if (quizResult) {
      setQuizResult(null);
    }
    
    // Derive wrongAnswerIds from userAnswers by comparing to correct answers
    // This handles both: 1) Legacy progress without retry state, 2) Fresh restore with explicit state
    const questions = currentQuiz.questions;
    const derivedWrongIds = new Set<string>();
    
    for (const q of questions) {
      const userAnswer = userAnswers[q.id];
      if (userAnswer && checkedQuestions.has(q.id)) {
        const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
        if (!isCorrect) {
          derivedWrongIds.add(q.id);
        }
      }
    }
    
    // Also include original question IDs from restored retry answers (keys are "retry-{originalId}")
    if (restoredRetryAnswers) {
      for (const retryKey of Object.keys(restoredRetryAnswers)) {
        if (retryKey.startsWith("retry-")) {
          const originalId = retryKey.replace("retry-", "");
          derivedWrongIds.add(originalId);
        }
      }
    }
    
    // Populate wrongAnswerIds from derived + restored state
    wrongAnswerIds.current = derivedWrongIds;
    
    // Restore retry state if available
    if (restoredRetryAnswers && Object.keys(restoredRetryAnswers).length > 0) {
      setRetryAnswers(restoredRetryAnswers);
    }
    
    if (restoredRetryCheckedQuestions && restoredRetryCheckedQuestions.length > 0) {
      setRetryChecked(new Set(restoredRetryCheckedQuestions));
    }
    
    // Restore current index if available
    if (restoredCurrentIndex !== null || restoredRetryAnswers) {
      setCurrentIndex(restoredCurrentIndex || 0);
      setSessionTime(timeTaken || 0);
    }
    
    hasRestoredRef.current = true;
    clearRestoredState(currentQuiz.id);
  }, [currentQuiz, userAnswers, checkedQuestions, restoredCurrentIndex, restoredRetryAnswers, restoredRetryCheckedQuestions, clearRestoredState, isGuest, timeTaken, quizResult, setQuizResult]);

  // Sync player state to context for save functionality (only for authenticated users)
  useEffect(() => {
    if (!isGuest) {
      syncPlayerState(currentIndex, retryAnswers, Array.from(retryChecked), sessionTime);
    }
  }, [currentIndex, retryAnswers, retryChecked, syncPlayerState, isGuest, sessionTime]);

  // Timer logic
  useEffect(() => {
    if (isFinished || isSubmitting) return;
    
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setSessionTime(prev => prev + 1);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isFinished, isSubmitting]);

  // Cleanup: reset hasRestoredRef when quiz changes (to allow fresh restoration)
  useEffect(() => {
    return () => {
      hasRestoredRef.current = false;
    };
  }, [currentQuiz?.id]);

  const originalQuestions = currentQuiz.questions;
  
  const skipRevision = user?.skipRevisionQuestions === true;
  
  const allQuestions = useMemo(() => {
    // Only registered users get a 2nd attempt for wrong answers (unless they've disabled revision)
    const shouldIncludeRetry = !isGuest && !skipRevision;
    const wrongQuestions = shouldIncludeRetry ? originalQuestions.filter(q => wrongAnswerIds.current.has(q.id)) : [];
    const retryQuestions = wrongQuestions.map(q => ({
      ...q,
      id: `retry-${q.id}`,
      originalId: q.id,
      isRetry: true as const,
    }));
    return [...originalQuestions.map(q => ({ ...q, isRetry: false as const, originalId: q.id })), ...retryQuestions];
  }, [originalQuestions, wrongAnswerIds.current.size, isGuest, skipRevision]);

  const currentQuestion = allQuestions[currentIndex];
  const isRetryQuestion = currentQuestion?.isRetry;
  const originalQuestionCount = originalQuestions.length;
  
  const mainProgress = Math.min(currentIndex + 1, originalQuestionCount);
  const progress = (mainProgress / originalQuestionCount) * 100;
  
  const selectedAnswer = currentQuestion?.isRetry 
    ? retryAnswers[currentQuestion.id] 
    : userAnswers[currentQuestion?.originalId];
    
  const isChecked = currentQuestion?.isRetry 
    ? retryChecked.has(currentQuestion.id)
    : checkedQuestions.has(currentQuestion?.originalId);

  const isCorrectAnswer = (answer: string | undefined, question: typeof currentQuestion) => {
    if (!answer || !question) return false;
    if (question.type === "short_answer") {
      const gradeKey = question.isRetry ? question.id : question.originalId;
      const grading = aiGradingResults[gradeKey];
      if (grading) return grading.isCorrect;
      return false;
    }
    const normalizedUser = answer.toLowerCase().trim();
    const normalizedCorrect = question.correctAnswer.toLowerCase().trim();
    return normalizedUser === normalizedCorrect;
  };

  const isCorrect = () => {
    return isCorrectAnswer(selectedAnswer, currentQuestion);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#4255FF', '#9C27B0', '#00C853', '#FFD700'],
    });
  };

  const handleSelectAnswer = (answer: string) => {
    if (isChecked) return;
    if (currentQuestion.isRetry) {
      setRetryAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    } else {
      setUserAnswer(currentQuestion.originalId, answer);
    }
  };

  const handleShortAnswerChange = (value: string) => {
    if (isChecked) return;
    setShortAnswerInput(value);
  };

  const applyCheckResult = (correct: boolean, answerToCheck: string | undefined, qSnap: typeof currentQuestion) => {
    let newStreak = correctStreak;
    let message = "";

    if (correct) {
      newStreak = correctStreak + 1;
       setCorrectStreak(newStreak);

      if (qSnap.isRetry) {
        message = getRandomMessage("retryCorrect", t);
      } else {
        message = getStreakMessage(newStreak, t) || getRandomMessage("correct", t);
      }

      if (newStreak >= 3 && user?.consecutiveCorrectConfetti === true) {
        triggerConfetti();
      }
     } else {
      setCorrectStreak(0);
      message = getRandomMessage("incorrect", t);
    }

    setFeedbackMessages(prev => ({
      ...prev,
      [qSnap.id]: { message, streakAtTime: correct ? newStreak : 0 }
    }));

    if (qSnap.isRetry) {
      setRetryChecked(prev => new Set(prev).add(qSnap.id));
    } else {
      markQuestionChecked(qSnap.originalId);
      if (!correct) {
        wrongAnswerIds.current.add(qSnap.originalId);
      }
    }

    const keysToExpand: string[] = [];
    if (qSnap.type === "true_false") {
      const correctOption = qSnap.correctAnswer.toLowerCase() === "true" ? "True" : "False";
      keysToExpand.push(`${qSnap.id}-tf-${correctOption}`);
      if (!correct && answerToCheck) {
        keysToExpand.push(`${qSnap.id}-tf-${answerToCheck}`);
      }
    } else if (qSnap.type === "short_answer") {
      keysToExpand.push(`${qSnap.id}-short-answer`);
    } else if (qSnap.options && qSnap.explanation && (!isGuest || qSnap.isRetry)) {
      qSnap.options.forEach((opt, idx) => {
        const isCorrectOpt = opt.toLowerCase().trim() === qSnap.correctAnswer.toLowerCase().trim();
        const isSelectedWrong = opt === answerToCheck && !correct;
        if (isCorrectOpt || isSelectedWrong) {
          keysToExpand.push(`${qSnap.id}-${idx}`);
        }
      });
    }

    if (keysToExpand.length > 0) {
      setExpandedExplanations(prev => {
        const next = new Set(prev);
        keysToExpand.forEach(key => next.add(key));
        return next;
      });

      // Automatically trigger explanation generation when answer is checked
      keysToExpand.forEach(key => {
        let optionText = "";
        let isCorrectOpt = false;

        if (qSnap.type === "true_false") {
          optionText = key.includes("-tf-True") ? "True" : "False";
          isCorrectOpt = optionText.toLowerCase() === qSnap.correctAnswer.toLowerCase();
        } else if (qSnap.type === "multiple_choice") {
          const optIdx = parseInt(key.split("-").pop() || "0");
          optionText = qSnap.options?.[optIdx] || "";
          isCorrectOpt = optionText.toLowerCase().trim() === qSnap.correctAnswer.toLowerCase().trim();
        }

        if (optionText) {
          fetchExplanationIfMissing(key, optionText, isCorrectOpt, qSnap, answerToCheck);
        }
      });
    }
  };

  const handleCheck = async () => {
    let answerToCheck = selectedAnswer;
    const questionSnapshot = { ...currentQuestion };

    if (questionSnapshot.type === "short_answer" && shortAnswerInput.trim()) {
      answerToCheck = shortAnswerInput.trim();
      if (questionSnapshot.isRetry) {
        setRetryAnswers(prev => ({ ...prev, [questionSnapshot.id]: answerToCheck! }));
      } else {
        setUserAnswer(questionSnapshot.originalId, answerToCheck);
      }
    }

    if (answerToCheck || (questionSnapshot.type === "short_answer" && shortAnswerInput.trim())) {
      const questionKey = questionSnapshot.id;

      if (questionSnapshot.type === "short_answer") {
        setIsGrading(true);
        try {
          const res = await fetch("/api/grade-short-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: questionSnapshot.question,
              correctAnswer: questionSnapshot.correctAnswer,
              userAnswer: answerToCheck,
              sourceText: sourceMaterial?.text || (currentQuiz as any)?.sourceText || "",
              userPreferences: user,
            }),
          });

          if (!res.ok) throw new Error("Grading failed");

          const grading = await res.json();
          const gradeKey = questionSnapshot.isRetry ? questionSnapshot.id : questionSnapshot.originalId;

          setAiGradingResults(prev => ({
            ...prev,
            [gradeKey]: {
              isCorrect: grading.isCorrect,
              isPartial: grading.isPartial,
              explanation: grading.explanation,
            },
          }));

          applyCheckResult(grading.isCorrect, answerToCheck, questionSnapshot);
        } catch {
          const normalizedUser = (answerToCheck || "").toLowerCase().trim();
          const normalizedCorrect = questionSnapshot.correctAnswer.toLowerCase().trim();
          const fallbackCorrect = normalizedUser === normalizedCorrect;
          const gradeKey = questionSnapshot.isRetry ? questionSnapshot.id : questionSnapshot.originalId;

          setAiGradingResults(prev => ({
            ...prev,
            [gradeKey]: {
              isCorrect: fallbackCorrect,
              isPartial: false,
               explanation: fallbackCorrect
                ? t('quizPlayer.shortAnswerFallbackCorrect')
                : t('quizPlayer.shortAnswerFallbackIncorrect', { expected: questionSnapshot.correctAnswer }),
            },
          }));

          applyCheckResult(fallbackCorrect, answerToCheck, questionSnapshot);
        } finally {
          setIsGrading(false);
        }
      } else {
        const correct = isCorrectAnswer(answerToCheck, questionSnapshot);
        applyCheckResult(correct, answerToCheck, questionSnapshot);
      }
    }
  };

  const fetchExplanationIfMissing = async (
    explanationKey: string, 
    option: string, 
    isCorrectOpt: boolean, 
    qSnap: any, 
    ansToCheck: string | undefined
  ) => {
    const gradeKey = qSnap.isRetry ? qSnap.id : qSnap.originalId;
    const aiExplanation = aiGradingResults[gradeKey];
    const currentExplanation = qSnap.explanation || aiExplanation?.explanation;
    
    // Use the component's getWrongAnswerExplanation with the provided qSnap context
    const getWrongExplanationForQ = (answer: string | undefined) => {
      if (!answer || !qSnap.wrongAnswerExplanations) return null;
      const answerWithoutPrefix = answer.replace(/^[A-D]\)\s*/, "").trim();
      return qSnap.wrongAnswerExplanations[answer] || qSnap.wrongAnswerExplanations[answerWithoutPrefix];
    };

    const currentWrongExplanation = qSnap.wrongAnswerExplanations && Object.keys(qSnap.wrongAnswerExplanations).length > 0
      ? getWrongExplanationForQ(option)
      : (ansToCheck === option ? aiExplanation?.wrongExplanation : null);

    const neededExplanation = isCorrectOpt ? currentExplanation : currentWrongExplanation;
    if (neededExplanation) return;

    setIsGeneratingExplanation(prev => ({ ...prev, [explanationKey]: true }));
    try {
      const res = await fetch("/api/generate-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: qSnap.question,
          options: qSnap.options,
          correctAnswer: qSnap.correctAnswer,
          selectedAnswer: ansToCheck,
          isCorrect: isCorrectAnswer(ansToCheck, qSnap),
          sourceText: sourceMaterial?.text || (currentQuiz as any)?.sourceText || "",
          userPreferences: user,
        }),
      });

      if (res.ok) {
        const grading = await res.json();
        
        setAiGradingResults(prev => ({
          ...prev,
          [gradeKey]: {
            ...prev[gradeKey],
            isCorrect: prev[gradeKey]?.isCorrect ?? isCorrectAnswer(ansToCheck, qSnap),
            isPartial: prev[gradeKey]?.isPartial ?? false,
            explanation: grading.explanation,
            wrongExplanation: grading.wrongExplanation,
          },
        }));
        
        qSnap.explanation = grading.explanation;
        if (!qSnap.wrongAnswerExplanations) {
          qSnap.wrongAnswerExplanations = {};
        }
        if (ansToCheck) {
          qSnap.wrongAnswerExplanations[ansToCheck.replace(/^[A-D]\)\s*/, "").trim()] = grading.wrongExplanation;
        }
      }
    } catch (error) {
      console.error("Failed to fetch explanation:", error);
    } finally {
      setIsGeneratingExplanation(prev => ({ ...prev, [explanationKey]: false }));
    }
  };

  const handleToggleExplanation = async (explanationKey: string, option: string, isCorrectOpt: boolean) => {
    if (expandedExplanations.has(explanationKey)) {
      toggleExplanation(explanationKey);
      return;
    }

    toggleExplanation(explanationKey);
    await fetchExplanationIfMissing(explanationKey, option, isCorrectOpt, currentQuestion, selectedAnswer);
  };

  const goToNext = () => {
    if (isGrading) return;
    if (currentIndex < allQuestions.length - 1) {
      const nextQuestion = allQuestions[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      if (nextQuestion.isRetry) {
        setShortAnswerInput(retryAnswers[nextQuestion.id] || "");
      } else {
        setShortAnswerInput(userAnswers[nextQuestion.originalId] || "");
      }
    }
  };

  const goToPrevious = () => {
    if (isGrading) return;
    if (currentIndex > 0) {
      const prevQuestion = allQuestions[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      if (prevQuestion.isRetry) {
        setShortAnswerInput(retryAnswers[prevQuestion.id] || "");
      } else {
        setShortAnswerInput(userAnswers[prevQuestion.originalId] || "");
      }
    }
  };

  const goToQuestion = (index: number) => {
    if (isGrading) return;
    setCurrentIndex(index);
    setShowQuestionNav(false);
    const question = allQuestions[index];
    if (question.isRetry) {
      setShortAnswerInput(retryAnswers[question.id] || "");
    } else {
      setShortAnswerInput(userAnswers[question.originalId] || "");
    }
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);

    try {
      setRevisedQuestionsCount(wrongAnswerIds.current.size);
      
      const retryQs = allQuestions.filter(q => q.isRetry);
      let retryCorrect = 0;
      for (const rq of retryQs) {
        const answer = retryAnswers[rq.id];
        if (answer) {
          if (rq.type === "short_answer") {
            const grading = aiGradingResults[rq.id];
            if (grading?.isCorrect) retryCorrect++;
          } else if (answer.toLowerCase().trim() === rq.correctAnswer.toLowerCase().trim()) {
            retryCorrect++;
          }
        }
      }
      setRetryCorrectCount(retryCorrect);
      
      if (currentQuiz.generationMode === 'review') {
        const correctAnswers = allQuestions.filter(q => {
          const answer = userAnswers[q.id];
          if (!answer) return false;
          if (q.type === "short_answer") {
            return aiGradingResults[q.id]?.isCorrect;
          }
          return answer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
        }).length;

        const result = {
          quizId: currentQuiz.id,
          answers: userAnswers,
          score: Math.round((correctAnswers / allQuestions.length) * 100),
          totalQuestions: allQuestions.length,
          correctAnswers: correctAnswers,
          timeTaken: sessionTime,
          completedAt: new Date(),
          wrongQuestionIds: allQuestions.filter(q => {
            const answer = userAnswers[q.id];
            if (!answer) return true;
            if (q.type === "short_answer") {
              return !aiGradingResults[q.id]?.isCorrect;
            }
            return answer.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim();
          }).map(q => q.id),
        };
        setQuizResult(result as any);
        setLocation("/quiz-results");
        return;
      }

      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: currentQuiz.id,
          answers: userAnswers,
          timeTaken: sessionTime,
        }),
      });

      if (!response.ok) {
        throw new Error(t('quizPlayer.submitFailed'));
      }

      const result = await response.json();
      
      setQuizResult(result);
      setLocation("/quiz-results");
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportBug = async () => {
    if (!currentQuestion) return;
    
    setIsSubmittingReport(true);
    try {
      const response = await fetch("/api/report-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: currentQuiz.id,
          questionId: currentQuestion.originalId,
          questionText: currentQuestion.question,
          reportReason: reportReason,
          details: reportDetails,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit report");

      toast({
        title: t('quizPlayer.reportSubmitted'),
        description: t('quizPlayer.reportSubmittedDesc'),
      });
      setShowReportDialog(false);
      setReportDetails("");
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast({
        title: t('common.error'),
        description: t('quizPlayer.reportFailed'),
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const getQuestionTypeBadge = (type: Question["type"]) => {
    switch (type) {
      case "multiple_choice":
        return <Badge variant="secondary" className="text-xs">{t('quizGenerator.multipleChoice')}</Badge>;
      case "true_false":
        return <Badge className="bg-quiz-purple text-white text-xs">{t('quizGenerator.trueFalse')}</Badge>;
      case "short_answer":
        return <Badge className="bg-quiz-orange text-white text-xs">{t('quizGenerator.shortAnswer')}</Badge>;
      default:
        return null;
    }
  };

  const getWrongAnswerExplanation = (answer: string | undefined) => {
    if (!answer || !currentQuestion.wrongAnswerExplanations) return null;
    
    if (currentQuestion.wrongAnswerExplanations[answer]) {
      return currentQuestion.wrongAnswerExplanations[answer];
    }
    
    const answerWithoutPrefix = answer.replace(/^[A-D]\)\s*/, "").trim();
    if (currentQuestion.wrongAnswerExplanations[answerWithoutPrefix]) {
      return currentQuestion.wrongAnswerExplanations[answerWithoutPrefix];
    }
    
    const normalize = (s: string) => s.replace(/^[A-D]\)\s*/, "").trim().toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/,/g, ".")
      .replace(/\u00A0/g, " ");
    
    const normalizedAnswer = normalize(answer);
    
    for (const [key, value] of Object.entries(currentQuestion.wrongAnswerExplanations)) {
      const normalizedKey = normalize(key);
      if (normalizedKey === normalizedAnswer) {
        return value;
      }
    }
    
    for (const [key, value] of Object.entries(currentQuestion.wrongAnswerExplanations)) {
      const normalizedKey = normalize(key);
      if (normalizedKey.length > 3 && normalizedAnswer.length > 3 && 
          (normalizedAnswer.includes(normalizedKey) || normalizedKey.includes(normalizedAnswer))) {
        return value;
      }
    }
    
    return null;
  };

  const renderFeedback = () => {
    if (!isChecked) return null;
    const feedback = feedbackMessages[currentQuestion.id];
    if (!feedback) return null;

    const isCorrect = isCorrectAnswer(selectedAnswer, currentQuestion);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`mt-6 p-4 rounded-2xl border-2 flex items-center gap-3 overflow-hidden relative ${
          isCorrect 
            ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 shadow-sm shadow-green-500/5" 
            : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400 shadow-sm shadow-red-500/5"
        }`}
      >
        <div className={`absolute inset-0 opacity-10 bg-gradient-to-r ${isCorrect ? "from-green-500/0 via-green-500 to-green-500/0" : "from-red-500/0 via-red-500 to-red-500/0"} animate-scan-horizontal`} style={{ animationDuration: '3s' }} />
        
        <div className={`p-2 rounded-xl ${isCorrect ? "bg-green-500/20" : "bg-red-500/20"}`}>
          {isCorrect ? <Sparkles className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
        </div>
        
        <div className="flex-1">
          <p className="font-bold text-lg tracking-tight leading-none mb-0.5">{feedback.message}</p>
          <p className="text-sm opacity-80 font-medium">
            {isCorrect ? t('quizPlayer.doingGreat') : t('quizPlayer.keepGoing')}
          </p>
        </div>
      </motion.div>
    );
  };

  const toggleExplanation = (key: string) => {
    setExpandedExplanations(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const renderAnswerOptions = () => {
    if (currentQuestion.type === "true_false") {
      return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {["True", "False"].map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOpt = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
            const gradeKey = currentQuestion.isRetry ? currentQuestion.id : currentQuestion.originalId;
            const aiExplanation = aiGradingResults[gradeKey];
            const currentExplanation = currentQuestion.explanation || aiExplanation?.explanation;
            const currentWrongExplanation = currentQuestion.wrongAnswerExplanations && Object.keys(currentQuestion.wrongAnswerExplanations).length > 0
              ? getWrongAnswerExplanation(option)
              : (isSelected ? aiExplanation?.wrongExplanation : null);

            const showCorrectExplanation = isChecked && isCorrectOpt && (!isGuest || isRetryQuestion);
            const showWrongExplanation = isChecked && isSelected && !isCorrectOpt && (!isGuest || isRetryQuestion);
            const explanationKey = `${currentQuestion.id}-tf-${option}`;
            const isExpanded = expandedExplanations.has(explanationKey);
            const hasExplanation = showCorrectExplanation || showWrongExplanation;
            const isLoadingExplanation = isGeneratingExplanation[explanationKey];
            
            return (
              <div key={option} className="flex flex-col">
                <motion.button
                  whileHover={!isChecked ? { scale: 1.02 } : {}}
                  whileTap={!isChecked ? { scale: 0.98 } : {}}
                  animate={isChecked ? (
                    isCorrectOpt 
                      ? { scale: [1, 1.05, 1] } 
                      : (isSelected ? { x: [-4, 4, -4, 4, 0] } : {})
                  ) : {}}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 15,
                    mass: 0.4
                  }}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={isChecked}
                  data-testid={`option-${option.toLowerCase()}`}
                  className={`
                    relative p-5 sm:p-8 text-left
                    ${hasExplanation ? "rounded-t-2xl" : "rounded-2xl"}
                    ${!isChecked ? "cursor-pointer" : "cursor-default"}
                    ${isChecked && isCorrectOpt 
                      ? "bg-green-500/15 border-2 border-green-500 shadow-xl shadow-green-500/20 ring-2 ring-green-500/20" 
                      : isChecked && isSelected && !isCorrectOpt
                        ? "bg-red-500/15 border-2 border-red-500 shadow-lg shadow-red-500/15 ring-2 ring-red-500/10"
                        : isSelected
                          ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/10"
                          : "bg-card border-2 border-border hover:border-primary/50 hover:bg-muted/50"
                    }
                    ${hasExplanation ? "border-b-0" : ""}
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-lg sm:text-xl font-bold transition-colors ${isChecked && isCorrectOpt ? "text-green-700 dark:text-green-400" : isChecked && isSelected && !isCorrectOpt ? "text-red-700 dark:text-red-400" : ""}`}>
                      <MathText content={t(`quizGenerator.${option.toLowerCase()}`)} />
                    </span>
                    <AnimatePresence>
                      {isChecked && isCorrectOpt && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
                        >
                          <Check className="h-5 w-5 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                      {isChecked && isSelected && !isCorrectOpt && (
                        <motion.div
                          initial={{ scale: 0, rotate: 45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
                        >
                          <X className="h-5 w-5 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                      {!isChecked && isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
                        >
                          <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                </motion.button>
                
                {/* Explanation dropdown for True/False */}
                {hasExplanation && (
                  <div className={`
                    border-2 border-t-0 rounded-b-2xl overflow-hidden
                    ${isCorrectOpt ? "border-green-500 bg-green-500/5" : "border-red-500 bg-red-500/5"}
                  `}>
                    <button
                      onClick={() => handleToggleExplanation(explanationKey, option, isCorrectOpt)}
                      className={`
                        w-full px-3 py-2 flex items-center justify-between text-xs sm:text-sm font-medium transition-colors
                        ${isCorrectOpt 
                          ? "text-green-700 dark:text-green-400 hover:bg-green-500/10" 
                          : "text-red-700 dark:text-red-400 hover:bg-red-500/10"
                        }
                      `}
                      data-testid={`toggle-explanation-${option.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isCorrectOpt ? (
                          <Lightbulb className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">{t('quizPlayer.viewExplanation')}</span>
                        <span className="sm:hidden">{t('quizPlayer.explain')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLoadingExplanation && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && !isLoadingExplanation && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1">
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              <MathText content={isCorrectOpt ? (currentExplanation || "") : (currentWrongExplanation || "")} />
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.type === "short_answer") {
      const gradeKey = currentQuestion.isRetry ? currentQuestion.id : currentQuestion.originalId;
      const aiGrading = aiGradingResults[gradeKey];
      const explanationKey = `${currentQuestion.id}-short-answer`;
      const isExpanded = expandedExplanations.has(explanationKey);
      const showAiExplanation = isChecked && aiGrading && (!isGuest || isRetryQuestion);
      const isShortAnswerCorrect = aiGrading?.isCorrect;
      const isPartial = aiGrading?.isPartial;
      
      const borderColor = isChecked 
        ? isShortAnswerCorrect 
          ? "border-green-500" 
          : isPartial 
            ? "border-yellow-500" 
            : "border-red-500"
        : "focus:border-primary";
      
      return (
        <div className="space-y-4">
          <motion.div
            animate={isChecked ? (
              isShortAnswerCorrect 
                ? { scale: [1, 1.02, 1], transition: { duration: 0.4 } } 
                : (isPartial ? { scale: [1, 1.01, 1] } : { x: [-4, 4, -4, 4, 0], transition: { duration: 0.4 } })
            ) : {}}
          >
            <Input
              value={isChecked ? (selectedAnswer || shortAnswerInput) : shortAnswerInput}
              onChange={(e) => handleShortAnswerChange(e.target.value)}
              placeholder={t('quizPlayer.shortAnswerPlaceholder')}
              className={`py-6 px-5 text-lg rounded-xl border-2 ${borderColor} transition-all duration-300 shadow-sm ${isChecked && isShortAnswerCorrect ? "shadow-green-500/20" : isChecked && !isShortAnswerCorrect ? "shadow-red-500/20" : ""}`}
              disabled={isChecked || isGrading}
              data-testid="input-short-answer"
            />
          </motion.div>

          {isGrading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('quizPlayer.gradingInProgress')}</span>
            </div>
          )}
          
          {showAiExplanation && (
            <div className={`border-2 ${isShortAnswerCorrect ? "border-green-500 bg-green-500/5" : isPartial ? "border-yellow-500 bg-yellow-500/5" : "border-red-500 bg-red-500/5"} rounded-xl overflow-hidden`}>
              <button
                onClick={() => toggleExplanation(explanationKey)}
                className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium transition-colors ${
                  isShortAnswerCorrect 
                    ? "text-green-700 dark:text-green-400 hover:bg-green-500/10" 
                    : isPartial 
                      ? "text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/10"
                      : "text-red-700 dark:text-red-400 hover:bg-red-500/10"
                }`}
                data-testid="toggle-explanation-short-answer"
              >
                <div className="flex items-center gap-2">
                  {isShortAnswerCorrect ? (
                    <Check className="h-4 w-4" />
                  ) : isPartial ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span>
                    {isShortAnswerCorrect ? t('common.correct') : isPartial ? t('quizPlayer.partiallyCorrect') : t('common.incorrect')} — {t('quizPlayer.aiAssessment')}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <MathText content={aiGrading.explanation} />
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      );
    }

    const optionLabels = ['A', 'B', 'C', 'D'];
    
    return (
      <div className="space-y-3">
        {currentQuestion.options?.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOpt = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
          
          const gradeKey = currentQuestion.isRetry ? currentQuestion.id : currentQuestion.originalId;
          const aiExplanation = aiGradingResults[gradeKey];
          const currentExplanation = currentQuestion.explanation || aiExplanation?.explanation;
          const currentWrongExplanation = currentQuestion.wrongAnswerExplanations && Object.keys(currentQuestion.wrongAnswerExplanations).length > 0
              ? getWrongAnswerExplanation(option)
              : (isSelected ? aiExplanation?.wrongExplanation : null);

          const showCorrectExplanation = isChecked && isCorrectOpt && (!isGuest || isRetryQuestion);
          const showWrongExplanation = isChecked && isSelected && !isCorrectOpt && (!isGuest || isRetryQuestion);
          const explanationKey = `${currentQuestion.id}-${index}`;
          const isExpanded = expandedExplanations.has(explanationKey);
          const hasExplanation = showCorrectExplanation || showWrongExplanation;
          const isLoadingExplanation = isGeneratingExplanation[explanationKey];
          
          return (
            <div key={index} className="space-y-0">
              <motion.button
                whileHover={!isChecked ? { scale: 1.03, x: 4 } : {}}
                whileTap={!isChecked ? { scale: 0.98 } : {}}
                animate={isChecked ? (
                  isCorrectOpt 
                    ? { scale: [1, 1.05, 1] } 
                    : (isSelected ? { x: [-4, 4, -4, 4, 0] } : {})
                ) : {}}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 15,
                  mass: 0.8,
                  layout: { duration: 0 } 
                }}
                onClick={() => handleSelectAnswer(option)}
                disabled={isChecked}
                data-testid={`option-${index}`}
                className={`
                  w-full relative p-4 sm:p-5 text-left
                  ${hasExplanation ? "rounded-t-xl rounded-b-none" : "rounded-xl"}
                  ${!isChecked ? "cursor-pointer" : "cursor-default"}
                  ${isChecked && isCorrectOpt 
                    ? "bg-green-500/15 border-2 border-green-500 border-b-0 shadow-lg shadow-green-500/10 ring-1 ring-green-500/20" 
                    : isChecked && isSelected && !isCorrectOpt
                      ? "bg-red-500/15 border-2 border-red-500 border-b-0 shadow-md shadow-red-500/10"
                      : isSelected
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-card border-2 border-border hover:border-primary/50 hover:bg-muted/30"
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-300
                    ${isChecked && isCorrectOpt
                      ? "bg-green-500 text-white shadow-lg shadow-green-500/40 scale-110"
                      : isChecked && isSelected && !isCorrectOpt
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
                        : isSelected
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                          : "bg-muted text-muted-foreground"
                    }
                  `}>
                    {optionLabels[index]}
                  </div>
                  <span className={`text-sm sm:text-base flex-1 font-bold transition-colors ${isChecked && isCorrectOpt ? "text-green-700 dark:text-green-400" : isChecked && isSelected && !isCorrectOpt ? "text-red-700 dark:text-red-400" : "font-medium"}`}>
                    <MathText content={option} />
                  </span>
                  <AnimatePresence>
                    {isChecked && isCorrectOpt && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
                      >
                        <Check className="h-5 w-5 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                    {isChecked && isSelected && !isCorrectOpt && (
                      <motion.div
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
                      >
                        <X className="h-5 w-5 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                    {!isChecked && isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
                      >
                        <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
              </motion.button>
              
              {/* Explanation dropdown for this option */}
              {hasExplanation && (
                <div className={`
                  border-2 border-t-0 rounded-b-xl overflow-hidden
                  ${isCorrectOpt ? "border-green-500 bg-green-500/5" : "border-red-500 bg-red-500/5"}
                `}>
                  <button
                    onClick={() => handleToggleExplanation(explanationKey, option, isCorrectOpt)}
                    className={`
                      w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium transition-colors
                      ${isCorrectOpt 
                        ? "text-green-700 dark:text-green-400 hover:bg-green-500/10" 
                        : "text-red-700 dark:text-red-400 hover:bg-red-500/10"
                      }
                    `}
                    data-testid={`toggle-explanation-${index}`}
                  >
                    <div className="flex items-center gap-2">
                      {isCorrectOpt ? (
                        <Lightbulb className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span>{t('quizPlayer.viewExplanation')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isLoadingExplanation && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && !isLoadingExplanation && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            <MathText content={isCorrectOpt ? (currentExplanation || "") : (currentWrongExplanation || "")} />
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderQuestionNav = () => {
    return (
      <AnimatePresence>
        {showQuestionNav && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-20 sm:bottom-24 z-40 px-4"
          >
            <Card className="mx-auto max-w-lg p-4 shadow-xl border-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">{t('quizPlayer.jumpToQuestion')}</p>
              <div className="flex flex-wrap gap-2">
                {originalQuestions.map((q, i) => {
                  const isAnswered = checkedQuestions.has(q.id);
                  const wasCorrect = isAnswered && isCorrectAnswer(userAnswers[q.id], { ...q, isRetry: false, originalId: q.id });
                  const isCurrent = currentQuestion?.originalId === q.id && !currentQuestion?.isRetry;
                  const isCurrentRetry = currentQuestion?.originalId === q.id && currentQuestion?.isRetry;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(i)}
                      className={`
                        w-10 h-10 rounded-lg font-semibold text-sm transition-all
                        ${isCurrent 
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                          : isCurrentRetry
                            ? "bg-orange-500 text-white ring-2 ring-orange-500 ring-offset-2"
                            : isAnswered && wasCorrect
                              ? "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/50"
                              : isAnswered
                                ? "bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/50"
                                : "bg-muted hover:bg-muted/80"
                        }
                      `}
                      data-testid={`nav-question-${i}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const allOriginalChecked = checkedQuestions.size === originalQuestionCount;
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);
  const [materialImageIndex, setMaterialImageIndex] = useState(0);
  const [materialPanelWidth, setMaterialPanelWidth] = useState(45);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(45);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const containerWidth = window.innerWidth;
      const deltaX = e.clientX - dragStartXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(70, Math.max(20, dragStartWidthRef.current - deltaPercent));
      setMaterialPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = materialPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const materialImages = sourceMaterial?.documentImages || (currentQuiz as any)?.sourceImages || [];
  const singleSourceImage = sourceMaterial?.imageDataUrl || (currentQuiz as any)?.sourceImageUrl;
  const allMaterialImages = singleSourceImage ? [singleSourceImage, ...materialImages] : materialImages;
  const hasMaterialImages = allMaterialImages.length > 0;

  const rawText = sourceMaterial?.text || (currentQuiz as any)?.sourceText || "";
  const materialText = rawText === "[Images uploaded - AI will analyze visually]" ? "" : rawText;
  const hasMaterialText = Boolean(materialText.trim());
  const hasMaterialContent = hasMaterialImages || hasMaterialText;

  const retryQuestionsInList = allQuestions.filter(q => q.isRetry);
  const allRetryChecked = retryQuestionsInList.every(q => retryChecked.has(q.id));
  const isLastQuestion = currentIndex === allQuestions.length - 1;
  const canFinish = allOriginalChecked && (retryQuestionsInList.length === 0 || allRetryChecked);
    
  const canCheck = !isChecked && !isGrading && (selectedAnswer || (currentQuestion?.type === "short_answer" && shortAnswerInput.trim()));

  if (!currentQuestion) return null;

  const displayQuestionNum = isRetryQuestion 
    ? originalQuestions.findIndex(q => q.id === currentQuestion.originalId) + 1
    : currentIndex + 1;

  const correctCount = Array.from(checkedQuestions).filter(qId => {
    const q = originalQuestions.find(oq => oq.id === qId);
    return q && isCorrectAnswer(userAnswers[qId], { ...q, isRetry: false, originalId: q.id });
  }).length;

  return (
    <>
      <div className="flex w-full min-h-[calc(100vh-4rem)] overflow-x-hidden relative">
        <AnimatePresence>
          {showMaterialViewer && !isMobile && hasMaterialContent && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${materialPanelWidth}%`, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-border shrink-0 bg-muted/20 relative"
            >
              <div 
                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-[100]"
                onMouseDown={startDrag}
              />
              <div className="h-full flex flex-col pt-4 pb-8 px-4 overflow-y-auto w-full absolute inset-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    {hasMaterialImages ? <Image className="h-5 w-5 text-muted-foreground" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                    <h3 className="font-semibold text-lg">{t('quizPlayer.studyMaterial')}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setShowMaterialViewer(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {hasMaterialText && !hasMaterialImages ? (
                   <div className="w-full text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap select-text p-4 bg-card rounded-lg shadow-sm border border-border">
                     {materialText}
                   </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center min-h-0">
                    <img
                      src={allMaterialImages[materialImageIndex]}
                      alt="Study material"
                      className="max-w-full rounded-lg border border-border/50 shadow-sm min-h-0 object-contain cursor-zoom-in"
                      onClick={() => setExpandedImageUrl(allMaterialImages[materialImageIndex])}
                    />
                    {allMaterialImages.length > 1 && (
                      <div className="w-full mt-4 flex items-center justify-between shrink-0 bg-background/50 p-2 rounded-xl backdrop-blur-sm border border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMaterialImageIndex(prev => prev > 0 ? prev - 1 : allMaterialImages.length - 1)}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-xs font-semibold px-3 py-1 bg-muted rounded-full">
                          {materialImageIndex + 1} / {allMaterialImages.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMaterialImageIndex(prev => prev < allMaterialImages.length - 1 ? prev + 1 : 0)}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0">
          <div className="w-full mx-auto pb-32 sm:pb-28 max-w-3xl px-4">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isRetryQuestion && (
                    <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 text-xs font-semibold">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      {t('common.retry')}
                    </Badge>
                  )}
                  <button
                    onClick={() => setShowQuestionNav(!showQuestionNav)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    data-testid="button-question-nav"
                  >
                    <span className="text-sm font-semibold">{displayQuestionNum}/{originalQuestionCount}</span>
                    <ChevronUp className={`h-4 w-4 transition-transform ${showQuestionNav ? "rotate-180" : ""}`} />
                  </button>
                  {hasMaterialContent && (
                    <Button
                      variant={showMaterialViewer ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => {
                        setMaterialImageIndex(0);
                        setShowMaterialViewer(!showMaterialViewer);
                      }}
                      className="gap-1.5 rounded-full h-8"
                      data-testid="button-view-material"
                    >
                      {hasMaterialImages ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="hidden sm:inline">{t('quizPlayer.material')}</span>
                    </Button>
                  )}
                  <ThemeToggle />
                </div>
                <div className="flex items-center gap-3">
                  {correctStreak >= 2 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/20 rounded-full"
                    >
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{correctStreak}</span>
                    </motion.div>
                  )}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 rounded-full">
                    <BadgeCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{correctCount}</span>
                  </div>
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 rounded-full group/timer relative cursor-pointer hover:bg-orange-500/20 transition-all duration-300" 
                    onClick={() => setShowTimer(!showTimer)}
                    title={showTimer ? t('quizPlayer.hideTimer') : t('quizPlayer.showTimer')}
                  >
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <Clock className="absolute inset-0 h-4 w-4 text-orange-500 transition-opacity duration-300 group-hover/timer:opacity-0" />
                      {showTimer ? (
                        <EyeOff className="absolute inset-0 h-4 w-4 text-orange-500 opacity-0 transition-opacity duration-300 group-hover/timer:opacity-100" />
                      ) : (
                        <Eye className="absolute inset-0 h-4 w-4 text-orange-500 opacity-0 transition-opacity duration-300 group-hover/timer:opacity-100" />
                      )}
                    </div>
                    {showTimer && (
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {formatTime(sessionTime)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="relative h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "circOut" }}
                >
                  {/* Leading edge glow */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/20 blur-sm" />
                </motion.div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mt-6"
              >
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {isRetryQuestion ? (
                      <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {t('quizPlayer.giveItAnotherTry')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-semibold">
                        {t('quizPlayer.questionNumber', { number: displayQuestionNum })}
                      </Badge>
                    )}
                    {getQuestionTypeBadge(currentQuestion.type)}
                    
                    <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-muted-foreground hover:text-destructive gap-1 rounded-full"
                          data-testid="button-report-problem"
                        >
                          <Flag className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{t('quizPlayer.somethingWrong')}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            {t('quizPlayer.reportProblem')}
                          </DialogTitle>
                          <DialogDescription>
                            {t('quizPlayer.reportProblemDesc')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('quizPlayer.whatIsIssue')}</label>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                "Correct answer is wrong",
                                "Explanation is incorrect",
                                "Typo or formatting issue",
                                "Question is unclear",
                                "Other"
                              ].map((reason) => (
                                <button
                                  key={reason}
                                  onClick={() => setReportReason(reason)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border-2 transition-all ${
                                    reportReason === reason 
                                      ? "border-primary bg-primary/5 font-semibold" 
                                      : "border-transparent bg-muted/50 hover:bg-muted"
                                  }`}
                                >
                                  {t(`quizPlayer.reportReasons.${reason.toLowerCase().replace(/ /g, '_')}`)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('quizPlayer.detailsOptional')}</label>
                            <Textarea 
                              placeholder={t('quizPlayer.describeProblem')} 
                              value={reportDetails}
                              onChange={(e) => setReportDetails(e.target.value)}
                              className="min-h-[100px] rounded-xl"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="ghost" 
                            onClick={() => setShowReportDialog(false)}
                            disabled={isSubmittingReport}
                            className="rounded-xl"
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button 
                            onClick={handleReportBug}
                            disabled={isSubmittingReport}
                            className="rounded-xl px-6"
                          >
                            {isSubmittingReport ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('quizPlayer.submitting')}
                              </>
                            ) : (
                              t('quizPlayer.submitReport')
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-snug" data-testid="text-question">
                    <MathText content={currentQuestion.question} />
                  </h2>
                </div>

                

                {renderAnswerOptions()}
                {renderFeedback()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>


      </div>

      {renderQuestionNav()}

      <div 
        className="fixed bottom-0 right-0 left-0 z-30 bg-background/95 backdrop-blur-md border-t transition-[left] duration-300 ease-in-out"
        style={{ 
          left: !sidebarContext || isMobile ? 0 : sidebarState === 'collapsed' ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)' 
        }}
      >
        <div className="max-w-3xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-1.5 sm:gap-3">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentIndex === 0 || isGrading}
              size="icon"
              className="rounded-lg sm:rounded-xl h-9 w-9 sm:h-11 sm:w-auto sm:px-4 shrink-0"
              data-testid="button-previous"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">{t('common.back')}</span>
            </Button>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowChatbot(true)}
                className="rounded-full h-9 sm:h-11 px-3 sm:px-4 shrink-0 bg-background/50 backdrop-blur-sm border-2 hover:bg-primary/5 gap-2 font-semibold shadow-sm transition-all hover:shadow-md group"
                data-testid="button-ask-pip"
              >
                <div className="flex items-center justify-center">
                  <CutePenguin size={22} className="sm:w-6 sm:h-6" />
                </div>
                <span className="hidden sm:inline">{t('quizPlayer.askPip')}</span>
              </Button>
              
              {!isChecked ? (
                <Button
                  onClick={handleCheck}
                  disabled={!canCheck}
                  className="gap-1 sm:gap-2 rounded-lg sm:rounded-xl flex-1 max-w-[140px] sm:max-w-none sm:min-w-[160px] font-semibold h-9 sm:h-11 text-sm sm:text-base px-3 sm:px-4"
                  data-testid="button-check"
                >
                  {isGrading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                  {isGrading ? t('quizPlayer.gradingInProgressShort') : t('common.check')}
                </Button>
              ) : isLastQuestion ? (
                <Button
                  onClick={finishQuiz}
                  disabled={isSubmitting || !canFinish}
                  className="gap-1 sm:gap-2 rounded-lg sm:rounded-xl flex-1 max-w-[140px] sm:max-w-none sm:min-w-[160px] font-semibold bg-primary hover:from-primary/90 hover:primary/90 h-9 sm:h-11 text-sm sm:text-base px-3 sm:px-4"
                  data-testid="button-finish"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <>{t('quizPlayer.results')}</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={goToNext}
                  className="gap-1 sm:gap-2 rounded-lg sm:rounded-xl flex-1 max-w-[140px] sm:max-w-none sm:min-w-[160px] font-semibold h-9 sm:h-11 text-sm sm:text-base px-3 sm:px-4"
                  data-testid="button-next"
                >
                  {t('common.continue')}
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={currentIndex >= allQuestions.length - 1 || isGrading}
              size="icon"
              className="rounded-lg sm:rounded-xl h-9 w-9 sm:h-11 sm:w-auto sm:px-4 shrink-0"
              data-testid="button-skip"
            >
              <span className="hidden sm:inline mr-2">{t('common.next')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <QuizChatbot
        quizTitle={currentQuiz.title}
        questions={currentQuiz.questions}
        currentQuestionIndex={Math.min(currentIndex, currentQuiz.questions.length - 1)}
        sourceMaterial={sourceMaterial?.text || undefined}
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
      />

      <AnimatePresence>
        {expandedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
            onClick={() => setExpandedImageUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedImageUrl}
                alt="Expanded view"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute -top-4 -right-4 rounded-full shadow-lg border-2 border-background h-10 w-10 z-10"
                onClick={() => setExpandedImageUrl(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMaterialViewer && isMobile && hasMaterialContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
            onClick={() => setShowMaterialViewer(false)}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                {hasMaterialImages ? <Image className="h-5 w-5 text-white/80" /> : <FileText className="h-5 w-5 text-white/80" />}
                <span className="text-white font-medium">
                  {hasMaterialImages && allMaterialImages.length > 1 
                    ? t('quizPlayer.imagesCount', { current: materialImageIndex + 1, total: allMaterialImages.length }) 
                    : t('quizPlayer.studyMaterial')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={() => setShowMaterialViewer(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div 
              className="flex-1 flex flex-col p-4 relative overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {hasMaterialText && !hasMaterialImages ? (
                <div className="w-full text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap select-text p-4 bg-zinc-900 rounded-lg shadow-sm border border-white/10">
                  {materialText}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center relative">
                  {allMaterialImages.length > 1 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-0 z-10 rounded-full shadow-lg"
                      onClick={() => setMaterialImageIndex(prev => prev > 0 ? prev - 1 : allMaterialImages.length - 1)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <img
                    src={allMaterialImages[materialImageIndex]}
                    alt={`Study material ${materialImageIndex + 1}`}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg"
                  />
                  {allMaterialImages.length > 1 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-0 z-10 rounded-full shadow-lg"
                      onClick={() => setMaterialImageIndex(prev => prev < allMaterialImages.length - 1 ? prev + 1 : 0)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            {hasMaterialImages && allMaterialImages.length > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t border-white/10 shrink-0">
                {allMaterialImages.map((_: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaterialImageIndex(idx);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      idx === materialImageIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
