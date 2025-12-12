import { useState } from "react";
import { useLocation } from "wouter";
import { Trophy, Check, X, ChevronDown, ChevronUp, RotateCcw, Home, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuiz } from "@/lib/quiz-context";
import { motion } from "framer-motion";

export function QuizResults() {
  const [, setLocation] = useLocation();
  const { currentQuiz, quizResult, userAnswers, resetQuiz, clearUserAnswers } = useQuiz();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  if (!currentQuiz || !quizResult) {
    return null;
  }

  const percentage = Math.round((quizResult.correctAnswers / quizResult.totalQuestions) * 100);
  
  const getScoreColor = () => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-quiz-orange";
    return "text-destructive";
  };

  const getScoreBg = () => {
    if (percentage >= 80) return "bg-success/10";
    if (percentage >= 60) return "bg-quiz-orange/10";
    return "bg-destructive/10";
  };

  const getScoreMessage = () => {
    if (percentage >= 90) return "Outstanding!";
    if (percentage >= 80) return "Great job!";
    if (percentage >= 70) return "Good work!";
    if (percentage >= 60) return "Not bad!";
    return "Keep practicing!";
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const retakeQuiz = () => {
    clearUserAnswers();
    setLocation("/quiz");
  };

  const startNew = () => {
    resetQuiz();
    setLocation("/");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className={`${getScoreBg()} border-0`}>
          <CardContent className="p-8 md:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={getScoreColor()}
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - percentage / 100) }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className={`text-4xl font-bold ${getScoreColor()}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    data-testid="text-score-percentage"
                  >
                    {percentage}%
                  </motion.span>
                  <span className="text-sm text-muted-foreground">Score</span>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className={`h-6 w-6 ${getScoreColor()}`} />
                <h2 className={`text-2xl font-bold ${getScoreColor()}`}>{getScoreMessage()}</h2>
              </div>
              <p className="text-muted-foreground">
                You answered {quizResult.correctAnswers} out of {quizResult.totalQuestions} questions correctly
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4"
      >
        <Card className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
            <Check className="h-5 w-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-foreground" data-testid="text-correct-count">
            {quizResult.correctAnswers}
          </p>
          <p className="text-sm text-muted-foreground">Correct</p>
        </Card>

        <Card className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
            <X className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-2xl font-bold text-foreground" data-testid="text-incorrect-count">
            {quizResult.totalQuestions - quizResult.correctAnswers}
          </p>
          <p className="text-sm text-muted-foreground">Incorrect</p>
        </Card>

        <Card className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground" data-testid="text-total-count">
            {quizResult.totalQuestions}
          </p>
          <p className="text-sm text-muted-foreground">Total</p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuiz.questions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
              const isExpanded = expandedQuestions.has(question.id);

              return (
                <div
                  key={question.id}
                  className={`
                    rounded-md border overflow-hidden
                    ${isCorrect ? "border-success/30" : "border-destructive/30"}
                  `}
                >
                  <button
                    onClick={() => toggleQuestion(question.id)}
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
                    data-testid={`button-expand-${index}`}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${isCorrect ? "bg-success/10" : "bg-destructive/10"}
                    `}>
                      {isCorrect ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">Q{index + 1}</Badge>
                        <Badge variant={isCorrect ? "secondary" : "destructive"} className="text-xs">
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{question.question}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 border-t bg-muted/20"
                    >
                      <div className="pt-4 space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Answer</p>
                          <p className={`text-sm font-medium ${isCorrect ? "text-success" : "text-destructive"}`}>
                            {userAnswer || "No answer provided"}
                          </p>
                        </div>
                        {!isCorrect && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Correct Answer</p>
                            <p className="text-sm font-medium text-success">{question.correctAnswer}</p>
                          </div>
                        )}
                        {question.explanation && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Explanation</p>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Button
          variant="outline"
          onClick={retakeQuiz}
          className="flex-1 gap-2"
          data-testid="button-retake"
        >
          <RotateCcw className="h-4 w-4" />
          Retake Quiz
        </Button>
        <Button
          onClick={startNew}
          className="flex-1 gap-2"
          data-testid="button-new-quiz"
        >
          <Home className="h-4 w-4" />
          Create New Quiz
        </Button>
      </motion.div>
    </div>
  );
}
