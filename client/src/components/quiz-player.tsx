import { parseSelectionAnswer, encodeSelectionAnswer, selectionAnswersMatch, isCorrectOption, formatAnswer } from "@shared/selection-answer";
import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Check, X, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCheck, RotateCcw, Zap, Trophy, Target, ChevronUp, ChevronDown, Star, Flame, BadgeCheck, Bookmark, BookCheck, Lock, CircleCheck, CircleCheckBig, MessageCircle, Lightbulb, AlertCircle, ZoomIn, FileImage, FileText, ChevronLeft, ChevronRight, Image, Flag, AlertTriangle, Clock, Eye, EyeOff, MessageCircleQuestion, Square, SquareCheck, Circle, } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { IMAGE_ANALYSIS_DISPLAY_TEXT, IMAGE_ANALYSIS_SOURCE_MARKER, type Question } from "@shared/schema";
import confetti from "canvas-confetti";
import { QuizChatbot } from "@/components/quiz-chatbot";
import AskPipIcon from "@/components/ui/ask-pip-icon";
import { MathText } from "@/components/formatted-text";

const getEncouragingMessages = (t: any) => ({
  correct: [
    t('quizPlayer.excellentWork'),
    t('quizPlayer.nailedIt'),
    t('quizPlayer.brilliant'),
    t('quizPlayer.keepItUp'),
    t('quizPlayer.perfect'),
    t('quizPlayer.outstanding'),
    t('quizPlayer.onFire'),
    t('quizPlayer.impressive'),
  ],
  retryCorrect: [
    t('quizPlayer.improvement'),
    t('quizPlayer.learnedLastOne'),
    t('quizPlayer.secondCharm'),
    t('quizPlayer.masteredNow'),
    t('quizPlayer.growthMindset'),
    t('quizPlayer.persistencePays'),
    t('quizPlayer.didntGiveUp'),
    t('quizPlayer.howYouLearn'),
  ],
  incorrect: [
    t('quizPlayer.dontWorry'),
    t('quizPlayer.getNextOne'),
    t('quizPlayer.learningInProgress'),
    t('quizPlayer.everyMistake'),
    t('quizPlayer.stayCurious'),
  ],
  streak: [
    t('quizPlayer.streak2'),
    t('quizPlayer.streak3'),
    t('quizPlayer.streak4'),
    t('quizPlayer.streak5'),
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

const normalizeTrueFalseAnswer = (answer: string | undefined): "true" | "false" | null => {
  if (!answer) return null;

  const normalized = answer
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d");

  if (["true", "t", "yes", "y", "dung"].includes(normalized)) return "true";
  if (["false", "f", "no", "n", "sai"].includes(normalized)) return "false";
  return null;
};

const answersMatch = (
  answer: string | undefined,
  correctAnswer: string | undefined,
  type: Question["type"],
) => {
  if (!answer || !correctAnswer) return false;
  if (type === "selection") return selectionAnswersMatch(answer, correctAnswer);

  if (type === "true_false") {
    const normalizedAnswer = normalizeTrueFalseAnswer(answer);
    const normalizedCorrect = normalizeTrueFalseAnswer(correctAnswer);
    return normalizedAnswer !== null && normalizedAnswer === normalizedCorrect;
  }

  return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
};

import { ThemeToggle } from "@/components/theme-toggle";
import { MaterialPane } from "@/components/material-pane";
import { useIsMobile } from "@/hooks/use-mobile";

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
    restoredShortAnswerGradingResults,
    setShortAnswerGradingResult,
    clearRestoredState,
    syncPlayerState,
    timeTaken,
    quizResult,
  } = useQuiz();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const sidebarContext = useSidebarOptional();
  const sidebarState = sidebarContext?.state ?? "expanded";
  const isMobile = useIsMobile() || (sidebarContext?.isMobile ?? false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [correctStreak, setCorrectStreak] = useState(0);
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, { message: string; streakAtTime: number }>>({}); 
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>([]);
  const [isGrading, setIsGrading] = useState(false);
  const [aiGradingResults, setAiGradingResults] = useState<Record<string, { isCorrect: boolean; isPartial: boolean; explanation: string; wrongExplanation?: string }>>({});
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState<Record<string, boolean>>({});
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<string>("Correct answer is wrong");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);
  const [materialPanelWidth, setMaterialPanelWidth] = useState(45);
  const [showRevisionScreen, setShowRevisionScreen] = useState(false);
  const { toast } = useToast();
  
  const wrongAnswerIds = useRef<Set<string>>(new Set());
  const [retryAnswers, setRetryAnswers] = useState<Record<string, string>>({});
  const [retryChecked, setRetryChecked] = useState<Set<string>>(new Set());
  const hasRestoredRef = useRef(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  
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
  const quizBookmarkStorageKey = currentQuiz ? `quiz-bookmarks-${currentQuiz.id}` : "";
  const isGuest = !user;

  useEffect(() => {
    if (!currentQuiz) return;

    try {
      const stored = sessionStorage.getItem(quizBookmarkStorageKey);
      if (!stored) {
        setBookmarkedQuestions([]);
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setBookmarkedQuestions(parsed.filter((value): value is string => typeof value === "string"));
      } else {
        setBookmarkedQuestions([]);
      }
    } catch {
      setBookmarkedQuestions([]);
    }
  }, [currentQuiz?.id, quizBookmarkStorageKey]);

  useEffect(() => {
    if (!currentQuiz) return;

    try {
      sessionStorage.setItem(quizBookmarkStorageKey, JSON.stringify(bookmarkedQuestions));
    } catch {
      // Ignore storage quota issues and keep the in-memory state intact.
    }
  }, [currentQuiz?.id, quizBookmarkStorageKey, bookmarkedQuestions]);

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
        const isCorrect = answersMatch(userAnswer, q.correctAnswer, q.type);
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

  useEffect(() => {
    if (!currentQuiz) return;

    if (restoredShortAnswerGradingResults && Object.keys(restoredShortAnswerGradingResults).length > 0) {
      setAiGradingResults(restoredShortAnswerGradingResults);
    } else {
      setAiGradingResults({});
    }
  }, [currentQuiz?.id, restoredShortAnswerGradingResults, setAiGradingResults]);

  // Sync player state to context for save functionality (only for authenticated users)
  useEffect(() => {
    if (!isGuest) {
      syncPlayerState(currentIndex, retryAnswers, Array.from(retryChecked), aiGradingResults, sessionTime);
    }
  }, [currentIndex, retryAnswers, retryChecked, aiGradingResults, syncPlayerState, isGuest, sessionTime]);

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
    return answersMatch(answer, question.correctAnswer, question.type);
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
    if (currentQuestion.type === "selection") {
      const selected = parseSelectionAnswer(selectedAnswer);
      answer = encodeSelectionAnswer(selected.includes(answer) ? selected.filter(option => option !== answer) : [...selected, answer]);
    }
    if (currentQuestion.isRetry) {
      setRetryAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    } else {
      setUserAnswer(currentQuestion.originalId, answer);
    }
  };

  const commitShortAnswer = (value: string) => {
    if (isChecked) return;

    if (currentQuestion.isRetry) {
      setRetryAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    } else {
      setUserAnswer(currentQuestion.originalId, value);
    }
  };

  const handleShortAnswerChange = (value: string) => {
    if (isChecked) return;
    setShortAnswerInput(value);
    commitShortAnswer(value);
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
      const correctOption = normalizeTrueFalseAnswer(qSnap.correctAnswer) === "true" ? "True" : "False";
      keysToExpand.push(`${qSnap.id}-tf-${correctOption}`);
      if (!correct && answerToCheck) {
        keysToExpand.push(`${qSnap.id}-tf-${answerToCheck}`);
      }
    } else if (qSnap.type === "short_answer") {
      keysToExpand.push(`${qSnap.id}-short-answer`);
    } else if (qSnap.options && qSnap.explanation && (!isGuest || qSnap.isRetry)) {
      qSnap.options.forEach((opt, idx) => {
        const isCorrectOpt = isCorrectOption(opt, qSnap);
        const isSelectedWrong = (qSnap.type === "selection" ? parseSelectionAnswer(answerToCheck).includes(opt) : opt === answerToCheck) && !correct;
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
          isCorrectOpt = answersMatch(optionText, qSnap.correctAnswer, qSnap.type);
        } else if ((qSnap.type === "multiple_choice" || qSnap.type === "selection")) {
          const optIdx = parseInt(key.split("-").pop() || "0");
          optionText = qSnap.options?.[optIdx] || "";
          isCorrectOpt = isCorrectOption(optionText, qSnap);
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
      commitShortAnswer(answerToCheck);
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
              category: currentQuiz.category,
              userPreferences: user,
            }),
          });

          if (!res.ok) throw new Error("Grading failed");

          const grading = await res.json();
          const gradeKey = questionSnapshot.isRetry ? questionSnapshot.id : questionSnapshot.originalId;
          const nextGradingResults = {
            ...aiGradingResults,
            [gradeKey]: {
              isCorrect: grading.isCorrect,
              isPartial: grading.isPartial,
              explanation: grading.explanation,
            },
          };

          setAiGradingResults(nextGradingResults);
          setShortAnswerGradingResult(gradeKey, nextGradingResults[gradeKey]);
          syncPlayerState(
            currentIndex,
            questionSnapshot.isRetry ? { ...retryAnswers, [questionSnapshot.id]: answerToCheck! } : retryAnswers,
            Array.from(retryChecked),
            nextGradingResults,
            sessionTime
          );

          applyCheckResult(grading.isCorrect, answerToCheck, questionSnapshot);
        } catch {
          const normalizedUser = (answerToCheck || "").toLowerCase().trim();
          const normalizedCorrect = questionSnapshot.correctAnswer.toLowerCase().trim();
          const fallbackCorrect = normalizedUser === normalizedCorrect;
          const gradeKey = questionSnapshot.isRetry ? questionSnapshot.id : questionSnapshot.originalId;
          const nextGradingResults = {
            ...aiGradingResults,
            [gradeKey]: {
              isCorrect: fallbackCorrect,
              isPartial: false,
              explanation: fallbackCorrect
                ? t('quizPlayer.shortAnswerFallbackCorrect')
                : t('quizPlayer.shortAnswerFallbackIncorrect', { expected: questionSnapshot.correctAnswer }),
            },
          };

          setAiGradingResults(nextGradingResults);
          setShortAnswerGradingResult(gradeKey, nextGradingResults[gradeKey]);
          syncPlayerState(
            currentIndex,
            questionSnapshot.isRetry ? { ...retryAnswers, [questionSnapshot.id]: answerToCheck! } : retryAnswers,
            Array.from(retryChecked),
            nextGradingResults,
            sessionTime
          );

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
          correctAnswer: formatAnswer(qSnap.correctAnswer, qSnap.type),
          selectedAnswer: formatAnswer(ansToCheck, qSnap.type),
          isCorrect: isCorrectAnswer(ansToCheck, qSnap),
          sourceText: sourceMaterial?.text || (currentQuiz as any)?.sourceText || "",
          category: currentQuiz.category,
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
      
      // Check if trying to move from original to retry questions
      const currentIsOriginal = !currentQuestion?.isRetry;
      const nextIsRetry = nextQuestion.isRetry;
      
      // Show revision screen when entering retry section
      if (currentIsOriginal && nextIsRetry && allOriginalChecked && !showRevisionScreen) {
        setShowRevisionScreen(true);
        return;
      }
      
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
    
    // Prevent going back from retry questions to original questions
    if (isRetryQuestion) {
      const prevQuestion = allQuestions[currentIndex - 1];
      if (!prevQuestion.isRetry) {
        // Can't go back from retry to original
        return;
      }
    }
    
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
    
    const targetQuestion = allQuestions[index];
    
    // Disable question jumping in retry section
    if (isRetryQuestion || (targetQuestion?.isRetry)) {
      toast({
        title: t('quizPlayer.linearModeTitle'),
        description: t('quizPlayer.linearModeDesc'),
        variant: "default",
      });
      return;
    }
    
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
          } else if (answersMatch(answer, rq.correctAnswer, rq.type)) {
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
          return answersMatch(answer, q.correctAnswer, q.type);
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
            return !answersMatch(answer, q.correctAnswer, q.type);
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
      case "selection":
        return <Badge variant="secondary" className="text-xs">{t("quizGenerator.selection")}</Badge>;
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
          {isCorrect ? <Star className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
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

  const isCurrentQuestionBookmarked = currentQuestion
    ? bookmarkedQuestions.includes(currentQuestion.isRetry ? currentQuestion.originalId : currentQuestion.id)
    : false;

  const toggleQuestionBookmark = () => {
    if (!currentQuestion) return;

    const bookmarkKey = currentQuestion.isRetry ? currentQuestion.originalId : currentQuestion.id;
    setBookmarkedQuestions(prev =>
      prev.includes(bookmarkKey)
        ? prev.filter(id => id !== bookmarkKey)
        : [...prev, bookmarkKey]
    );
  };

  const renderAnswerOptions = () => {
    if (currentQuestion.type === "true_false") {
      return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {["True", "False"].map((option, index) => {
            const isSelected = answersMatch(selectedAnswer, option, "true_false");
            const isCorrectOpt = answersMatch(option, currentQuestion.correctAnswer, "true_false");
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
                  onPointerDown={() => setPressedKey(explanationKey)}
                  onPointerUp={() => setPressedKey(null)}
                  onPointerLeave={() => setPressedKey(null)}
                  onPointerCancel={() => setPressedKey(null)}
                  disabled={isChecked}
                  data-testid={`option-${option.toLowerCase()}`}
                  style={{ 
                    transform: pressedKey === explanationKey ? 'translateY(4px)' : undefined,
                    boxShadow: isChecked
                    ? 'none' : 
                    pressedKey === explanationKey 
                      ? '0 0px 0px 0px rgba(15,23,42,0)'
                      : isSelected
                        ? (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
                        ? '0 4px 0 0 rgba(250, 204, 21, 0.6)'
                        : '0 4px 0 0 rgba(250, 204, 21, 0.8)')
                      : (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
                        ? '0 4px 0 0 rgba(255,255,255,0.08)'
                        : '0 4px 0 0 rgba(142, 158, 196, 0.08)')
                  }}
                  className={`
                    relative p-5 sm:p-8 text-left
                    ${hasExplanation ? "rounded-t-2xl" : "rounded-2xl"}
                    ${!isChecked ? "cursor-pointer" : "cursor-default"}
                    transition-[transform,box-shadow] duration-75
                    ${isChecked && isCorrectOpt 
                      ? "bg-green-500/15 border-2 border-green-500 shadow-none ring-2 ring-green-500/20" 
                      : isChecked && isSelected && !isCorrectOpt
                        ? "bg-red-500/15 border-2 border-red-500 shadow-md shadow-red-500/10"
                        : isSelected
                          ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/80"
                          : "bg-card border-2 border-border"
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
              className={`py-6 px-5 text-lg rounded-xl border-2 ${borderColor} transition-all duration-300 shadow-primary ${isChecked && isShortAnswerCorrect ? "shadow-green-500/20" : isChecked && !isShortAnswerCorrect ? "shadow-red-500/20" : ""}`}
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
        {currentQuestion.type === "selection" && <p className="text-sm text-muted-foreground">{t("quizGenerator.selectionHint")}</p>}
        {currentQuestion.type === "selection" && currentQuestion.selectionMode === "truth_statements" && (
          <Button variant={selectedAnswer === "[]" ? "secondary" : "outline"} disabled={isChecked} onClick={() => commitShortAnswer("[]")} aria-pressed={selectedAnswer === "[]"}>
            {language === "vi" ? "Không có phát biểu nào đúng" : "No statements are true"}
          </Button>
        )}
        {currentQuestion.options?.map((option, index) => {
          const isSelected = currentQuestion.type === "selection" ? parseSelectionAnswer(selectedAnswer).includes(option) : selectedAnswer === option;
          const isCorrectOpt = isCorrectOption(option, currentQuestion);
          
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
                onPointerDown={() => setPressedKey(explanationKey)}
                onPointerUp={() => setPressedKey(null)}
                onPointerLeave={() => setPressedKey(null)}
                onPointerCancel={() => setPressedKey(null)}
                disabled={isChecked}
                role={currentQuestion.type === "selection" ? "checkbox" : undefined}
                aria-checked={currentQuestion.type === "selection" ? isSelected : undefined}
                data-testid={`option-${index}`}
                style={{ 
                  transform: pressedKey === explanationKey ? 'translateY(4px)' : undefined,
                  boxShadow: isChecked
                  ? 'none'
                  : pressedKey === explanationKey 
                    ? '0 0px 0px 0px rgba(86, 110, 166, 0)'
                    : isSelected
                      ? (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
                        ? '0 4px 0 0 rgba(250, 204, 21, 0.6)'
                        : '0 4px 0 0 rgba(250, 204, 21, 0.8)')
                      : (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
                        ? '0 4px 0 0 rgba(255,255,255,0.08)'
                        : '0 4px 0 0 rgba(142, 158, 196, 0.08)')
                }}
                className={`
                  w-full relative p-4 sm:p-5 text-left 
                  ${hasExplanation ? "rounded-t-xl rounded-b-none" : "rounded-xl"}
                  ${!isChecked ? "cursor-pointer" : "cursor-default"}
                  transition-[transform,box-shadow] duration-75
                  ${isChecked && isCorrectOpt 
                    ? `bg-green-500/15 border-2 border-green-500 ${hasExplanation ? "border-b-0" : ""} shadow-none ring-1 ring-green-500/20` 
                    : isChecked && isSelected && !isCorrectOpt
                    ? `bg-red-500/15 border-2 border-red-500 ${hasExplanation ? "border-b-0" : ""} shadow-md shadow-red-500/10`
                      : isSelected
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-card border-2 border-border"
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-300
                    ${
                      isChecked && isCorrectOpt && isSelected
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/40 scale-110"
                        : isChecked && isCorrectOpt && !isSelected
                          ? "bg-green-600 dark:bg-green-900 text-white"
                          : isChecked && isSelected && !isCorrectOpt
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
                            : isSelected
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                              : "bg-muted text-muted-foreground"
                    }
                  `}>
                    {currentQuestion.type === "selection" ? (
                      isChecked && isSelected && !isCorrectOpt
                        ? <X aria-hidden="true" className="h-6 w-6" strokeWidth={2.5} />
                        : isSelected
                          ? <CircleCheck aria-hidden="true" className="h-6 w-6" strokeWidth={2} />
                          : <Circle aria-hidden="true" className="h-6 w-6" strokeWidth={2.5} />
                    ) : optionLabels[index]}
                  </div>
                  <span className={`text-sm sm:text-base flex-1 font-bold transition-colors ${isChecked && isCorrectOpt ? "text-green-700 dark:text-green-400" : isChecked && isSelected && !isCorrectOpt ? "text-red-700 dark:text-red-400" : "font-medium"}`}>
                    <MathText content={option} />
                  </span>
                  <AnimatePresence>
                    {isSelected && isChecked && isCorrectOpt && (
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
                  const needsRetry = wrongAnswerIds.current.has(q.id);
                  const isBookmarkedQuestion = bookmarkedQuestions.includes(q.id);
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(i)}
                      disabled={isRetryQuestion}
                      className={`
                        relative w-10 h-10 rounded-lg font-semibold text-sm transition-all
                        ${isRetryQuestion 
                          ? "opacity-50 cursor-not-allowed" 
                          : "cursor-pointer hover:scale-105"
                        }
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
                        ${needsRetry && isAnswered ? "ring-1 ring-orange-500 ring-offset-0" : ""}
                      `}
                      data-testid={`nav-question-${i}`}
                      title={isRetryQuestion ? t('quizPlayer.linearModeDesc') : isBookmarkedQuestion ? "Bookmarked question" : ""}
                    >
                      <span className="relative z-10">{i + 1}</span>
                      {isBookmarkedQuestion && (
                        <Bookmark className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center text-amber-500 fill-current shadow-sm"/>
        
                      )}
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

  const renderRevisionScreen = () => {
    const retryQuestionCount = wrongAnswerIds.current.size;
    
    return (
      <AnimatePresence>
        {showRevisionScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowRevisionScreen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border-2 border-border rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                {/* Icon */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center"
                >
                  <RotateCcw className="h-8 w-8 text-orange-500" />
                </motion.div>

                {/* Heading */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-foreground">
                    {t('quizPlayer.timeToReview')}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t('quizPlayer.reviewExplanation')}
                  </p>
                </div>

                {/* Stats */}
                <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm font-medium">
                      {t('quizPlayer.questionsToReview')}
                    </span>
                    <Badge className="bg-orange-500 text-white text-lg px-3 py-1 rounded-full">
                      {retryQuestionCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm font-medium">
                      {t('quizPlayer.completedQuestions')}
                    </span>
                    <Badge className="bg-green-500 text-white text-lg px-3 py-1 rounded-full">
                      {checkedQuestions.size}
                    </Badge>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground text-left">
                      {t('quizPlayer.revisionTip')}
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRevisionScreen(false)}
                    className="flex-1 rounded-xl font-semibold h-11"
                  >
                    {t('common.back')}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRevisionScreen(false);
                      setCurrentIndex(currentIndex + 1);
                      const nextQuestion = allQuestions[currentIndex + 1];
                      if (nextQuestion.isRetry) {
                        setShortAnswerInput(retryAnswers[nextQuestion.id] || "");
                      }
                    }}
                    className="flex-1 rounded-xl font-semibold h-11 bg-orange-500 hover:bg-orange-500/90 text-white border-orange-800 shadow-orange-800"
                  >
                    {t('quizPlayer.startRevision')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const allOriginalChecked = checkedQuestions.size === originalQuestionCount;

  const allMaterialImages = useMemo(() => {
    const quizMaterialImages = ((currentQuiz as any)?.sourceImages as string[] | undefined) || [];
    const contextMaterialImages = (sourceMaterial?.documentImages as string[] | undefined) || [];
    const singleSourceImages = [
      (currentQuiz as any)?.sourceImageUrl as string | undefined,
      sourceMaterial?.imageDataUrl as string | undefined,
    ].filter((image): image is string => Boolean(image));

    return Array.from(new Set([
      ...singleSourceImages,
      ...quizMaterialImages,
      ...contextMaterialImages,
    ]));
  }, [
    (currentQuiz as any)?.sourceImageUrl,
    (currentQuiz as any)?.sourceImages,
    sourceMaterial?.imageDataUrl,
    sourceMaterial?.documentImages,
  ]);
  const hasMaterialImages = allMaterialImages.length > 0;

  const rawText = (currentQuiz as any)?.sourceText || sourceMaterial?.text || "";
  const materialText = rawText.startsWith(IMAGE_ANALYSIS_SOURCE_MARKER)
    ? IMAGE_ANALYSIS_DISPLAY_TEXT
    : rawText === "[Images uploaded - AI will analyze visually]"
      ? ""
      : rawText;
  const hasMaterialText = Boolean(materialText.trim());
  const hasMaterialContent = hasMaterialImages || hasMaterialText;

  const retryQuestionsInList = allQuestions.filter(q => q.isRetry);
  const allRetryChecked = retryQuestionsInList.every(q => retryChecked.has(q.id));
  const isLastQuestion = currentIndex === allQuestions.length - 1;
  const canFinish = allOriginalChecked && (retryQuestionsInList.length === 0 || allRetryChecked);
    
  const canCheck = !isChecked && !isGrading && (selectedAnswer || (currentQuestion?.type === "short_answer" && shortAnswerInput.trim()));

  useEffect(() => {
    const handleEnterShortcut = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || event.isComposing) return;

      const target = event.target as HTMLElement | null;
      if (target?.closest("textarea, [contenteditable=\"true\"]")) return;

      if (canCheck) {
        event.preventDefault();
        void handleCheck();
      }
    };

    window.addEventListener("keydown", handleEnterShortcut);
    return () => window.removeEventListener("keydown", handleEnterShortcut);
  }, [canCheck, handleCheck]);

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
        <MaterialPane
          materialImages={allMaterialImages}
          materialText={materialText}
          isOpen={showMaterialViewer}
          onClose={() => setShowMaterialViewer(false)}
          isMobile={isMobile}
          panelWidth={materialPanelWidth}
          onPanelWidthChange={setMaterialPanelWidth}
          quizId={currentQuiz?.id}
        />

        <div className="flex-1 min-w-0">
          <div className="w-full mx-auto pb-32 sm:pb-28 max-w-3xl px-4">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isRetryQuestion && (
                    <Badge variant="outline" className="border-orange-500 text-white bg-orange-500 text-xs font-semibold">
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
                  <Button
                      variant={showMaterialViewer ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setShowMaterialViewer(!showMaterialViewer)}
                      className="gap-1.5 rounded-full h-8"
                      data-testid="button-view-material"
                    >
                      {hasMaterialImages ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="hidden sm:inline">{t('quizPlayer.material')}</span>
                    </Button>
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
                        <span>
                          <Eye className="absolute inset-0 h-4 w-4 text-orange-500 opacity-0 transition-opacity duration-300 group-hover/timer:opacity-100"/>
                        </span>
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
                    {/* {isRetryQuestion ? (
                      <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {t('quizPlayer.giveItAnotherTry')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-semibold">
                        {t('quizPlayer.questionNumber', { number: displayQuestionNum })}
                      </Badge>
                    )} */}
                    {getQuestionTypeBadge(currentQuestion.type)}
                    <button
                      type="button"
                      onClick={toggleQuestionBookmark}
                      aria-label={isCurrentQuestionBookmarked ? "Remove bookmark" : "Bookmark question"}
                      title={isCurrentQuestionBookmarked ? "Remove bookmark" : "Bookmark question"}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                        isCurrentQuestionBookmarked
                          ? "text-amber-400 dark:text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Bookmark className={`h-4.5 w-4.5 ${isCurrentQuestionBookmarked ? "fill-current" : ""}`} />
                    </button>
                    
                    <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-muted-foreground hover:text-destructive/80 gap-1 rounded-full"
                          data-testid="button-report-problem"
                        >
                          <MessageCircleQuestion className="h-3.5 w-3.5" />
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
              disabled={currentIndex === 0 || isGrading || (isRetryQuestion && (currentIndex === 0 || !allQuestions[currentIndex - 1]?.isRetry))}
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
                className="rounded-full h-9 sm:h-11 px-3 sm:px-4 shrink-0 bg-primary/20 backdrop-blur-sm border-primary hover:bg-primary/15 gap-2 font-semibold transition-all group shadow-primary/70"
                data-testid="button-ask-pip"
              >
                <AskPipIcon size={22} className="sm:w-6 sm:h-6" />
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
                  disabled={!currentQuestion?.isRetry && allQuestions[currentIndex + 1]?.isRetry && !allOriginalChecked}
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
              disabled={currentIndex >= allQuestions.length - 1 || isGrading || (!currentQuestion?.isRetry && allQuestions[currentIndex + 1]?.isRetry && !allOriginalChecked)}
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
        quizId={currentQuiz.id}
        quizTitle={currentQuiz.title}
        questions={currentQuiz.questions}
        currentQuestionIndex={Math.min(currentIndex, currentQuiz.questions.length - 1)}
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
      />

      {renderRevisionScreen()}
    </>
  );
}
