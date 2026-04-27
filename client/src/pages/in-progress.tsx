import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Play, ArrowLeft, Target, Clock, BookOpen, Trash2, RotateCcw,
  Binary, Book, FlaskConical, Globe, Languages, GraduationCap,
  Loader2, InboxIcon, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuiz } from "@/lib/quiz-context";
import type { Quiz } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

// ── Category & difficulty maps ────────────────────────────────────────────────

const categoryIcons: Record<string, any> = {
  "Math": Binary,
  "English": Book,
  "Science": FlaskConical,
  "Social Studies": Globe,
  "Global Languages": Languages,
  "Others/General": GraduationCap,
};

const difficultyColors: Record<string, {
  border: string; from: string; via: string; text: string; icon: string; badge: string;
}> = {
  easy: {
    border: "border-emerald-500/30",
    from: "from-emerald-500/10",
    via: "via-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900",
  },
  medium: {
    border: "border-amber-500/30",
    from: "from-amber-500/10",
    via: "via-amber-500/5",
    text: "text-amber-600 dark:text-amber-400",
    icon: "bg-gradient-to-br from-amber-500 to-amber-600",
    badge: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900",
  },
  hard: {
    border: "border-rose-500/30",
    from: "from-rose-500/10",
    via: "via-rose-500/5",
    text: "text-rose-600 dark:text-rose-400",
    icon: "bg-gradient-to-br from-rose-500 to-rose-600",
    badge: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDifficulty(raw?: string | null): "easy" | "medium" | "hard" {
  if (raw === "easy" || raw === "hard") return raw;
  return "medium";
}

interface InProgressItem {
  type: "saved";
  quizId: string;
  quiz: Quiz;
  answers: Record<string, string>;
  checkedQuestions: string[];
  savedAt: string;
  isRevising: boolean;
  answeredCount: number;
  totalCount: number;
  retryAnsweredCount: number;
  retryTotalCount: number;
}

function buildInProgressItem(p: any): InProgressItem {
  const mergedAnswers: Record<string, string> = { ...p.answers };
  if (p.retryAnswers) {
    Object.entries(p.retryAnswers).forEach(([k, v]) => {
      mergedAnswers[`retry-${k}`] = v as string;
    });
  }

  const answerKeys = Object.keys(mergedAnswers);
  const retryAnswerKeys = answerKeys.filter(k => k.startsWith("retry-"));
  const originalAnswerKeys = answerKeys.filter(k => !k.startsWith("retry-"));
  const totalCount = p.quiz?.questions?.length || 0;
  const checkedCount = (p.checkedQuestions || []).length;

  let wrongCount = 0;
  if (p.quiz?.questions) {
    wrongCount = (p.quiz.questions as any[]).filter(q => {
      const ua = mergedAnswers[q.id];
      return ua && ua.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim();
    }).length;
  }

  const hasCompletedFirst = checkedCount >= totalCount && totalCount > 0;
  const isRevising = (hasCompletedFirst && wrongCount > 0) || retryAnswerKeys.length > 0;

  return {
    type: "saved",
    quizId: p.quizId,
    quiz: p.quiz,
    answers: mergedAnswers,
    checkedQuestions: p.checkedQuestions || [],
    savedAt: typeof p.savedAt === "string" ? p.savedAt : new Date(p.savedAt).toISOString(),
    isRevising,
    answeredCount: originalAnswerKeys.length,
    totalCount,
    retryAnsweredCount: retryAnswerKeys.length,
    retryTotalCount: wrongCount,
  };
}

// ── InProgressCard component ──────────────────────────────────────────────────

function InProgressCard({
  item,
  onContinue,
  onDiscard,
  index,
}: {
  item: InProgressItem;
  onContinue: () => void;
  onDiscard: () => void;
  index: number;
}) {
  const difficultyRaw = getDifficulty(item.quiz.difficulty);
  const colors = difficultyColors[difficultyRaw];
  const CategoryIcon = categoryIcons[item.quiz.category || "Others/General"] || GraduationCap;

  const displayAnswered = item.isRevising ? item.retryAnsweredCount : item.answeredCount;
  const displayTotal = item.isRevising ? item.retryTotalCount : item.totalCount;
  const progress = displayTotal > 0 ? Math.round((displayAnswered / displayTotal) * 100) : 0;
  const remaining = displayTotal - displayAnswered;
  const timeLabel = formatDistanceToNow(new Date(item.savedAt));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <Card
        className={`relative overflow-hidden border transition-all duration-300 hover:shadow-xl
          ${item.isRevising
            ? "border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-transparent hover:border-violet-500/50 hover:shadow-violet-500/10"
            : `${colors.border} bg-gradient-to-br ${colors.from} ${colors.via} to-transparent hover:shadow-primary/10`
          }`}
      >
        {/* Shimmer accent */}
        <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-xl ${item.isRevising
          ? "bg-gradient-to-r from-violet-500 via-purple-400 to-violet-500"
          : `bg-gradient-to-r ${colors.icon.replace("bg-gradient-to-br", "")}`
        }`} />

        <CardContent className="p-5">
          <div className="flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md flex-shrink-0
                ${item.isRevising ? "bg-gradient-to-br from-violet-500 to-purple-600" : colors.icon}`}>
                <CategoryIcon className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate text-base leading-tight mb-1.5 group-hover:text-primary transition-colors">
                  {item.quiz.title}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.isRevising ? (
                    <Badge className="gap-1 text-[10px] px-2 py-0.5 bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-800">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-violet-500"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      Revising
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 capitalize font-bold ${colors.badge}`}>
                      {difficultyRaw}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    {item.quiz.category || "Others/General"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeLabel} ago
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            {item.isRevising ? (
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-violet-500/10 border border-violet-200/50 dark:border-violet-800/30">
                <motion.div
                  className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                  {remaining} question{remaining !== 1 ? "s" : ""} left to review
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {displayAnswered} of {displayTotal} answered
                  </span>
                  <span className={`font-bold ${colors.text}`}>{progress}%</span>
                </div>
                <div className="relative h-2 bg-muted/40 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${colors.icon.replace("bg-gradient-to-br", "bg-gradient-to-r")}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Meta row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {item.totalCount} questions total
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={onContinue}
                className={`flex-1 gap-2 h-10 shadow-sm border-0 text-white font-semibold transition-all hover:brightness-110
                  ${item.isRevising
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    : colors.icon.replace("bg-gradient-to-br", "bg-gradient-to-r")
                  }`}
              >
                <Play className="w-4 h-4 fill-current" />
                {item.isRevising ? "Continue Review" : "Continue Quiz"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-xl flex-shrink-0"
                onClick={onDiscard}
                title="Discard progress"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InProgressPage() {
  const [, setLocation] = useLocation();
  const { savedProgresses, loadSavedProgress, removeSavedProgress } = useQuiz();
  const [discardTarget, setDiscardTarget] = useState<InProgressItem | null>(null);

  // Fetch ALL progress (no limit)
  const { data: allProgress = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/quiz-progress"],
    staleTime: 0,
  });

  const items = useMemo(() => allProgress.map(buildInProgressItem), [allProgress]);

  const handleContinue = (item: InProgressItem) => {
    loadSavedProgress(item.quizId);
    setLocation("/quiz");
  };

  const handleConfirmDiscard = () => {
    if (discardTarget) {
      removeSavedProgress(discardTarget.quizId);
      setDiscardTarget(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back button + title */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                <RotateCcw className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">In Progress</h1>
            </div>
            <p className="text-muted-foreground ml-[3.25rem]">
              {isLoading
                ? "Loading your saved sessions…"
                : items.length > 0
                  ? `${items.length} quiz session${items.length !== 1 ? "s" : ""} waiting to be completed`
                  : "All caught up — no sessions in progress"}
            </p>
          </div>

          {items.length > 0 && (
            <Badge
              variant="secondary"
              className="h-8 px-4 text-sm font-bold rounded-full self-center"
            >
              {items.length} session{items.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your progress…</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full bg-primary/5 border border-border flex items-center justify-center">
              <InboxIcon className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-white text-xs font-bold">✓</span>
            </motion.div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">All caught up!</h2>
          <p className="text-muted-foreground max-w-sm mb-8">
            You don't have any quizzes in progress. Start a quiz and save your progress to pick up right where you left off.
          </p>
          <Button
            onClick={() => setLocation("/history")}
            className="gap-2 px-6 h-11 rounded-2xl font-bold shadow-lg shadow-primary/20"
          >
            <BookOpen className="w-5 h-5" />
            Browse your quizzes
          </Button>
        </motion.div>
      )}

      {/* Grid */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((item, index) => (
            <InProgressCard
              key={item.quizId}
              item={item}
              index={index}
              onContinue={() => handleContinue(item)}
              onDiscard={() => setDiscardTarget(item)}
            />
          ))}
        </div>
      )}

      {/* Discard confirmation */}
      <AlertDialog
        open={!!discardTarget}
        onOpenChange={(open) => !open && setDiscardTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard progress?</AlertDialogTitle>
            <AlertDialogDescription>
              {discardTarget?.isRevising
                ? `This will permanently delete all your progress for "${discardTarget?.quiz.title}", including your original answers and revision progress.`
                : `This will discard your saved progress for "${discardTarget?.quiz.title}". You can retake it from scratch.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
