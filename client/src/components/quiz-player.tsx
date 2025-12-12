import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Check, ArrowRight, Loader2 } from "lucide-react";
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
  const { currentQuiz, userAnswers, setUserAnswer, setQuizResult, clearUserAnswers } = useQuiz();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");

  if (!currentQuiz) {
    return null;
  }

  const questions = currentQuiz.questions;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const selectedAnswer = userAnswers[currentQuestion.id];
  const answeredCount = Object.keys(userAnswers).length;

  const handleSelectAnswer = (answer: string) => {
    setUserAnswer(currentQuestion.id, answer);
  };

  const handleShortAnswerSubmit = () => {
    if (shortAnswerInput.trim()) {
      setUserAnswer(currentQuestion.id, shortAnswerInput.trim());
      setShortAnswerInput("");
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

  const submitQuiz = async () => {
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

  const renderAnswerOptions = () => {
    if (currentQuestion.type === "true_false") {
      return (
        <div className="grid grid-cols-2 gap-4">
          {["True", "False"].map((option) => (
            <Card
              key={option}
              className={`
                p-6 cursor-pointer transition-all hover:scale-[1.02]
                ${selectedAnswer === option 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : "hover:bg-muted/50"
                }
              `}
              onClick={() => handleSelectAnswer(option)}
              data-testid={`option-${option.toLowerCase()}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{option}</span>
                {selectedAnswer === option && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (currentQuestion.type === "short_answer") {
      return (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              value={selectedAnswer || shortAnswerInput}
              onChange={(e) => {
                setShortAnswerInput(e.target.value);
                if (selectedAnswer) {
                  setUserAnswer(currentQuestion.id, e.target.value);
                }
              }}
              placeholder="Type your answer here..."
              className="flex-1 py-6 text-lg"
              data-testid="input-short-answer"
            />
            <Button
              onClick={handleShortAnswerSubmit}
              disabled={!shortAnswerInput.trim() && !selectedAnswer}
              data-testid="button-submit-answer"
            >
              <Check className="h-5 w-5" />
            </Button>
          </div>
          {selectedAnswer && (
            <div className="flex items-center gap-2 text-sm text-success">
              <Check className="h-4 w-4" />
              Answer saved
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {currentQuestion.options?.map((option, index) => (
          <Card
            key={index}
            className={`
              p-5 cursor-pointer transition-all hover:scale-[1.01]
              ${selectedAnswer === option 
                ? "ring-2 ring-primary bg-primary/5" 
                : "hover:bg-muted/50"
              }
            `}
            onClick={() => handleSelectAnswer(option)}
            data-testid={`option-${index}`}
          >
            <div className="flex items-center gap-4">
              <div className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm
                ${selectedAnswer === option 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-muted-foreground/30"
                }
              `}>
                {String.fromCharCode(65 + index)}
              </div>
              <span className="text-base flex-1">{option}</span>
              {selectedAnswer === option && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {answeredCount} answered
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
          <Card className="mb-6">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="outline" className="text-xs">
                  Q{currentIndex + 1}
                </Badge>
                {getQuestionTypeBadge(currentQuestion.type)}
              </div>
              
              <h2 className="text-2xl font-semibold text-foreground mb-8" data-testid="text-question">
                {currentQuestion.question}
              </h2>

              {renderAnswerOptions()}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="gap-2"
          data-testid="button-previous"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setShortAnswerInput(userAnswers[questions[index]?.id] || "");
              }}
              className={`
                w-3 h-3 rounded-full transition-all
                ${index === currentIndex 
                  ? "bg-primary scale-125" 
                  : userAnswers[questions[index]?.id]
                    ? "bg-primary/50"
                    : "bg-muted"
                }
              `}
              data-testid={`dot-${index}`}
            />
          ))}
        </div>

        {currentIndex === questions.length - 1 ? (
          <Button
            onClick={submitQuiz}
            disabled={isSubmitting || answeredCount < questions.length}
            className="gap-2"
            data-testid="button-submit-quiz"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Quiz
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
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {answeredCount < questions.length && currentIndex === questions.length - 1 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Please answer all questions before submitting
        </p>
      )}
    </div>
  );
}
