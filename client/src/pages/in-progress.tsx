import { useMemo } from "react";
import { useQuizProgressSummaries, EMPTY_PROGRESS } from "@/hooks/use-quiz-progress";
import type { QuizProgressSummary, ProgressQuizSummary } from "@shared/quiz-progress";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Play, ArrowLeft, Target, Clock, BookOpen, Trash2, RotateCcw,
  Binary, Book, FlaskConical, Globe, Languages, GraduationCap,
  Loader2, InboxIcon, ArrowRight, Search, X,
} from "lucide-react";
import { getCategoryIcon, getCategoryTranslationKey } from "@/lib/category-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useLanguage } from "@/lib/language-context";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

// ── Category & difficulty maps ────────────────────────────────────────────────


const difficultyColors: Record<string, {
  border: string; from: string; via: string; text: string; icon: string; badge: string; btn: string;
}> = {
  easy: {
    border: "border-emerald-500/30",
    from: "from-emerald-500/10",
    via: "via-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900",
    btn: "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
  medium: {
    border: "border-amber-500/30",
    from: "from-amber-500/10",
    via: "via-amber-500/5",
    text: "text-amber-600 dark:text-amber-400",
    icon: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900",
    btn: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  hard: {
    border: "border-rose-500/30",
    from: "from-rose-500/10",
    via: "via-rose-500/5",
    text: "text-rose-600 dark:text-rose-400",
    icon: "bg-rose-500",
    badge: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900",
    btn: "bg-rose-500 hover:bg-rose-600 text-white",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDifficulty(raw?: string | null): "easy" | "medium" | "hard" {
  if (raw === "easy" || raw === "hard") return raw;
  return "medium";
}

function getCategoryValue(raw?: string | null) {
  return raw || "General";
}

interface InProgressItem {
  type: "saved";
  quizId: string;
  quiz: ProgressQuizSummary;
  answers: Record<string, string>;
  checkedQuestions: string[];
  savedAt: string;
  isRevising: boolean;
  answeredCount: number;
  totalCount: number;
  retryAnsweredCount: number;
  retryTotalCount: number;
  timeTaken: number;
}

function buildInProgressItem(p: QuizProgressSummary): InProgressItem {
  const mergedAnswers: Record<string, string> = { ...p.answers };
  if (p.retryAnswers) {
    Object.entries(p.retryAnswers).forEach(([k, v]) => {
      mergedAnswers[`retry-${k}`] = v as string;
    });
  }

  const answerKeys = Object.keys(mergedAnswers);
  const retryAnswerKeys = answerKeys.filter(k => k.startsWith("retry-"));
  const originalAnswerKeys = answerKeys.filter(k => !k.startsWith("retry-"));
  const totalCount = p.quiz.questionCount;
  const checkedCount = (p.checkedQuestions || []).length;

  const wrongCount = p.wrongQuestionCount;

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
    timeTaken: p.timeTaken || 0,
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
  const { t } = useLanguage();
  const difficultyRaw = getDifficulty(item.quiz.difficulty);
  const colors = difficultyColors[difficultyRaw];
  const CategoryIcon = getCategoryIcon(item.quiz.category);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const lightShadowMap: Record<string, string> = {
    easy: '#10B981',
    medium: '#F59E0B',
    hard: '#F43F5E',
  };
  const darkShadowMap: Record<string, string> = {
    easy: '#047857',
    medium: '#B45309',
    hard: '#BE123C',
  };
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const shadowColor = isDark
    ? hexToRgba(darkShadowMap[difficultyRaw], 0.9)
    : hexToRgba(lightShadowMap[difficultyRaw], 0.96);

  const displayAnswered = item.isRevising ? item.retryAnsweredCount : item.answeredCount;
  const displayTotal = item.isRevising ? item.retryTotalCount : item.totalCount;
  const progress = displayTotal > 0 ? Math.round((displayAnswered / displayTotal) * 100) : 0;
  const remaining = displayTotal - displayAnswered;
  const timeLabel = formatDistanceToNow(new Date(item.savedAt));
  const timeTakenLabel = item.timeTaken > 0 ? formatTimeTaken(item.timeTaken) : null;

  function formatTimeTaken(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="group"
    >
      <Card
        style={{ ['--primary-3d-shadow' as any]: shadowColor }}
        className={`relative overflow-hidden border transition-all duration-300 shadow-sm active:shadow-none no-default-active-elevate
            ${item.isRevising
              ? "border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-transparent"
              : `${colors.border} bg-gradient-to-br ${colors.from} ${colors.via} to-transparent`
            }`}
      >
        {/* Shimmer accent */}
        <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-xl ${item.isRevising
          ? "bg-violet-500"
          : colors.icon
        }`} />

        <CardContent className="p-5">
          <div className="flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md flex-shrink-0
                ${item.isRevising ? "bg-violet-500" : colors.icon}`}>
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
                      {t('inProgress.revising')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 capitalize font-bold ${colors.badge}`}>
                      {t(`quizGenerator.${difficultyRaw}`)}
                    </Badge>
                  )}
                
                  {timeTakenLabel && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                      <Clock className="w-2.5 h-2.5 mr-1" />
                      {t('inProgress.timeSpent', { time: timeTakenLabel })}
                    </Badge>
                  )}
                </div>
                <div className ="mt-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t('inProgress.ago', { time: timeLabel })}
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
                  {remaining === 1 
                    ? t('inProgress.questionLeftToReview', { count: remaining }) 
                    : t('inProgress.questionsLeftToReview', { count: remaining })}
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {t('inProgress.answeredOfTotal', { answered: displayAnswered, total: displayTotal })}
                  </span>
                  <span className={`font-bold ${colors.text}`}>{progress}%</span>
                </div>
                <div className="relative h-2 bg-muted/40 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${colors.icon}`}
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
                {t('history.questions', { count: item.totalCount })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={onContinue}
                className={`flex-1 gap-2 h-10 border-none text-white font-semibold transition-all shadow-none hover:brightness-110 ${
                  item.isRevising ? "bg-violet-500 hover:bg-violet-600" : colors.btn
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                {item.isRevising ? t('inProgress.continueReview') : t('inProgress.continueQuiz')}
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
  const { removeSavedProgress } = useQuiz();
  const { t } = useLanguage();
  const [discardTarget, setDiscardTarget] = useState<InProgressItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  const { data: allProgress = EMPTY_PROGRESS, isLoading } = useQuizProgressSummaries();

  const items = useMemo(() => allProgress.map(buildInProgressItem), [allProgress]);
  const availableSubjects = useMemo(() => {
    return Array.from(new Set(items.map((item) => getCategoryValue(item.quiz.category)))).sort((a, b) =>
      t(getCategoryTranslationKey(a)).localeCompare(t(getCategoryTranslationKey(b)))
    );
  }, [items, t]);
  const availableDifficulties = useMemo(() => {
    const difficultyOrder = ["easy", "medium", "hard"];
    const difficulties = new Set(items.map((item) => getDifficulty(item.quiz.difficulty)));
    return difficultyOrder.filter((difficulty) => difficulties.has(difficulty as "easy" | "medium" | "hard"));
  }, [items]);
  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const difficulty = getDifficulty(item.quiz.difficulty);
      const category = getCategoryValue(item.quiz.category);
      const matchesSubject = selectedSubject === "all" || category === selectedSubject;
      const matchesDifficulty = selectedDifficulty === "all" || difficulty === selectedDifficulty;
      if (!matchesSubject || !matchesDifficulty) return false;

      if (!normalizedQuery) return true;

      const categoryKey = getCategoryTranslationKey(item.quiz.category);
      const searchableText = [
        item.quiz.title,
        item.quiz.category,
        t(categoryKey),
        t(`quizGenerator.${difficulty}`),
        item.isRevising ? t("inProgress.revising") : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [items, searchQuery, selectedSubject, selectedDifficulty, t]);
  const hasActiveFilters =
    !!searchQuery.trim() || selectedSubject !== "all" || selectedDifficulty !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSubject("all");
    setSelectedDifficulty("all");
  };

  const handleContinue = (item: InProgressItem) => {
    setLocation(`/quiz?id=${encodeURIComponent(item.quizId)}`);
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
          {t('common.backToDashboard')}
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                <RotateCcw className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">{t('inProgress.title')}</h1>
            </div>
            <p className="text-muted-foreground ml-[3.25rem]">
              {isLoading
                ? t('inProgress.loadingSessions')
                : items.length > 0
                  ? t('inProgress.sessionsWaiting', { count: items.length })
                  : t('inProgress.allCaughtUpDesc')}
            </p>
          </div>

          {items.length > 0 && (
            <Badge
              variant="secondary"
              className="h-8 px-4 text-sm font-bold rounded-full self-center"
            >
              {t('inProgress.sessionsCount', { count: items.length })}
            </Badge>
          )}
        </div>
      </motion.div>

      {!isLoading && items.length > 0 && (
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("inProgress.searchPlaceholder")}
                className="h-11 bg-muted/30 border-border/50 pl-9 pr-9 focus:bg-background transition-all"
                data-testid="input-search-in-progress"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t("inProgress.clearSearch")}
                  data-testid="button-clear-in-progress-search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger
                  className="h-11 bg-muted/30 border-border/50 lg:w-[190px]"
                  data-testid="filter-in-progress-subject"
                >
                  <SelectValue placeholder={t("inProgress.allSubjects")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("inProgress.allSubjects")}</SelectItem>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {t(getCategoryTranslationKey(subject))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger
                  className="h-11 bg-muted/30 border-border/50 lg:w-[190px]"
                  data-testid="filter-in-progress-difficulty"
                >
                  <SelectValue placeholder={t("inProgress.allDifficulties")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("inProgress.allDifficulties")}</SelectItem>
                  {availableDifficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {t(`quizGenerator.${difficulty}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {t("inProgress.searchResultsCount", { count: filteredItems.length })}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-fit px-2 text-muted-foreground hover:text-foreground"
                data-testid="button-clear-in-progress-filters"
              >
                <X className="mr-1 h-4 w-4" />
                {t("inProgress.clearFilters")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('inProgress.loadingSessions')}</p>
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
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('inProgress.allCaughtUp')}</h2>
          <p className="text-muted-foreground max-w-sm mb-8">
            {t('inProgress.noQuizzesInProgress')}
          </p>
          <Button
            onClick={() => setLocation("/history")}
            className="gap-2 px-6 h-11 rounded-2xl font-bold shadow-lg shadow-primary/20"
          >
            <BookOpen className="w-5 h-5" />
            {t('inProgress.browseQuizzes')}
          </Button>
        </motion.div>
      )}

      {/* No search results */}
      {!isLoading && items.length > 0 && filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t("inProgress.noSearchResults")}</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            {t("inProgress.tryDifferentSearch")}
          </p>
          <Button variant="outline" onClick={clearFilters}>
            {t("inProgress.clearFilters")}
          </Button>
        </motion.div>
      )}

      {/* Grid */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item, index) => (
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
            <AlertDialogTitle>{t('inProgress.discardProgress')}</AlertDialogTitle>
            <AlertDialogDescription>
              {discardTarget?.isRevising
                ? t('inProgress.discardRevisionDesc', { title: discardTarget?.quiz.title || "" })
                : t('inProgress.discardProgressDesc', { title: discardTarget?.quiz.title || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('inProgress.keepIt')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('inProgress.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
