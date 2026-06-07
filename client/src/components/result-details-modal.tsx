import { useState, useMemo } from "react";
import { Check, X, ChevronDown, ChevronUp, Loader2, Lightbulb, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/formatted-text";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X as CloseIcon } from "lucide-react";

interface ResultDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resultId: string;
}

interface QuizResult {
  id: string;
  quizId: string;
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongQuestionIds?: string[];
  timeTaken: number;
  completedAt: string;
}

interface Question {
  id: string;
  question: string;
  correctAnswer: string;
  type: string;
  explanation?: string;
  imageUrl?: string;
  wrongAnswerExplanations?: Record<string, string>;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

interface ResultData {
  result: QuizResult;
  quiz: Quiz;
}

const categoryGradients: Record<string, string> = {
  "Math": "bg-gradient-to-br from-blue-500 to-blue-600",
  "English": "bg-gradient-to-br from-violet-500 to-violet-600",
  "Science": "bg-gradient-to-br from-emerald-500 to-emerald-600",
  "Social Studies": "bg-gradient-to-br from-orange-500 to-orange-600",
  "Global Languages": "bg-gradient-to-br from-pink-500 to-pink-600",
  "Others/General": "bg-gradient-to-br from-slate-500 to-slate-600",
};

export function ResultDetailsModal({
  isOpen,
  onOpenChange,
  resultId,
}: ResultDetailsModalProps) {
  const [data, setData] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const { t } = useLanguage();
  const { user } = useAuth();
  const isGuest = !user;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleOpenChange = (open: boolean) => {
    if (open && !data && !isLoading) {
      setIsLoading(true);
      fetch(`/api/result/${resultId}`)
        .then(res => res.json())
        .then(data => {
          setData(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch result details:", error);
          setIsLoading(false);
        });
    }
    onOpenChange(open);
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

  if (!data && !isLoading) {
    return null;
  }

  const result = data?.result;
  const quiz = data?.quiz;

  if (!result || !quiz) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);

  const getScoreColor = () => {
    if (percentage >= 80) return "text-emerald-500";
    if (percentage >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreBg = () => {
    if (percentage >= 80) return "bg-emerald-500/10";
    if (percentage >= 60) return "bg-amber-500/10";
    return "bg-rose-500/10";
  };

  const getScoreMessage = () => {
    if (percentage >= 90) return t('quizResults.scoreMessages.90');
    if (percentage >= 80) return t('quizResults.scoreMessages.80');
    if (percentage >= 70) return t('quizResults.scoreMessages.70');
    if (percentage >= 60) return t('quizResults.scoreMessages.60');
    return t('quizResults.scoreMessages.default');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{quiz.title}</DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-4">
              <CloseIcon className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={`${getScoreBg()} border-0`}>
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.2, ease: "easeIn" }}
                    className="relative w-40 h-40"
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
                        className={`text-3xl font-bold ${getScoreColor()}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {percentage}%
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h2 className={`text-2xl font-bold ${getScoreColor()}`}>
                    {getScoreMessage()}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    {t('quizResults.quizSessionSummary', {
                      correct: result.correctAnswers,
                      total: result.totalQuestions,
                    })}
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                <Check className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">{result.correctAnswers}</p>
              <p className="text-sm text-muted-foreground">{t('common.correct')}</p>
            </Card>

            <Card className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-2">
                <X className="h-5 w-5 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {result.totalQuestions - result.correctAnswers}
              </p>
              <p className="text-sm text-muted-foreground">{t('common.incorrect')}</p>
            </Card>

            <Card className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{result.totalQuestions}</p>
              <p className="text-sm text-muted-foreground">{t('common.total')}</p>
            </Card>

            <Card className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                <Check className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatTime(result.timeTaken || 0)}
              </p>
              <p className="text-sm text-muted-foreground">{t('common.time')}</p>
            </Card>
          </motion.div>

          {/* Questions Review */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('quizResults.reviewAnswers')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quiz.questions.map((question, index) => {
                  const userAnswer = result.answers[question.id];
                  const isCorrect = result.wrongQuestionIds
                    ? !result.wrongQuestionIds.includes(question.id)
                    : userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
                  const isExpanded = expandedQuestions.has(question.id);

                  return (
                    <div
                      key={question.id}
                      className={`
                        rounded-md border overflow-hidden
                        ${isCorrect ? "border-emerald-500/30" : "border-rose-500/30"}
                      `}
                    >
                      <button
                        onClick={() => toggleQuestion(question.id)}
                        className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
                      >
                        <div
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${isCorrect ? "bg-emerald-500/10" : "bg-rose-500/10"}
                          `}
                        >
                          {isCorrect ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <X className="h-4 w-4 text-rose-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {t('quizPlayer.questionNumber', { number: index + 1 })}
                            </Badge>
                            <Badge
                              variant={isCorrect ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {isCorrect ? t('common.correct') : t('common.incorrect')}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium truncate">
                            <MathText content={question.question} />
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t bg-muted/20">
                              <div className="pt-4 space-y-3">
                                {question.imageUrl && (
                                  <div className="mb-3 rounded-lg overflow-hidden border border-border">
                                    <img
                                      src={question.imageUrl}
                                      alt="Question reference image"
                                      className="w-full max-h-48 object-contain bg-muted/30"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                    {t('quizResults.yourAnswer')}
                                  </p>
                                  <p
                                    className={`text-sm font-medium ${
                                      isCorrect ? "text-emerald-500" : "text-rose-500"
                                    }`}
                                  >
                                    <MathText content={userAnswer || t('quizResults.noAnswerProvided')} />
                                  </p>
                                </div>
                                {!isCorrect && question.type !== "short_answer" && (
                                  <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                      {t('quizResults.correctAnswer')}
                                    </p>
                                    <p className="text-sm font-medium text-emerald-500">
                                      <MathText content={question.correctAnswer} />
                                    </p>
                                  </div>
                                )}
                                {question.explanation && !isGuest && (
                                  <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                      {t('quizPlayer.explanation')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      <MathText content={question.explanation} />
                                    </p>
                                  </div>
                                )}
                                {!isCorrect &&
                                  userAnswer &&
                                  question.wrongAnswerExplanations &&
                                  !isGuest && (() => {
                                    const getExplanation = () => {
                                      if (question.wrongAnswerExplanations![userAnswer]) {
                                        return question.wrongAnswerExplanations![userAnswer];
                                      }
                                      const answerWithoutPrefix = userAnswer
                                        .replace(/^[A-D]\)\s*/, "")
                                        .trim();
                                      if (question.wrongAnswerExplanations![answerWithoutPrefix]) {
                                        return question.wrongAnswerExplanations![answerWithoutPrefix];
                                      }
                                      for (const [key, value] of Object.entries(
                                        question.wrongAnswerExplanations!
                                      )) {
                                        const keyWithoutPrefix = key.replace(/^[A-D]\)\s*/, "").trim();
                                        if (
                                          keyWithoutPrefix.toLowerCase() ===
                                            answerWithoutPrefix.toLowerCase() ||
                                          key.toLowerCase() === userAnswer.toLowerCase()
                                        ) {
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
                                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide mb-1">
                                              {t('quizResults.whyThisWasWrong')}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              <MathText content={explanation} />
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ) : null;
                                  })()}
                                {question.explanation && isGuest && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Lock className="h-3 w-3" />
                                    <p className="text-xs italic">{t('quizResults.signUpToSeeExplanations')}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
