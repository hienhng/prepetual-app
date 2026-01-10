import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Check, X, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCheck, FileText, PanelRightOpen, PanelRightClose, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "@shared/schema";
import { MaterialViewerDialog, MaterialViewerSidebar } from "@/components/material-viewer";

export function QuizPlayer() {
  const [, setLocation] = useLocation();
  const { currentQuiz, userAnswers, setUserAnswer, setQuizResult, sourceMaterial } = useQuiz();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());
  const [showMaterial, setShowMaterial] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  
  // Spaced repetition: track wrong answers for retry round
  const [wrongAnswerIds, setWrongAnswerIds] = useState<Set<string>>(new Set());
  const [retryAnswers, setRetryAnswers] = useState<Record<string, string>>({});
  const [retryChecked, setRetryChecked] = useState<Set<string>>(new Set());
  
  const isGuest = !user;

  if (!currentQuiz) {
    return null;
  }

  const originalQuestions = currentQuiz.questions;
  
  // Build the combined question list: original questions + retry questions (clones of wrong ones)
  const allQuestions = useMemo(() => {
    const wrongQuestions = originalQuestions.filter(q => wrongAnswerIds.has(q.id));
    // Create "cloned" retry questions with a special marker
    const retryQuestions = wrongQuestions.map(q => ({
      ...q,
      id: `retry-${q.id}`, // Unique ID for retry version
      originalId: q.id,
      isRetry: true as const,
    }));
    return [...originalQuestions.map(q => ({ ...q, isRetry: false as const, originalId: q.id })), ...retryQuestions];
  }, [originalQuestions, wrongAnswerIds]);

  const currentQuestion = allQuestions[currentIndex];
  const isRetryQuestion = currentQuestion?.isRetry;
  const originalQuestionCount = originalQuestions.length;
  
  // Progress shows completion of original questions only
  const mainProgress = Math.min(currentIndex + 1, originalQuestionCount);
  const progress = (mainProgress / originalQuestionCount) * 100;
  
  // Get the right answer and checked status based on whether it's a retry
  const getQuestionKey = (q: typeof currentQuestion) => q?.isRetry ? q.id : q?.originalId;
  
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
      if (currentQuestion.isRetry) {
        setRetryChecked(prev => new Set(prev).add(currentQuestion.id));
      } else {
        setCheckedQuestions(prev => new Set(prev).add(currentQuestion.originalId));
        
        // Track wrong answers for retry round (only for original questions)
        if (!isCorrectAnswer(answerToCheck, currentQuestion)) {
          setWrongAnswerIds(prev => new Set(prev).add(currentQuestion.originalId));
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

  const finishQuiz = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: currentQuiz.id,
          answers: userAnswers, // Only original answers count for scoring
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
        return <Badge variant="secondary">Multiple Choice</Badge>;
      case "true_false":
        return <Badge className="bg-quiz-purple text-white">True/False</Badge>;
      case "short_answer":
        return <Badge className="bg-quiz-orange text-white">Short Answer</Badge>;
    }
  };

  const getOptionStyle = (option: string) => {
    const isSelected = selectedAnswer === option;
    const isCorrectOpt = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    
    if (!isChecked) {
      return isSelected 
        ? "ring-2 ring-primary bg-primary/5" 
        : "hover:bg-muted/50";
    }
    
    if (isCorrectOpt) {
      return "ring-2 ring-green-500 bg-green-500/10";
    }
    
    if (isSelected && !isCorrectOpt) {
      return "ring-2 ring-red-500 bg-red-500/10";
    }
    
    return "opacity-50";
  };

  const renderFeedback = () => {
    if (!isChecked) return null;
    
    const correct = isCorrect();
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6"
      >
        <Card className={`${correct ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                correct ? "bg-green-500" : "bg-red-500"
              }`}>
                {correct ? (
                  <Check className="h-5 w-5 text-white" />
                ) : (
                  <X className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {correct ? "Correct!" : "Incorrect"}
                </p>
                {!correct && (
                  <p className="text-sm text-muted-foreground mt-1">
                    The correct answer is: <span className="font-medium text-foreground">{currentQuestion.correctAnswer}</span>
                  </p>
                )}
                {currentQuestion.explanation && !isGuest && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentQuestion.explanation}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
              <Card
                key={option}
                className={`
                  p-4 sm:p-6 transition-all min-h-[56px]
                  ${!isChecked ? "cursor-pointer hover:scale-[1.02]" : ""}
                  ${getOptionStyle(option)}
                `}
                onClick={() => handleSelectAnswer(option)}
                data-testid={`option-${option.toLowerCase()}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-medium">{option}</span>
                  {isChecked ? (
                    isCorrectOpt ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    ) : isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    ) : null
                  ) : isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : null}
                </div>
              </Card>
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
            className="py-6 text-lg"
            disabled={isChecked}
            data-testid="input-short-answer"
          />
        </div>
      );
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {currentQuestion.options?.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOpt = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
          
          return (
            <Card
              key={index}
              className={`
                p-3 sm:p-5 transition-all min-h-[56px]
                ${!isChecked ? "cursor-pointer hover:scale-[1.01]" : ""}
                ${getOptionStyle(option)}
              `}
              onClick={() => handleSelectAnswer(option)}
              data-testid={`option-${index}`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`
                  w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0
                  ${isChecked && isCorrectOpt
                    ? "border-green-500 bg-green-500 text-white"
                    : isChecked && isSelected && !isCorrectOpt
                      ? "border-red-500 bg-red-500 text-white"
                      : isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                  }
                `}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-sm sm:text-base flex-1">{option}</span>
                {isChecked ? (
                  isCorrectOpt ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="h-4 w-4 text-white" />
                    </div>
                  ) : null
                ) : isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  // Calculate if all questions (including retries) have been checked
  const allOriginalChecked = checkedQuestions.size === originalQuestionCount;
  const retryQuestionsInList = allQuestions.filter(q => q.isRetry);
  const allRetryChecked = retryQuestionsInList.every(q => retryChecked.has(q.id));
  const isLastQuestion = currentIndex === allQuestions.length - 1;
  const canFinish = allOriginalChecked && (retryQuestionsInList.length === 0 || allRetryChecked);
    
  const canCheck = !isChecked && (selectedAnswer || (currentQuestion?.type === "short_answer" && shortAnswerInput.trim()));
  const hasMaterial = sourceMaterial.text || currentQuiz?.sourceText;

  if (!currentQuestion) return null;

  // Display question number - for retries, show which original question it refers to
  const displayQuestionNum = isRetryQuestion 
    ? originalQuestions.findIndex(q => q.id === currentQuestion.originalId) + 1
    : currentIndex + 1;

  return (
    <>
      <div className="flex w-full">
        {/* Main quiz content */}
        <div className={`flex-1 transition-all duration-300 ${showMaterial ? "lg:pr-0" : ""}`}>
          <div className={`w-full mx-auto pb-24 sm:pb-0 ${showMaterial ? "max-w-2xl lg:max-w-none lg:px-6" : "max-w-3xl"}`}>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3 sm:pb-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isRetryQuestion && (
                    <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      2nd Chance
                    </Badge>
                  )}
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Question {displayQuestionNum} of {originalQuestionCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {checkedQuestions.size} answered
                  </span>
                  {hasMaterial && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMaterial(!showMaterial)}
                      className="hidden lg:flex gap-1"
                      data-testid="button-toggle-material"
                    >
                      {showMaterial ? (
                        <>
                          <PanelRightClose className="h-4 w-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <PanelRightOpen className="h-4 w-4" />
                          Material
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <Progress 
                value={progress} 
                className="h-2" 
                data-testid="progress-quiz" 
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="mb-4 sm:mb-6">
                  <CardContent className="p-4 sm:p-8 md:p-12">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      {isRetryQuestion ? (
                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 dark:text-orange-400">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Q{displayQuestionNum}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Q{displayQuestionNum}
                        </Badge>
                      )}
                      {getQuestionTypeBadge(currentQuestion.type)}
                    </div>
                    
                    <h2 className="text-lg sm:text-2xl font-semibold text-foreground mb-5 sm:mb-8" data-testid="text-question">
                      {currentQuestion.question}
                    </h2>

                    {renderAnswerOptions()}
                    {renderFeedback()}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Desktop navigation */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="gap-2"
                data-testid="button-previous"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div className="flex items-center gap-3">
                {hasMaterial && (
                  <Button
                    variant="outline"
                    onClick={() => setShowMaterialDialog(true)}
                    className="gap-2 lg:hidden"
                    data-testid="button-view-material-tablet"
                  >
                    <FileText className="h-4 w-4" />
                    View Material
                  </Button>
                )}
                {!isChecked ? (
                  <Button
                    onClick={handleCheck}
                    disabled={!canCheck}
                    className="gap-2"
                    data-testid="button-check"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Check Answer
                  </Button>
                ) : isLastQuestion ? (
                  <Button
                    onClick={finishQuiz}
                    disabled={isSubmitting || !canFinish}
                    className="gap-2"
                    data-testid="button-finish"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Finishing...
                      </>
                    ) : (
                      <>
                        See Results
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={goToNext}
                    className="gap-2"
                    data-testid="button-next"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile fixed bottom navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 flex items-center justify-between gap-2 sm:hidden z-50">
              <Button
                variant="outline"
                size="lg"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="min-h-[48px] px-3"
                data-testid="button-previous-mobile"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              {hasMaterial && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowMaterialDialog(true)}
                  className="min-h-[48px] px-3"
                  data-testid="button-view-material-mobile"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}

              {!isChecked ? (
                <Button
                  size="lg"
                  onClick={handleCheck}
                  disabled={!canCheck}
                  className="flex-1 min-h-[48px]"
                  data-testid="button-check-mobile"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Check
                </Button>
              ) : isLastQuestion ? (
                <Button
                  size="lg"
                  onClick={finishQuiz}
                  disabled={isSubmitting || !canFinish}
                  className="flex-1 min-h-[48px]"
                  data-testid="button-finish-mobile"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Results
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={goToNext}
                  className="flex-1 min-h-[48px]"
                  data-testid="button-next-mobile"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {isLastQuestion && !canFinish && (
              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                Answer all questions to see results
              </p>
            )}
          </div>
        </div>

        {/* Desktop material sidebar */}
        {showMaterial && hasMaterial && (
          <div className="hidden lg:block w-96 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-0">
            <MaterialViewerSidebar onClose={() => setShowMaterial(false)} />
          </div>
        )}
      </div>

      {/* Mobile/tablet material dialog */}
      <MaterialViewerDialog 
        isOpen={showMaterialDialog} 
        onClose={() => setShowMaterialDialog(false)} 
      />
    </>
  );
}
