import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Check, X, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCheck, FileText, PanelRightOpen, PanelRightClose, RotateCcw, Zap, Trophy, Target, ChevronUp, Star, Flame, BadgeCheck, BookCheck, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "@shared/schema";
import { MaterialViewerDialog, MaterialViewerSidebar } from "@/components/material-viewer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import confetti from "canvas-confetti";

const encouragingMessages = {
  correct: [
    "Excellent work!",
    "You nailed it!",
    "Brilliant!",
    "Keep it up!",
    "Perfect!",
    "Outstanding!",
    "You're on fire!",
    "Impressive!",
  ],
  retryCorrect: [
    "Look at that improvement!",
    "You learned from the last one! Amazing!",
    "Second time's the charm! Great job!",
    "You've mastered this now!",
    "Growth mindset in action!",
    "Persistence pays off! Well done!",
    "You didn't give up and it shows!",
    "That's how you learn! Fantastic!",
  ],
  incorrect: [
    "Don't worry, keep learning!",
    "You'll get the next one!",
    "Learning in progress!",
    "Every mistake is a lesson!",
    "Stay curious!",
  ],
  streak: [
    "2 in a row!",
    "3 in a row! Nice!",
    "4 in a row! Amazing!",
    "5+ streak! Unstoppable!",
  ],
};

const getRandomMessage = (type: "correct" | "incorrect" | "retryCorrect") => {
  const messages = encouragingMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
};

