import { useState, useMemo } from "react";
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
  const [isRetryRound, setIsRetryRound] = useState(false);
  const [retryIndex, setRetryIndex] = useState(0);
  const [retryChecked, setRetryChecked] = useState<Set<string>>(new Set());
  const [retryAnswers, setRetryAnswers] = useState<Record<string, string>>({});
  
  const isGuest = !user;

  if (!currentQuiz) {
    return null;
  }

  const questions = currentQuiz.questions;
  
  // Get retry questions (ones that were answered wrong)
  const retryQuestions = useMemo(() => {
    return questions.filter(q => wrongAnswerIds.has(q.id));
  }, [questions, wrongAnswerIds]);

  // Current question depends on whether we're in retry round
  const currentQuestion = isRetryRound 
    ? retryQuestions[retryIndex] 
    : questions[currentIndex];
    
  const progress = isRetryRound 
    ? 100 // Main quiz is complete during retry
    : ((currentIndex + 1) / questions.length) * 100;
    
  const selectedAnswer = isRetryRound 
    ? retryAnswers[currentQuestion?.id] 
    : userAnswers[currentQuestion?.id];
    
  const isChecked = isRetryRound 
    ? retryChecked.has(currentQuestion?.id) 
    : checkedQuestions.has(currentQuestion?.id);

  const isCorrectAnswer = (answer: string | undefined, question: Question) => {
    if (!answer) return false;
    const normalizedUser = answer.toLowerCase().trim();
    const normalizedCorrect = question.correctAnswer.toLowerCase().trim();
    return normalizedUser === normalizedCorrect;
  };

  const isCorrect = () => {
    return isCorrectAnswer(selectedAnswer, currentQuestion);
  };

  const handleSelectAnswer = (answer: string) => {
    if (isChecked) return;
    if (isRetryRound) {
      setRetryAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    } else {
      setUserAnswer(currentQuestion.id, answer);
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
      if (isRetryRound) {
        setRetryAnswers(prev => ({ ...prev, [currentQuestion.id]: answerToCheck! }));
      } else {
        setUserAnswer(currentQuestion.id, answerToCheck);
      }
    }
    
    if (answerToCheck || (currentQuestion.type === "short_answer" && shortAnswerInput.trim())) {
      if (isRetryRound) {
        setRetryChecked(prev => new Set(prev).add(currentQuestion.id));
      } else {
        setCheckedQuestions(prev => new Set(prev).add(currentQuestion.id));
        
        // Track wrong answers for retry round
        if (!isCorrectAnswer(answerToCheck, currentQuestion)) {
          setWrongAnswerIds(prev => new Set(prev).add(currentQuestion.id));
        }
      }
    }
  };

  const goToNext = () => {
    if (isRetryRound) {
      if (retryIndex < retryQuestions.length - 1) {
        setRetryIndex(retryIndex + 1);
        setShortAnswerInput(retryAnswers[retryQuestions[retryIndex + 1]?.id] || "");
      }
    } else {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShortAnswerInput(userAnswers[questions[currentIndex + 1]?.id] || "");
      }
    }
  };

  const goToPrevious = () => {
    if (isRetryRound) {
      if (retryIndex > 0) {
        setRetryIndex(retryIndex - 1);
        setShortAnswerInput(retryAnswers[retryQuestions[retryIndex - 1]?.id] || "");
      }
    } else {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setShortAnswerInput(userAnswers[questions[currentIndex - 1]?.id] || "");
      }
    }
  };

  const startRetryRound = () => {
    setIsRetryRound(true);
    setRetryIndex(0);
    setShortAnswerInput("");
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: currentQuiz.id,
          answers: userAnswers, // Only original answers count
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

  // Check if we're at the end of main quiz and have wrong answers to retry
  const isMainQuizComplete = checkedQuestions.size === questions.length;
  const hasWrongAnswers = wrongAnswerIds.size > 0;
  const shouldShowRetryPrompt = isMainQuizComplete && hasWrongAnswers && !isRetryRound;
  
  const isLastQuestion = isRetryRound 
    ? retryIndex === retryQuestions.length - 1 
    : currentIndex === questions.length - 1;
    
  const canCheck = !isChecked && (selectedAnswer || (currentQuestion?.type === "short_answer" && shortAnswerInput.trim()));
  const hasMaterial = sourceMaterial.text || currentQuiz?.sourceText;

  // Show retry prompt screen
  if (shouldShowRetryPrompt) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Time for a Quick Review!</h2>
                  <p className="text-white/90">You got {wrongAnswerIds.size} question{wrongAnswerIds.size > 1 ? 's' : ''} wrong</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6">
                Studies show that reviewing incorrect answers immediately helps you remember them better. 
                Let's go through those questions one more time before seeing your final results.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Don't worry - this practice round won't affect your score!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={startRetryRound} className="flex-1 gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Practice {wrongAnswerIds.size} Question{wrongAnswerIds.size > 1 ? 's' : ''}
                </Button>
                <Button variant="outline" onClick={finishQuiz} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Finishing...
                    </>
                  ) : (
                    "Skip to Results"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <>
      <div className="flex w-full">
        {/* Main quiz content */}
        <div className={`flex-1 transition-all duration-300 ${showMaterial ? "lg:pr-0" : ""}`}>
          <div className={`w-full mx-auto pb-24 sm:pb-0 ${showMaterial ? "max-w-2xl lg:max-w-none lg:px-6" : "max-w-3xl"}`}>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3 sm:pb-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                {isRetryRound ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500 text-white">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Practice Round
                    </Badge>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {retryIndex + 1} of {retryQuestions.length}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {!isRetryRound && (
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {checkedQuestions.size} answered
                    </span>
                  )}
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
                value={isRetryRound ? ((retryIndex + 1) / retryQuestions.length) * 100 : progress} 
                className={`h-2 ${isRetryRound ? "[&>div]:bg-orange-500" : ""}`} 
                data-testid="progress-quiz" 
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${isRetryRound ? 'retry-' : ''}${currentQuestion.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="mb-4 sm:mb-6">
                  <CardContent className="p-4 sm:p-8 md:p-12">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      {isRetryRound ? (
                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 dark:text-orange-400">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Retry
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Q{currentIndex + 1}
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
                disabled={isRetryRound ? retryIndex === 0 : currentIndex === 0}
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
                ) : isRetryRound && isLastQuestion ? (
                  <Button
                    onClick={finishQuiz}
                    disabled={isSubmitting || retryChecked.size < retryQuestions.length}
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
                ) : isLastQuestion && !isRetryRound ? (
                  // This case is handled by the retry prompt screen now
                  <Button
                    onClick={finishQuiz}
                    disabled={isSubmitting || checkedQuestions.size < questions.length}
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
                disabled={isRetryRound ? retryIndex === 0 : currentIndex === 0}
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
              ) : isRetryRound && isLastQuestion ? (
                <Button
                  size="lg"
                  onClick={finishQuiz}
                  disabled={isSubmitting || retryChecked.size < retryQuestions.length}
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
              ) : isLastQuestion && !isRetryRound ? (
                <Button
                  size="lg"
                  onClick={finishQuiz}
                  disabled={isSubmitting || checkedQuestions.size < questions.length}
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

            {!isRetryRound && isLastQuestion && checkedQuestions.size < questions.length && (
              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                Answer all questions to see results
              </p>
            )}
            
            {isRetryRound && isLastQuestion && retryChecked.size < retryQuestions.length && (
              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                Practice all questions to see your results
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
