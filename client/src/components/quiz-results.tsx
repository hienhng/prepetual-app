import { useState } from "react";
import { useLocation } from "wouter";
import { Check, X, ChevronDown, ChevronUp, RotateCcw, ArrowRight, LucideMessageCircleQuestion, Lock, UserPlus, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useAuthDialog } from "@/lib/auth-context";
import { motion } from "framer-motion";

export function QuizResults() {
  const [, setLocation] = useLocation();
  const { currentQuiz, quizResult, userAnswers, clearUserAnswers, revisedQuestionsCount, removeSavedProgress } = useQuiz();
  const { user } = useAuth();
  const { openLoginDialog, openSignUpDialog } = useAuthDialog();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const isGuest = !user;

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
    if (percentage >= 90) return "give yourself a pat on the back!";
    if (percentage >= 80) return "you are ready to ace this!";
    if (percentage >= 70) return "you're on the right track!";
    if (percentage >= 60) return "great effort, keep practicing!";
    return "efforts matter more than results!";
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

  const handleContinue = () => {
    // Clear saved progress from API when leaving results
    if (currentQuiz?.id) {
      removeSavedProgress(currentQuiz.id);
    }
    
    // Check if we should show revision summary (weekly revisions > 5)
    const WEEKLY_REVISIONS_KEY = "prepetual_weekly_revisions";
    let shouldShowRevision = false;
    
    try {
      const stored = localStorage.getItem(WEEKLY_REVISIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        const currentWeekStart = weekStart.toISOString().split('T')[0];
        
        if (data.weekStart === currentWeekStart) {
          // Add current quiz revisions to check threshold
          const projectedTotal = data.count + revisedQuestionsCount;
          shouldShowRevision = projectedTotal > 5 && revisedQuestionsCount > 0;
        } else {
          shouldShowRevision = revisedQuestionsCount > 5;
        }
      } else {
        shouldShowRevision = revisedQuestionsCount > 5;
      }
    } catch (e) {
      shouldShowRevision = revisedQuestionsCount > 5;
    }
    
    if (shouldShowRevision && !isGuest) {
      setLocation("/revision-summary");
    } else {
      setLocation(user ? "/dashboard" : "/");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`${getScoreBg()} border-0`}>
          <CardContent className="p-8 md:p-12 text-center">
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: 0.2, ease: "easeIn" }}
                className="relative w-48 h-48"
              >
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted/30"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    className={getScoreColor()}
                    initial={{ strokeDashoffset: 440 }}
                    animate={{ strokeDashoffset: 440 - (440 * percentage) / 100 }}
                    transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
                    style={{ strokeDasharray: 440 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    className={`text-4xl font-bold ${getScoreColor()}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    data-testid="text-score-percentage"
                  >
                    {percentage}%
                  </motion.div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4 }}
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                {/* <Trophy className={`h-6 w-6 ${getScoreColor()}`} /> */}
                <h2 className={`text-2xl font-bold ${getScoreColor()}`}>{getScoreMessage()}</h2>
              </div>
              <p className="text-muted-foreground">
                You answered <span className="font-semibold text-foreground">{quizResult.correctAnswers}</span> out of <span className="font-semibold text-foreground">{quizResult.totalQuestions}</span> questions correctly
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
            <LucideMessageCircleQuestion className="h-5 w-5 text-primary" />
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
              const isCorrect = quizResult.wrongQuestionIds
                ? !quizResult.wrongQuestionIds.includes(question.id)
                : userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
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
                        {question.imageUrl && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-border">
                            <img 
                              src={question.imageUrl} 
                              alt="Question reference image"
                              className="w-full max-h-48 object-contain bg-muted/30"
                              data-testid={`image-question-${index}`}
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Answer</p>
                          <p className={`text-sm font-medium ${isCorrect ? "text-success" : "text-destructive"}`}>
                            {userAnswer || "No answer provided"}
                          </p>
                        </div>
                        {!isCorrect && question.type !== "short_answer" && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Correct Answer</p>
                            <p className="text-sm font-medium text-success">{question.correctAnswer}</p>
                          </div>
                        )}
                        {question.explanation && !isGuest && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Explanation</p>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                          </div>
                        )}
                        {!isCorrect && userAnswer && question.wrongAnswerExplanations && !isGuest && (() => {
                          // Helper function to find wrong answer explanation with flexible matching
                          const getExplanation = () => {
                            if (question.wrongAnswerExplanations![userAnswer]) {
                              return question.wrongAnswerExplanations![userAnswer];
                            }
                            const answerWithoutPrefix = userAnswer.replace(/^[A-D]\)\s*/, "").trim();
                            if (question.wrongAnswerExplanations![answerWithoutPrefix]) {
                              return question.wrongAnswerExplanations![answerWithoutPrefix];
                            }
                            for (const [key, value] of Object.entries(question.wrongAnswerExplanations!)) {
                              const keyWithoutPrefix = key.replace(/^[A-D]\)\s*/, "").trim();
                              if (keyWithoutPrefix.toLowerCase() === answerWithoutPrefix.toLowerCase() ||
                                  key.toLowerCase() === userAnswer.toLowerCase()) {
                                return value;
                              }
                            }
                            return null;
                          };
                          const explanation = getExplanation();
                          return explanation ? (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide mb-1">Why This Was Wrong</p>
                                  <p className="text-sm text-muted-foreground">{explanation}</p>
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}
                        {question.explanation && isGuest && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <p className="text-xs italic">Sign up to see explanations</p>
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

      {isGuest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Unlock Full Features</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Sign up for free to see detailed explanations, revise your incorrect answers, track your progress, save quizzes, and create your own study materials!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="gap-2" onClick={openSignUpDialog} data-testid="button-guest-signup">
                  <UserPlus className="h-4 w-4" />
                  Create Free Account
                </Button>
                <Button variant="outline" onClick={openLoginDialog} data-testid="button-guest-login">
                  Already have an account? Sign in
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isGuest ? 0.6 : 0.5 }}
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
          onClick={handleContinue}
          className="flex-1 gap-2"
          data-testid="button-continue"
        >
          <ArrowRight className="h-4 w-4" />
          Continue
        </Button>
      </motion.div>
    </div>
  );
}
