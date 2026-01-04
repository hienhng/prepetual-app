import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Trophy, Check, X, ChevronDown, ChevronUp, RotateCcw, Home, Sparkles, LucideMessageCircleQuestion, Lock, UserPlus, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useAuthDialog } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

function AnimatedFlame({ className }: { className?: string }) {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <motion.div
        animate={{
          scale: [1, 1.1, 1, 1.05, 1],
          y: [0, -4, 0, -2, 0],
          skewX: [0, 2, -2, 1, 0],
          filter: [
            "drop-shadow(0 0 10px rgba(249,115,22,0.6))",
            "drop-shadow(0 0 20px rgba(249,115,22,0.8))",
            "drop-shadow(0 0 10px rgba(249,115,22,0.6))"
          ]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Flame className="w-24 h-24 text-quiz-orange fill-quiz-orange" />
      </motion.div>
    </div>
  );
}

export function QuizResults() {
  const [, setLocation] = useLocation();
  const { currentQuiz, quizResult, userAnswers, resetQuiz, clearUserAnswers } = useQuiz();
  const { user } = useAuth();
  const { openLoginDialog, openSignUpDialog } = useAuthDialog();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showStreak, setShowStreak] = useState(false);
  
  useEffect(() => {
    if (quizResult && user) {
      // Simulate streak animation trigger
      const timer = setTimeout(() => {
        setShowStreak(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [quizResult, user]);

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
    return "efforts mattter more than results!";
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
    setLocation("/create");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 relative">
      <AnimatePresence>
        {showStreak && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
            onAnimationComplete={() => {
              setTimeout(() => setShowStreak(false), 3000);
            }}
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: 1,
                  y: [0, -10, 0]
                }}
                transition={{ 
                  scale: { type: "spring", damping: 15, stiffness: 200 },
                  opacity: { duration: 0.3 },
                  y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="bg-background/95 backdrop-blur-xl p-10 rounded-full shadow-[0_0_50px_rgba(249,115,22,0.2)] border-4 border-quiz-orange/30 flex flex-col items-center gap-4 min-w-[280px]"
              >
                <div className="relative">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-quiz-orange blur-3xl rounded-full"
                  />
                  <motion.div
                    animate={{ 
                      scale: [1, 1.03, 1],
                      y: [0, -3, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <AnimatedFlame className="w-32 h-32 relative z-10 drop-shadow-[0_0_10px_rgba(255,77,0,0.3)]" />
                  </motion.div>
                </div>
                <div className="text-center z-10">
                  <motion.h3 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-black text-quiz-orange uppercase tracking-tighter italic"
                  >
                    Daily Streak!
                  </motion.h3>
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-bold text-foreground/80"
                  >
                    You're on fire!
                  </motion.p>
                </div>
              </motion.div>
              
              {/* Refined Particle effects */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, Math.random() * 1 + 0.5, 0],
                    x: (Math.random() - 0.5) * 500,
                    y: (Math.random() - 0.5) * 500,
                  }}
                  transition={{ 
                    duration: Math.random() * 2 + 1,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-gradient-to-t from-quiz-orange to-yellow-400 rounded-full blur-[1px]"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                        {question.explanation && !isGuest && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Explanation</p>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                          </div>
                        )}
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
                Sign up for free to see detailed explanations, track your progress, save quizzes, and create your own study materials!
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
        {!isGuest && (
          <Button
            onClick={startNew}
            className="flex-1 gap-2"
            data-testid="button-new-quiz"
          >
            <Home className="h-4 w-4" />
            Create New Quiz
          </Button>
        )}
      </motion.div>
    </div>
  );
}
