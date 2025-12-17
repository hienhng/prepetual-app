import { useState } from "react";
import { useLocation } from "wouter";
import { Check, X, ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuiz } from "@/lib/quiz-context";
import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "@shared/schema";

export function QuizPlayer() {
  const [, setLocation] = useLocation();
  const { currentQuiz, userAnswers, setUserAnswer, setQuizResult } = useQuiz();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());

  if (!currentQuiz) {
    return null;
  }

  const questions = currentQuiz.questions;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const selectedAnswer = userAnswers[currentQuestion.id];
  const isChecked = checkedQuestions.has(currentQuestion.id);

  const isCorrect = () => {
    if (!selectedAnswer) return false;
    const normalizedUser = selectedAnswer.toLowerCase().trim();
    const normalizedCorrect = currentQuestion.correctAnswer.toLowerCase().trim();
    return normalizedUser === normalizedCorrect;
  };

  const handleSelectAnswer = (answer: string) => {
    if (isChecked) return;
    setUserAnswer(currentQuestion.id, answer);
  };

  const handleShortAnswerChange = (value: string) => {
    if (isChecked) return;
    setShortAnswerInput(value);
  };

  const handleCheck = () => {
    if (currentQuestion.type === "short_answer" && shortAnswerInput.trim()) {
      setUserAnswer(currentQuestion.id, shortAnswerInput.trim());
    }
    
    if (selectedAnswer || (currentQuestion.type === "short_answer" && shortAnswerInput.trim())) {
      setCheckedQuestions(prev => new Set(prev).add(currentQuestion.id));
    }
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShortAnswerInput(userAnswers[questions[currentIndex + 1]?.id] || "");
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShortAnswerInput(userAnswers[questions[currentIndex - 1]?.id] || "");
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
        return <Badge variant="secondary">Multiple Choice</Badge>;
      case "true_false":
        return <Badge className="bg-quiz-purple text-white">True/False</Badge>;
      case "short_answer":
        return <Badge className="bg-quiz-orange text-white">Short Answer</Badge>;
    }
  };

  const getOptionStyle = (option: string) => {
    const isSelected = selectedAnswer === option;
    const isCorrectAnswer = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    
    if (!isChecked) {
      return isSelected 
        ? "ring-2 ring-primary bg-primary/5" 
        : "hover:bg-muted/50";
    }
    
    if (isCorrectAnswer) {
      return "ring-2 ring-green-500 bg-green-500/10";
    }
    
    if (isSelected && !isCorrectAnswer) {
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
                {currentQuestion.explanation && (
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
            const isCorrectAnswer = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
            
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
                    isCorrectAnswer ? (
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
          const isCorrectAnswer = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
          
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
                  ${isChecked && isCorrectAnswer
                    ? "border-green-500 bg-green-500 text-white"
                    : isChecked && isSelected && !isCorrectAnswer
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
                  isCorrectAnswer ? (
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

  const isLastQuestion = currentIndex === questions.length - 1;
  const canCheck = !isChecked && (selectedAnswer || (currentQuestion.type === "short_answer" && shortAnswerInput.trim()));

  return (
    <div className="w-full max-w-3xl mx-auto pb-24 sm:pb-0">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3 sm:pb-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {checkedQuestions.size} answered
          </span>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-quiz" />
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
                <Badge variant="outline" className="text-xs">
                  Q{currentIndex + 1}
                </Badge>
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
          {!isChecked ? (
            <Button
              onClick={handleCheck}
              disabled={!canCheck}
              className="gap-2"
              data-testid="button-check"
            >
              <Sparkles className="h-4 w-4" />
              Check Answer
            </Button>
          ) : isLastQuestion ? (
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
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 flex items-center justify-between gap-3 sm:hidden z-50">
        <Button
          variant="outline"
          size="lg"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="flex-1 min-h-[48px]"
          data-testid="button-previous-mobile"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {!isChecked ? (
          <Button
            size="lg"
            onClick={handleCheck}
            disabled={!canCheck}
            className="flex-1 min-h-[48px]"
            data-testid="button-check-mobile"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Check
          </Button>
        ) : isLastQuestion ? (
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

      {isLastQuestion && checkedQuestions.size < questions.length && (
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
          Please answer all questions before seeing results
        </p>
      )}
    </div>
  );
}