const getStreakMessage = (streak: number) => {
  if (streak < 2) return null;
  if (streak === 2) return encouragingMessages.streak[0];
  if (streak === 3) return encouragingMessages.streak[1];
  if (streak === 4) return encouragingMessages.streak[2];
  return encouragingMessages.streak[3];
};

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
  } = useQuiz();
  const { user } = useAuth();
  const { state: sidebarState, isMobile } = useSidebar();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [showMaterial, setShowMaterial] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, { message: string; streakAtTime: number }>>({}); 
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  
  const wrongAnswerIds = useRef<Set<string>>(new Set());
  const [retryAnswers, setRetryAnswers] = useState<Record<string, string>>({});
  const [retryChecked, setRetryChecked] = useState<Set<string>>(new Set());
  const hasRestoredRef = useRef(false);
  
  const isGuest = !user;

  if (!currentQuiz) {
    return null;
  }
  
  // Initialize from restored state on mount (from saved progress)
  useEffect(() => {
    if (hasRestoredRef.current || !currentQuiz) return;
    
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
    if (restoredCurrentIndex !== null && restoredCurrentIndex > 0) {
      setCurrentIndex(restoredCurrentIndex);
    }
    
    hasRestoredRef.current = true;
    clearRestoredState(currentQuiz.id);
  }, [currentQuiz, userAnswers, checkedQuestions, restoredCurrentIndex, restoredRetryAnswers, restoredRetryCheckedQuestions, clearRestoredState]);

  // Sync player state to context for save functionality
  useEffect(() => {
    syncPlayerState(currentIndex, retryAnswers, Array.from(retryChecked));
  }, [currentIndex, retryAnswers, retryChecked, syncPlayerState]);

  // Cleanup: reset hasRestoredRef when quiz changes (to allow fresh restoration)
  useEffect(() => {
    return () => {
      hasRestoredRef.current = false;
    };
  }, [currentQuiz?.id]);

  const originalQuestions = currentQuiz.questions;
  
  const allQuestions = useMemo(() => {
    // Only registered users get a 2nd attempt for wrong answers
    const wrongQuestions = !isGuest ? originalQuestions.filter(q => wrongAnswerIds.current.has(q.id)) : [];
    const retryQuestions = wrongQuestions.map(q => ({
      ...q,
      id: `retry-${q.id}`,
      originalId: q.id,
      isRetry: true as const,
    }));
    return [...originalQuestions.map(q => ({ ...q, isRetry: false as const, originalId: q.id })), ...retryQuestions];
  }, [originalQuestions, wrongAnswerIds.current.size, isGuest]);

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

  const handleCheck = () => {
    let answerToCheck = selectedAnswer;
    
    if (currentQuestion.type === "short_answer" && shortAnswerInput.trim()) {
      answerToCheck = shortAnswerInput.trim();
      if (currentQuestion.isRetry) {
        setRetryAnswers(prev => ({ ...prev, [currentQuestion.id]: answerToCheck! }));
      } else {
        setUserAnswer(currentQuestion.originalId, answerToCheck);
      }
    }
    
    if (answerToCheck || (currentQuestion.type === "short_answer" && shortAnswerInput.trim())) {
      const correct = isCorrectAnswer(answerToCheck, currentQuestion);
      const questionKey = currentQuestion.id;
      
      let newStreak = correctStreak;
      let message = "";
      
      if (correct) {
        newStreak = correctStreak + 1;
        setCorrectStreak(newStreak);
        
        // Use special message for retry questions gotten correct
        if (currentQuestion.isRetry) {
          message = getRandomMessage("retryCorrect");
        } else {
          message = getStreakMessage(newStreak) || getRandomMessage("correct");
        }
        
        if (newStreak >= 3) {
          triggerConfetti();
        }
      } else {
        setCorrectStreak(0);
        message = getRandomMessage("incorrect");
      }
      
      setFeedbackMessages(prev => ({
        ...prev,
        [questionKey]: { message, streakAtTime: correct ? newStreak : 0 }
      }));
      
      if (currentQuestion.isRetry) {
        setRetryChecked(prev => new Set(prev).add(currentQuestion.id));
      } else {
        markQuestionChecked(currentQuestion.originalId);
        
        if (!correct) {
          wrongAnswerIds.current.add(currentQuestion.originalId);
        }
      }
    }
  };

  const goToNext = () => {
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
        if (answer && answer.toLowerCase().trim() === rq.correctAnswer.toLowerCase().trim()) {
          retryCorrect++;
        }
      }
      setRetryCorrectCount(retryCorrect);
      
      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: currentQuiz.id,
          answers: userAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      const result = await response.json();
      
      setQuizResult(result);
      setLocation("/results");
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionTypeBadge = (type: Question["type"]) => {
    switch (type) {
      case "multiple_choice":
        return <Badge variant="secondary" className="text-xs">Multiple Choice</Badge>;
      case "true_false":
        return <Badge className="bg-quiz-purple text-white text-xs">True/False</Badge>;
      case "short_answer":
        return <Badge className="bg-quiz-orange text-white text-xs">Short Answer</Badge>;
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
    
    for (const [key, value] of Object.entries(currentQuestion.wrongAnswerExplanations)) {
      const keyWithoutPrefix = key.replace(/^[A-D]\)\s*/, "").trim();
      if (keyWithoutPrefix.toLowerCase() === answerWithoutPrefix.toLowerCase() ||
          key.toLowerCase() === answer.toLowerCase()) {
        return value;
      }
    }
    
    return null;
  };

  const renderFeedback = () => {
    if (!isChecked) return null;
    
    const correct = isCorrect();
    const wrongExplanation = !correct && selectedAnswer && getWrongAnswerExplanation(selectedAnswer);
    const questionFeedback = feedbackMessages[currentQuestion.id];
    const feedbackMessage = questionFeedback?.message || (correct ? "Correct!" : "Incorrect");
    const streakAtTime = questionFeedback?.streakAtTime || 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-6 space-y-3"
      >
        <motion.div
          initial={{ x: correct ? 20 : -20 }}
          animate={{ x: 0 }}
          className={`rounded-2xl p-4 sm:p-5 ${
            correct 
              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30" 
              : "bg-gradient-to-r from-red-500/20 to-rose-500/10 border border-red-500/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                correct ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {correct ? (
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              ) : (
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              )}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-lg sm:text-xl font-bold ${correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {feedbackMessage}
                </p>
                {correct && streakAtTime >= 2 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full"
                  >
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streakAtTime}</span>
                  </motion.div>
                )}
              </div>
              {!correct && (
                <p className="text-sm text-muted-foreground mt-1">
                  Correct answer: <span className="font-semibold text-foreground">{currentQuestion.correctAnswer}</span>
                </p>
              )}
              {currentQuestion.explanation && (!isGuest || isRetryQuestion) && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground mt-3 leading-relaxed"
                >
                  {currentQuestion.explanation}
                </motion.p>
              )}
              {currentQuestion.explanation && isGuest && !isRetryQuestion && (
                <div className="flex items-center gap-2 text-muted-foreground mt-3">
                  <Lock className="h-3 w-3" />
                  <p className="text-xs italic">Sign up to see explanations</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        
        {wrongExplanation && (!isGuest || isRetryQuestion) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500">
                <BookCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  Why this was incorrect
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {wrongExplanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderAnswerOptions = () => {
    if (currentQuestion.type === "true_false") {
      return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {["True", "False"].map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOpt = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
            
            return (
              <motion.button
                key={option}
                whileHover={!isChecked ? { scale: 1.02 } : {}}
                whileTap={!isChecked ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={() => handleSelectAnswer(option)}
                disabled={isChecked}
                data-testid={`option-${option.toLowerCase()}`}
                className={`
                  relative p-5 sm:p-8 rounded-2xl text-left
                  ${!isChecked ? "cursor-pointer" : "cursor-default"}
                  ${isChecked && isCorrectOpt 
                    ? "bg-green-500/15 border-2 border-green-500 shadow-lg shadow-green-500/10" 
                    : isChecked && isSelected && !isCorrectOpt
                      ? "bg-red-500/15 border-2 border-red-500 shadow-lg shadow-red-500/10"
                      : isSelected
                        ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/10"
                        : "bg-card border-2 border-border hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg sm:text-xl font-semibold">{option}</span>
                  <AnimatePresence>
                    {isChecked && isCorrectOpt && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
                      >
                        <Check className="h-5 w-5 text-white" />
                      </motion.div>
                    )}
                    {isChecked && isSelected && !isCorrectOpt && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center"
                      >
                        <X className="h-5 w-5 text-white" />
                      </motion.div>
                    )}
                    {!isChecked && isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="h-5 w-5 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.type === "short_answer") {
      return (
        <div className="space-y-4">
          <Input
            value={isChecked ? (selectedAnswer || shortAnswerInput) : shortAnswerInput}
            onChange={(e) => handleShortAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="py-6 px-5 text-lg rounded-xl border-2 focus:border-primary"
            disabled={isChecked}
            data-testid="input-short-answer"
          />
        </div>
      );
    }

    const optionLabels = ['A', 'B', 'C', 'D'];
    
    return (
      <div className="space-y-3">
        {currentQuestion.options?.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOpt = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
          
          return (
            <motion.button
              key={index}
              whileHover={!isChecked ? { scale: 1.03, x: 4 } : {}}
              whileTap={!isChecked ? { scale: 0.98 } : {}}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                layout: { duration: 0 } 
              }}
              onClick={() => handleSelectAnswer(option)}
              disabled={isChecked}
              data-testid={`option-${index}`}
              className={`
                w-full relative p-4 sm:p-5 rounded-xl text-left
                ${!isChecked ? "cursor-pointer" : "cursor-default"}
                ${isChecked && isCorrectOpt 
                  ? "bg-green-500/15 border-2 border-green-500" 
                  : isChecked && isSelected && !isCorrectOpt
                    ? "bg-red-500/15 border-2 border-red-500"
                    : isSelected
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-card border-2 border-border hover:border-primary/50 hover:bg-muted/30"
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all
                  ${isChecked && isCorrectOpt
                    ? "bg-green-500 text-white"
                    : isChecked && isSelected && !isCorrectOpt
                      ? "bg-red-500 text-white"
                      : isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }
                `}>
                  {optionLabels[index]}
                </div>
                <span className="text-sm sm:text-base flex-1 font-medium">{option}</span>
                <AnimatePresence>
                  {isChecked && isCorrectOpt && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                  {isChecked && isSelected && !isCorrectOpt && (
                    <motion.div
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center"
                    >
                      <X className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                  {!isChecked && isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
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
              <p className="text-sm font-medium text-muted-foreground mb-3">Jump to question</p>
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
  const retryQuestionsInList = allQuestions.filter(q => q.isRetry);
  const allRetryChecked = retryQuestionsInList.every(q => retryChecked.has(q.id));
  const isLastQuestion = currentIndex === allQuestions.length - 1;
  const canFinish = allOriginalChecked && (retryQuestionsInList.length === 0 || allRetryChecked);
    
  const canCheck = !isChecked && (selectedAnswer || (currentQuestion?.type === "short_answer" && shortAnswerInput.trim()));
  const hasMaterial = sourceMaterial.text || currentQuiz?.sourceText;

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
      <div className="flex w-full min-h-[calc(100vh-4rem)] overflow-x-hidden">
        <ResizablePanelGroup direction="horizontal" className="w-full">
          <ResizablePanel defaultSize={100} minSize={30}>
            <div className={`w-full mx-auto pb-32 sm:pb-28 ${showMaterial ? "max-w-2xl lg:max-w-none lg:px-6" : "max-w-3xl px-4"}`}>
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isRetryQuestion && (
                      <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 text-xs font-semibold">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Retry
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
                    {hasMaterial && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMaterial(!showMaterial)}
                        className="hidden lg:flex"
                        data-testid="button-toggle-material"
                      >
                        {showMaterial ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <Progress value={progress} className="h-2.5 rounded-full" data-testid="progress-quiz" />
                  <motion.div
                    className="absolute -top-1 h-4 w-4 bg-primary rounded-full border-2 border-background shadow-lg"
                    style={{ left: `calc(${progress}% - 8px)` }}
                    layoutId="progress-indicator"
                  />
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
                          Q{displayQuestionNum} - Second Chance
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-semibold">
                          Question {displayQuestionNum}
                        </Badge>
                      )}
                      {getQuestionTypeBadge(currentQuestion.type)}
                    </div>
                    
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-snug" data-testid="text-question">
                      {currentQuestion.question}
                    </h2>
                  </div>

                  {currentQuestion.imageUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6 rounded-2xl overflow-hidden border-2 border-border bg-muted/30"
                    >
                      <img 
                        src={currentQuestion.imageUrl} 
                        alt="Question reference"
                        className="w-full max-h-72 sm:max-h-80 object-contain"
                        data-testid="image-question-reference"
                      />
                    </motion.div>
                  )}

                  {renderAnswerOptions()}
                  {renderFeedback()}
                </motion.div>
              </AnimatePresence>
            </div>
          </ResizablePanel>

          {showMaterial && hasMaterial && (
            <>
              <ResizableHandle withHandle className="hidden lg:flex" />
              <ResizablePanel defaultSize={40} minSize={20} className="hidden lg:block">
                <MaterialViewerSidebar
                  onClose={() => setShowMaterial(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {renderQuestionNav()}

      <div 
        className="fixed bottom-0 right-0 left-0 z-30 bg-background/95 backdrop-blur-md border-t transition-[left] duration-300 ease-in-out"
        style={{ 
          left: isMobile ? 0 : sidebarState === 'collapsed' ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)' 
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              size="lg"
              className="gap-2 rounded-xl flex-1 sm:flex-none"
              data-testid="button-previous"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="flex items-center gap-2 flex-1 sm:flex-none justify-center">
              {hasMaterial && (
                <Button
                  variant="outline"
                  onClick={() => setShowMaterialDialog(true)}
                  size="lg"
                  className="rounded-xl lg:hidden"
                  data-testid="button-view-material-mobile"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              
              {!isChecked ? (
                <Button
                  onClick={handleCheck}
                  disabled={!canCheck}
                  size="lg"
                  className="gap-2 rounded-xl min-w-[140px] sm:min-w-[160px] font-semibold"
                  data-testid="button-check"
                >
                  <CheckCheck className="h-5 w-5" />
                  Check
                </Button>
              ) : isLastQuestion ? (
                <Button
                  onClick={finishQuiz}
                  disabled={isSubmitting || !canFinish}
                  size="lg"
                  className="gap-2 rounded-xl min-w-[140px] sm:min-w-[160px] font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  data-testid="button-finish"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      See Results
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={goToNext}
                  size="lg"
                  className="gap-2 rounded-xl min-w-[140px] sm:min-w-[160px] font-semibold"
                  data-testid="button-next"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={currentIndex >= allQuestions.length - 1}
              size="lg"
              className="gap-2 rounded-xl flex-1 sm:flex-none"
              data-testid="button-skip"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <MaterialViewerDialog
        isOpen={showMaterialDialog}
        onClose={() => setShowMaterialDialog(false)}
      />
    </>
  );
}
