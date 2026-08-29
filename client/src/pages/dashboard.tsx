import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Plus, BookOpen, Play, Target,
  Clock, FileText, Sparkles, ArrowRight,
  Brain, GraduationCap, Lightbulb, CalendarCheck, CheckCircle2, XCircle, ChevronLeft, ChevronRight, X,
  Calculator, Languages, FlaskConical, Globe2, HelpCircle, BookText, Zap,
  Binary, Book, Globe
} from "lucide-react";
import { getCategoryIcon, getCategoryTranslationKey } from "@/lib/category-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/language-context";
import { MathText } from "@/components/formatted-text";
import type { Question, Quiz } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";


// Difficulty to Color mapping
const difficultyColors: Record<string, { border: string, from: string, via: string, text: string, icon: string, shadow: string, badge: string, btn: string }> = {
  "easy": {
    border: "border-emerald-500/30",
    from: "from-emerald-500/10",
    via: "via-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "bg-emerald-500",
    shadow: "shadow-emerald-500/5",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900",
    btn: "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
  "medium": {
    border: "border-amber-500/30",
    from: "from-amber-500/10",
    via: "via-amber-500/5",
    text: "text-amber-600 dark:text-amber-400",
    icon: "bg-amber-500",
    shadow: "shadow-amber-500/5",
    badge: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900",
    btn: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  "hard": {
    border: "border-rose-500/30",
    from: "from-rose-500/10",
    via: "via-rose-500/5",
    text: "text-rose-600 dark:text-rose-400",
    icon: "bg-rose-500",
    shadow: "shadow-rose-500/5",
    badge: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900",
    btn: "bg-rose-500 hover:bg-rose-600 text-white",
  }
};

interface ResultHistoryItem {
  quizId: string;
  date: string;
}

interface DailyRevision {
  quiz: Pick<Quiz, 'id' | 'title'> & { category: string };
  questions: Question[];
}

interface DailyRevisionProgress {
  currentIndex: number;
  answers: Record<string, string>;
  checkedQuestions: string[];
  isComplete: boolean;
}

const DAILY_REVISION_STORAGE_PREFIX = 'prepetual:daily-revision:';
const DAILY_REVISION_SELECTION_PREFIX = 'prepetual:daily-revision-selection:';

function isDailyRevision(value: unknown): value is DailyRevision {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<DailyRevision>;
  return !!candidate.quiz
    && typeof candidate.quiz.id === 'string'
    && typeof candidate.quiz.title === 'string'
    && typeof candidate.quiz.category === 'string'
    && Array.isArray(candidate.questions)
    && candidate.questions.length === 4
    && candidate.questions.every((question) =>
      !!question
      && typeof question.id === 'string'
      && typeof question.question === 'string'
      && typeof question.correctAnswer === 'string'
      && Array.isArray(question.options),
    );
}

function getDailyRevisionDateKey() {
  return new Date().toLocaleDateString('en-CA');
}

function getTimeUntilNextLocalDay(now: Date) {
  const nextLocalMidnight = new Date(now);
  nextLocalMidnight.setHours(24, 0, 0, 0);
  return Math.max(0, nextLocalMidnight.getTime() - now.getTime());
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

// Learning tips are now handled via useLanguage in the component

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const floatAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

function QuickActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  variant = "default",
  testId
}: {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  variant?: "default" | "primary";
  testId: string;
}) {
  const isPrimary = variant === "primary";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={isPrimary ? "relative group" : ""}
    >
      {isPrimary && (
        <motion.div
          className="absolute -inset-0.5 bg-gradient-to-r from-primary via-quiz-purple to-primary rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
      <Card
        className={`relative cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl  ${isPrimary
          ? "bg-gradient-to-br from-primary via-primary to-primary/90 border-0 shadow-lg shadow-primary/20"
          : "border-border/50"
          }`}
        onClick={onClick}
        data-testid={testId}
      >
        <CardContent className="p-6 relative z-20">
          <div className="flex items-center gap-4">
            <motion.div
              className={`p-3 rounded-xl ${isPrimary ? "bg-white/20 backdrop-blur-sm border border-white/20" : "bg-primary/10"}`}
              whileHover={{ rotate: isPrimary ? 90 : 0, scale: 1.1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
            >
              <Icon className={`w-6 h-6 ${isPrimary ? "text-white" : "text-primary"}`} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className={`font-bold text-lg leading-tight ${isPrimary ? "text-white" : "text-foreground"}`}>
                  {title}
                </h3>
              </div>
              <p className={`text-sm font-medium tracking-tight truncate ${isPrimary ? "text-white/90" : "text-muted-foreground"}`}>
                {description}
              </p>
            </div>
            <div className={`p-2 rounded-full transition-colors ${isPrimary ? "bg-white/20 hover:bg-white/30" : "bg-muted"}`}>
              <ArrowRight className={`w-5 h-5 flex-shrink-0 ${isPrimary ? "text-white" : "text-muted-foreground"}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ onCreateQuiz }: { onCreateQuiz: () => void }) {
  const { t } = useLanguage();
  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-to-b from-card to-card/50">
      <CardContent className="py-12 px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <motion.div
            className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-md mx-auto relative z-10"
        >
          <motion.div
            className="relative w-28 h-28 mx-auto mb-6 cursor-pointer group"
            animate={floatAnimation}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />

            <div className="absolute inset-2 bg-background rounded-full shadow-inner flex items-center justify-center border border-border/50 overflow-hidden">
              <div className="absolute inset-2 bg-gradient-to-br from-primary/10 to-transparent rounded-full" />
              <Brain className="w-12 h-12 text-primary drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
            </div>
          </motion.div>

          <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">
            {t('dashboard.createFirstQuiz')}
          </h3>
          <p className="text-muted-foreground mb-8 leading-relaxed text-base font-medium">
            {t('dashboard.continueWhereLeftOff')}
          </p>

          <Button
            size="lg"
            onClick={onCreateQuiz}
            data-testid="button-create-first"
            className="h-12 px-8 text-base font-bold rounded-2xl shadow-primary/80 transition-all"
          >
            <Plus className="w-5 h-5 mr-2 stroke-[3]" />
            {t('history.createQuiz')}
          </Button>
        </motion.div>
        
        <div className="mt-12 max-w-md mx-auto">
          <LearningTipCard />
        </div>
      </CardContent>
    </Card>
  );
}

function QuizCard({
  quiz,
  onTake,
  onStudy,
  index
}: {
  quiz: Quiz;
  onTake: () => void;
  onStudy: () => void;
  index: number;
}) {
  const { t } = useLanguage();
  const difficultyRaw = quiz.difficulty?.toLowerCase() || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(difficultyRaw) ? difficultyRaw : "medium") as "easy" | "medium" | "hard";
  const colors = difficultyColors[difficulty] || difficultyColors.medium;
  const CategoryIcon = getCategoryIcon(quiz.category);
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
  const shadowColor = isDark ? darkShadowMap[difficulty] : lightShadowMap[difficulty];
  const questionCount = (quiz as any).questionCount || (quiz.questions as any[])?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className="group"
      data-testid={`card-recent-quiz-${quiz.id}`}
      onClick={onTake}
    >
      <div className="relative flex items-center gap-2 p-3 sm:gap-4 sm:p-4 rounded-2xl bg-card/40 hover:bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colors.icon} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <CategoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {quiz.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1 font-medium bg-muted px-1.5 sm:px-2 py-0.5 rounded-md">
              <HelpCircle className="w-3 h-3" />
              {t('history.questions', { count: questionCount })}
            </span>
            <Badge variant="outline" className={`h-5 text-[10px] capitalize px-2 font-bold ${colors.badge}`}>
              {t(`quizGenerator.${difficulty}`)}
            </Badge>
            <span className="hidden sm:flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded-md">
              {t(getCategoryTranslationKey(quiz.category))}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 opacity-70">
              <Clock className="w-3 h-3" />
              {t('inProgress.ago', { time: formatDistanceToNow(new Date(quiz.createdAt)) })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); onStudy(); }}
            data-testid={`button-study-${quiz.id}`}
            aria-label={t('history.review')}
          >
            <BookOpen className="w-5 h-5" />
          </Button>
          <Button
            size="default"
            className="h-9 w-9 sm:h-10 sm:w-auto sm:px-5 rounded-xl font-bold shadow-sm shadow-primary/20 group-hover:shadow-primary/40 transition-all"
            onClick={(e) => { e.stopPropagation(); onTake(); }}
            data-testid={`button-take-${quiz.id}`}
          >
            <Play className="w-4 h-4 sm:mr-2 fill-current" />
            <span className="hidden sm:inline">{t('feed.play')}</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function LearningTipCard() {
  const { t, tArray } = useLanguage();
  const tips = tArray('learningTips');
  const randomTip = useMemo(() => {
    return tips[Math.floor(Math.random() * tips.length)];
  }, [tips]);

  return (
    <motion.section variants={itemVariants}>
      <Card className="overflow-visible bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">{t('dashboard.learningTip')}</h3>
              <p className="text-sm text-muted-foreground">
                {randomTip}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}

function ContinueQuizCard({
  quiz,
  answeredCount,
  totalCount,
  onContinue,
  onDiscard,
  isCurrent = true,
  savedAt,
  isRevising = false,
  retryAnsweredCount = 0,
  retryTotalCount = 0,
}: {
  quiz: Quiz;
  answeredCount: number;
  totalCount: number;
  onContinue: () => void;
  onDiscard: () => void;
  isCurrent?: boolean;
  savedAt?: string;
  isRevising?: boolean;
  retryAnsweredCount?: number;
  retryTotalCount?: number;
}) {
  const { t } = useLanguage();
  const displayAnswered = isRevising ? retryAnsweredCount : answeredCount;
  const displayTotal = isRevising ? retryTotalCount : totalCount;
  const progress = Math.round((displayAnswered / displayTotal) * 100) || 0;
  const remaining = displayTotal - displayAnswered;

  const difficultyRaw = quiz.difficulty?.toLowerCase() || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(difficultyRaw) ? difficultyRaw : "medium") as "easy" | "medium" | "hard";
  const colors = difficultyColors[difficulty] || difficultyColors.medium;
  const CategoryIcon = getCategoryIcon(quiz.category);

  const timeLabel = formatDistanceToNow(new Date(savedAt || new Date()));

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
  const shadowColor = isDark ? darkShadowMap[difficulty] : lightShadowMap[difficulty];

  return (
    <motion.div
      whileHover={{ y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative group"
    >
      <Card
        style={{ ['--primary-3d-shadow' as any]: shadowColor }}
        className={`overflow-hidden border ${isRevising ? 'border-violet-500/40' : colors.border} transition-all duration-300 bg-gradient-to-br ${isRevising ? 'from-violet-500/5 via-purple-500/5' : `${colors.from} ${colors.via}`} to-transparent shadow-[0_4px_0_0_var(--primary-3d-shadow)] active:translate-y-[4px] active:shadow-none` }
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            {/* Header row */}
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${isRevising ? 'bg-violet-500' : colors.icon}`}>
                <CategoryIcon className="w-6 h-6 text-white" />
              </div>

              {/* Title and meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate text-base mb-1">{quiz.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isRevising ? (
                        <Badge className="gap-1 text-[10px] px-2 py-0.5 bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-800">
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-violet-500"
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          {t('inProgress.revising')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold ${colors.badge}`}>
                          {t(`quizGenerator.${difficulty}`)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t('inProgress.ago', { time: timeLabel })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); onDiscard(); }}
                    data-testid="button-discard-progress"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress section */}
            {isRevising ? (
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-violet-500/10 dark:bg-violet-500/15 border border-violet-200/50 dark:border-violet-800/30">
                <motion.div
                  className="w-2 h-2 rounded-full bg-violet-500"
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {t('inProgress.answeredOfTotal', { answered: displayAnswered, total: displayTotal })}
                  </span>
                  <span className={`font-bold ${colors.text}`}>{progress}%</span>
                </div>
                <div className="relative h-2.5 bg-muted/30 dark:bg-muted/20 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${colors.icon}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Action button */}
            <Button
              onClick={onContinue}
              className={`w-full gap-2 h-10 shadow-none transition-all duration-300 ${
                isRevising ? 'bg-violet-500 shadow-sm hover:bg-violet-600 text-white' : colors.btn
              } border-0`}
              data-testid="button-continue-quiz"
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="font-semibold">{isRevising ? t('inProgress.continueReview') : t('inProgress.continueQuiz')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DailyRevisionPanel({
  revision,
  isLoading,
  dayKey,
}: {
  revision: DailyRevision | null | undefined;
  isLoading: boolean;
  dayKey: string;
}) {
  const { t } = useLanguage();
  const [timeUntilReset, setTimeUntilReset] = useState(() => getTimeUntilNextLocalDay(new Date()));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<string[]>([]);
  const [generatedExplanations, setGeneratedExplanations] = useState<Record<string, string>>({});
  const [generatingExplanationFor, setGeneratingExplanationFor] = useState<string | null>(null);
  const [expandedExplanationFor, setExpandedExplanationFor] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
  const storageKey = revision
    ? `${DAILY_REVISION_STORAGE_PREFIX}${dayKey}:${revision.quiz.id}`
    : null;

  useEffect(() => {
    const updateCountdown = () => setTimeUntilReset(getTimeUntilNextLocalDay(new Date()));
    updateCountdown();

    const intervalId = window.setInterval(updateCountdown, 1_000);
    return () => window.clearInterval(intervalId);
  }, [dayKey]);

  useEffect(() => {
    setHydratedStorageKey(null);
    setCurrentIndex(0);
    setAnswers({});
    setCheckedQuestions([]);
    setGeneratedExplanations({});
    setGeneratingExplanationFor(null);
    setExpandedExplanationFor(null);
    setIsReviewing(false);
    setIsComplete(false);

    if (!revision || !storageKey) return;

    try {
      // Progress is intentionally day-scoped. Remove yesterday's saved revision.
      for (let index = localStorage.length - 1; index >= 0; index--) {
        const key = localStorage.key(index);
        if (key?.startsWith(DAILY_REVISION_STORAGE_PREFIX) && key !== storageKey) {
          localStorage.removeItem(key);
        }
      }

      const savedValue = localStorage.getItem(storageKey);
      if (savedValue) {
        const saved = JSON.parse(savedValue) as Partial<DailyRevisionProgress>;
        const questionIds = new Set(revision.questions.map((question) => question.id));
        const savedAnswers = Object.fromEntries(
          Object.entries(saved.answers || {}).filter(
            ([questionId, answer]) => questionIds.has(questionId) && typeof answer === 'string',
          ),
        );
        const savedCheckedQuestions = Array.isArray(saved.checkedQuestions)
          ? saved.checkedQuestions.filter((questionId): questionId is string => typeof questionId === 'string' && questionIds.has(questionId))
          : [];
        const savedIndex = typeof saved.currentIndex === 'number' && Number.isFinite(saved.currentIndex)
          ? Math.min(Math.max(Math.floor(saved.currentIndex), 0), revision.questions.length - 1)
          : 0;

        setCurrentIndex(savedIndex);
        setAnswers(savedAnswers);
        setCheckedQuestions(savedCheckedQuestions);
        setIsComplete(saved.isComplete === true);
      }
    } catch (error) {
      console.warn('Unable to restore daily revision progress:', error);
    }

    setHydratedStorageKey(storageKey);
  }, [revision, storageKey]);

  useEffect(() => {
    if (!storageKey || hydratedStorageKey !== storageKey) return;

    const progress: DailyRevisionProgress = {
      currentIndex,
      answers,
      checkedQuestions,
      isComplete,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (error) {
      console.warn('Unable to save daily revision progress:', error);
    }
  }, [answers, checkedQuestions, currentIndex, hydratedStorageKey, isComplete, storageKey]);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (!revision) {
    return (
      <Card className="border-dashed border-border/70 bg-muted/20">
        <CardContent className="p-6 text-center">
          <CalendarCheck className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <h3 className="font-bold">{t('dashboard.dailyRevision')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('dashboard.dailyRevisionUnavailable')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = revision.questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isChecked = currentQuestion ? checkedQuestions.includes(currentQuestion.id) : false;
  const isCorrect = !!currentQuestion && selectedAnswer?.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
  const score = revision.questions.filter(
    (question) => answers[question.id]?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim(),
  ).length;

  const getProgressSegmentColor = (question: Question, index: number) => {
    if (!checkedQuestions.includes(question.id)) {
      return index === currentIndex && !isComplete
        ? 'bg-primary'
        : 'bg-muted-foreground/20';
    }

    const answer = answers[question.id];
    const wasCorrect = answer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    return wasCorrect ? 'bg-emerald-500' : 'bg-destructive';
  };

  const generateBriefExplanation = async () => {
    if (!currentQuestion || !selectedAnswer || generatingExplanationFor === currentQuestion.id) return;

    setExpandedExplanationFor(currentQuestion.id);
    setGeneratingExplanationFor(currentQuestion.id);
    try {
      const response = await fetch('/api/generate-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          question: currentQuestion.question,
          options: currentQuestion.options,
          correctAnswer: currentQuestion.correctAnswer,
          selectedAnswer,
          isCorrect,
          category: revision.quiz.category,
          brief: true,
        }),
      });

      if (!response.ok) throw new Error('Unable to generate explanation');
      const result = await response.json() as { explanation?: string };
      const explanation = result.explanation?.trim();
      if (explanation) {
        setGeneratedExplanations((previous) => ({ ...previous, [currentQuestion.id]: explanation }));
      }
    } catch (error) {
      console.error('Unable to generate daily revision explanation:', error);
    } finally {
      setGeneratingExplanationFor(null);
    }
  };

  const handleWhyClick = () => {
    if (!currentQuestion) return;

    if (generatedExplanations[currentQuestion.id]) {
      setExpandedExplanationFor((previous) => previous === currentQuestion.id ? null : currentQuestion.id);
      return;
    }

    void generateBriefExplanation();
  };

  return (
    <Card
      className="h-[34rem] max-h-[calc(100dvh-2rem)] overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-violet-500/10 shadow-[0_4px_0_0_hsl(var(--primary)/0.18)]"
      data-testid="dialog-daily-revision"
    >
      <CardContent className="flex h-full flex-col p-5">
        <div className="mb-4 flex shrink-0 items-center gap-3">
          <div className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-lg shadow-primary/20">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
              {t('dashboard.dailyRevision')}
            </p>
            <p className="truncate text-sm font-semibold text-muted-foreground">{revision.quiz.title}</p>
          </div>
          <Badge variant="secondary" className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap" title={t('dashboard.dailyRevisionResetsIn', { time: formatCountdown(timeUntilReset) })}>
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatCountdown(timeUntilReset)}
          </Badge>
        </div>

        <div className="mb-5 grid shrink-0 grid-cols-4 gap-1.5" aria-label={t('dashboard.questionProgress', { current: currentIndex + 1, total: revision.questions.length })}>
          {revision.questions.map((question, index) => (
            <div
              key={question.id}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex && (!isComplete || isReviewing) ? 'scale-y-150' : 'scale-y-100'} ${getProgressSegmentColor(question, index)}`}
            />
          ))}
        </div>

        {isComplete && !isReviewing && (
          <div className="-mt-2 mb-2 flex shrink-0 justify-end">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-auto gap-1.5 px-1.5 py-1 text-white bg-transparent shadow-none border-none text-foreground"
              onClick={() => {
                setCurrentIndex(0);
                setIsReviewing(true);
              }}
              data-testid="button-review-daily-revision"
            >
              <BookOpen className="h-4 w-4" />
              {t('dashboard.reviewAnswers')}
            </Button>
          </div>
        )}

        {isComplete && !isReviewing ? (
          <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">{t('dashboard.dailyRevisionComplete')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('dashboard.dailyRevisionScore', { score, total: revision.questions.length })}
            </p>
          </div>
        ) : (
          <>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <h3 className="text-base font-bold leading-snug">
              <MathText content={currentQuestion.question} />
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.chooseAnswer')}</p>

            <div className="mt-4 space-y-2.5">
              {currentQuestion.options?.map((option, optionIndex) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
                const showCorrect = isChecked && isCorrectOption;
                const showWrong = isChecked && isSelected && !isCorrectOption;

                return (
                  <button
                    key={`${currentQuestion.id}-${optionIndex}`}
                    type="button"
                    disabled={isChecked}
                    aria-pressed={isSelected}
                    onClick={() => setAnswers((previous) => ({ ...previous, [currentQuestion.id]: option }))}
                    className={`flex w-full items-start gap-2.5 rounded-xl border-2 p-2.5 text-left transition-colors ${
                      showCorrect
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : showWrong
                          ? 'border-destructive bg-destructive/10'
                          : isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card/60 hover:border-primary/40 hover:bg-muted/40'
                    } disabled:cursor-default`}
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-black">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <MathText content={option} className="pt-0.5 text-sm font-medium leading-snug" />
                    {showCorrect && <CheckCircle2 className="ml-auto h-5 w-5 flex-shrink-0 text-emerald-600" />}
                    {showWrong && <XCircle className="ml-auto h-5 w-5 flex-shrink-0 text-destructive" />}
                  </button>
                );
              })}
            </div>

            {isChecked && (
              <div className={`mt-3 rounded-xl border p-3 ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">{isCorrect ? t('dashboard.correct') : t('dashboard.notQuite')}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={generatingExplanationFor === currentQuestion.id}
                    onClick={handleWhyClick}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    {generatingExplanationFor === currentQuestion.id ? t('dashboard.generatingWhy') : t('dashboard.why')}
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expandedExplanationFor === currentQuestion.id ? 'rotate-90' : ''}`} />
                  </Button>
                </div>
                {!isCorrect && (
                  <p className="mt-1 text-xs">
                    {t('dashboard.correctAnswer')}: <MathText content={currentQuestion.correctAnswer} className="font-semibold" />
                  </p>
                )}
                {expandedExplanationFor === currentQuestion.id && generatedExplanations[currentQuestion.id] && (
                  <div className="mt-3 border-t border-current/10 pt-3 text-xs font-medium text-foreground">
                    <MathText content={generatedExplanations[currentQuestion.id]} />
                  </div>
                )}
              </div>
            )}

          </div>

            {isReviewing ? (
              <div className="mt-4 flex shrink-0 gap-2">
                <Button type="button" variant="outline" className="flex-1 rounded-xl" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t('dashboard.previous')}
                </Button>
                <Button type="button" className="flex-1 rounded-xl" onClick={() => {
                  if (currentIndex === revision.questions.length - 1) setIsReviewing(false);
                  else setCurrentIndex((index) => index + 1);
                }}>
                  {currentIndex === revision.questions.length - 1 ? t('dashboard.done') : t('dashboard.nextQuestion')}
                  {currentIndex < revision.questions.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            ) : !isChecked ? (
              <Button
                className="mt-4 w-full shrink-0 rounded-xl"
                disabled={!selectedAnswer}
                onClick={() => setCheckedQuestions((previous) => [...previous, currentQuestion.id])}
              >
                {t('dashboard.checkAnswer')}
              </Button>
            ) : (
              <Button
                className="mt-4 w-full shrink-0 rounded-xl"
                onClick={() => {
                  if (currentIndex === revision.questions.length - 1) setIsComplete(true);
                  else setCurrentIndex((index) => index + 1);
                }}
              >
                {currentIndex === revision.questions.length - 1 ? t('dashboard.seeResults') : t('dashboard.nextQuestion')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const {
    currentQuiz,
    userAnswers,
    checkedQuestions,
    setCurrentQuiz,
    setSourceMaterial,
    resetQuiz,
    clearUserAnswers,
    clearRetryProgress,
    savedProgresses,
    loadSavedProgress,
    removeSavedProgress,
    clearRestoredState,
  } = useQuiz();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [revisionExitWarning, setRevisionExitWarning] = useState<{ open: boolean; quizId: string | null; type: 'saved' | null }>({
    open: false,
    quizId: null,
    type: null
  });

  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes?limit=8"],
  });

  const { data: progressItems, isLoading: isLoadingProgress } = useQuery<any[]>({
    // Share the canonical progress query with QuizProvider and the In Progress page.
    // Save/delete mutations invalidate this key, so the dashboard cannot retain a
    // stale limited-query result after the user changes their progress.
    queryKey: ["/api/quiz-progress"],
    staleTime: 0,
  });

  const { data: resultHistory, isLoading: isLoadingResultHistory } = useQuery<ResultHistoryItem[]>({
    queryKey: ["/api/user/result-history"],
  });

  const revisionCandidateIds = useMemo(() => {
    const recentlyUsedIds = resultHistory?.map((result) => result.quizId) || [];
    const recentlyCreatedIds = quizzes?.map((quiz) => quiz.id) || [];
    return Array.from(new Set([...recentlyUsedIds, ...recentlyCreatedIds])).slice(0, 12);
  }, [quizzes, resultHistory]);

  const [dailyRevisionKey, setDailyRevisionKey] = useState(getDailyRevisionDateKey);
  const dailyRevisionSelectionKey = `${DAILY_REVISION_SELECTION_PREFIX}${user?.id || 'anonymous'}:${dailyRevisionKey}`;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const currentDayKey = getDailyRevisionDateKey();
      setDailyRevisionKey((previousDayKey) => previousDayKey === currentDayKey ? previousDayKey : currentDayKey);
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const { data: dailyRevision, isLoading: isLoadingDailyRevision } = useQuery<DailyRevision | null>({
    // The candidate list deliberately is not part of this key. A revision is selected
    // once per user/day and must not refetch merely because dashboard data changes.
    queryKey: ["dashboard-daily-revision", user?.id, dailyRevisionKey],
    enabled: !!user && !isLoadingQuizzes && !isLoadingResultHistory,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const savedRevision = localStorage.getItem(dailyRevisionSelectionKey);
        if (savedRevision) {
          const parsedRevision = JSON.parse(savedRevision) as unknown;
          if (isDailyRevision(parsedRevision)) return parsedRevision;
          localStorage.removeItem(dailyRevisionSelectionKey);
        }
      } catch (error) {
        console.warn('Unable to restore the daily revision selection:', error);
      }

      const candidates = await Promise.all(
        revisionCandidateIds.map(async (quizId) => {
          const response = await fetch(`/api/quiz/${quizId}`, { credentials: 'include' });
          if (!response.ok) return null;
          return await response.json() as Quiz;
        }),
      );

      const eligibleCandidates = candidates.flatMap((quiz) => {
        if (!quiz) return [];
        const questions = quiz.questions.filter(
          (question) => question.type === 'multiple_choice' && (question.options?.length || 0) >= 2,
        );
        return questions.length >= 4 ? [{ quiz, questions }] : [];
      }).sort((first, second) => first.quiz.id.localeCompare(second.quiz.id));

      if (eligibleCandidates.length === 0) return null;

      // Cycle through eligible quizzes by calendar day. With multiple candidates,
      // tomorrow's revision comes from a different quiz while remaining stable today.
      const dayNumber = Math.floor(new Date(`${dailyRevisionKey}T00:00:00`).getTime() / 86_400_000);
      const selectedCandidate = eligibleCandidates[dayNumber % eligibleCandidates.length];
      const { quiz, questions: multipleChoiceQuestions } = selectedCandidate;

      // Keep the four-question set stable for the day while rotating it day to day.
      let seed = `${dailyRevisionKey}-${quiz.id}`
        .split('')
        .reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
      const shuffled = [...multipleChoiceQuestions];
      for (let index = shuffled.length - 1; index > 0; index--) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const swapIndex = seed % (index + 1);
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
      }

      const selectedRevision: DailyRevision = {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          category: quiz.category || 'Others/General',
        },
        questions: shuffled.slice(0, 4),
      };

      try {
        localStorage.setItem(dailyRevisionSelectionKey, JSON.stringify(selectedRevision));

        // Retain only today's immutable selection for this user.
        const userSelectionPrefix = `${DAILY_REVISION_SELECTION_PREFIX}${user?.id || 'anonymous'}:`;
        for (let index = localStorage.length - 1; index >= 0; index--) {
          const key = localStorage.key(index);
          if (key?.startsWith(userSelectionPrefix) && key !== dailyRevisionSelectionKey) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Unable to save the daily revision selection:', error);
      }

      return selectedRevision;
    },
  });

  const handleTakeQuiz = (quiz: any) => {
    setLocation(`/quiz?id=${encodeURIComponent(quiz.id)}`);
  };

  const handleStudyQuiz = async (quiz: any) => {
    // Fetch full quiz data since the list only has metadata
    try {
      const response = await fetch(`/api/quiz/${quiz.id}`);
      if (!response.ok) throw new Error("Failed to fetch quiz details");
      const fullQuiz = await response.json();

      setCurrentQuiz({
        ...fullQuiz,
        createdAt: typeof fullQuiz.createdAt === "string" ? fullQuiz.createdAt : fullQuiz.createdAt.toISOString(),
      } as any);
      setSourceMaterial({
        type: fullQuiz.sourceImageUrl ? "image" : null,
        text: fullQuiz.sourceText,
        imageDataUrl: fullQuiz.sourceImageUrl || null,
        isOfficeWithImages: (fullQuiz.sourceImages?.length || 0) > 0,
        documentImages: fullQuiz.sourceImages || [],
      });
      setLocation("/study");
    } catch (err) {
      console.error("Failed to load quiz details:", err);
    }
  };

  const handleContinueQuiz = () => {
    setLocation("/quiz");
  };

  const handleContinueSavedQuiz = (quizId: string) => {
    loadSavedProgress(quizId);
    setLocation("/quiz");
  };

  // Helper to check if a quiz item is in revision mode
  const isQuizInRevisionMode = (item: { quiz: Quiz; answers: Record<string, string>; checkedQuestions: string[] }) => {
    const answerKeys = Object.keys(item.answers);
    const retryAnswerKeys = answerKeys.filter(k => k.startsWith('retry-'));
    const totalQuestions = item.quiz.questions?.length || 0;
    const checkedQuestionsCount = item.checkedQuestions?.length || 0;

    // Calculate wrong answers from first attempt (case-insensitive comparison)
    let wrongQuestionsCount = 0;
    if (item.quiz.questions) {
      const questions = item.quiz.questions as any[];
      wrongQuestionsCount = questions.filter(q => {
        const userAnswer = item.answers[q.id];
        return userAnswer && userAnswer.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim();
      }).length;
    }

    const hasCompletedFirstAttempt = checkedQuestionsCount >= totalQuestions && totalQuestions > 0;
    const hasWrongAnswersToRetry = wrongQuestionsCount > 0;
    const hasRetryProgress = retryAnswerKeys.length > 0;

    return (hasCompletedFirstAttempt && hasWrongAnswersToRetry) || hasRetryProgress;
  };

  const handleDiscardProgress = () => {
    // Also delete from API if the current quiz has saved progress
    if (currentQuiz?.id) {
      removeSavedProgress(currentQuiz.id);
    }
    clearUserAnswers();
    resetQuiz();
  };

  const handleDiscardSavedProgress = (quizId: string) => {
    removeSavedProgress(quizId);
  };

  // Handle discard with revision warning
  const handleAttemptDiscard = (item: { type: 'saved'; quizId: string; quiz: Quiz; answers: Record<string, string>; checkedQuestions: string[] }) => {
    const isRevising = isQuizInRevisionMode(item);

    if (isRevising) {
      // Show warning dialog for revision mode exit
      setRevisionExitWarning({ open: true, quizId: item.quizId, type: 'saved' });
    } else {
      // No revision progress to lose, discard normally
      handleDiscardSavedProgress(item.quizId);
    }
  };

  // Confirm revision exit - delete the entire quiz progress
  const handleConfirmRevisionExit = () => {
    const { quizId } = revisionExitWarning;

    if (quizId) {
      handleDiscardSavedProgress(quizId);
    }

    setRevisionExitWarning({ open: false, quizId: null, type: null });
  };

  const hasInProgressQuiz = currentQuiz && Object.keys(userAnswers).length > 0;
  const inProgressAnsweredCount = Object.keys(userAnswers).filter(k => !k.startsWith('retry-')).length;
  const inProgressTotalCount = currentQuiz?.questions?.length || 0;

  // The API returns progress in newest-first order. The shared query is already
  // loaded by QuizProvider, so selecting one item here adds no extra request.
  const latestSavedQuiz = useMemo(() => {
    if (!progressItems || progressItems.length === 0) return null;

    const p = progressItems[0];
    const mergedAnswers: Record<string, string> = { ...p.answers };
    if (p.retryAnswers) {
      Object.entries(p.retryAnswers as Record<string, string>).forEach(([key, value]) => {
        mergedAnswers[`retry-${key}`] = value;
      });
    }

    return {
      type: 'saved' as const,
      quizId: p.quizId,
      quiz: p.quiz,
      answers: mergedAnswers,
      checkedQuestions: p.checkedQuestions || [],
      savedAt: p.savedAt,
    };
  }, [progressItems]);




  const hasSavedQuizzes = !!latestSavedQuiz;
  const shouldShowPageSkeleton = isLoadingQuizzes && !quizzes;

  if (shouldShowPageSkeleton) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Welcome header skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-56" />
          </div>

          {/* Daily revision skeleton is shown before continue learning on mobile. */}
          <div className="space-y-4 lg:hidden">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>

          {/* Main grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left column — quiz list */}
            <div className="lg:col-span-8 space-y-8">
              {/* Continue learning section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
                <Skeleton className="h-36 w-full rounded-2xl" />
              </div>

              {/* Recent quizzes section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-3 sm:gap-4 sm:p-4 rounded-2xl border border-border/50 bg-card/40"
                    >
                      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Skeleton className="h-3.5 w-16 rounded-md" />
                          <Skeleton className="h-3.5 w-14 rounded-md" />
                          <Skeleton className="hidden sm:block h-3.5 w-20 rounded-md" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl" />
                        <Skeleton className="h-9 w-9 sm:h-10 sm:w-20 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="lg:col-span-4 space-y-8">
              {/* Daily revision block */}
              <div className="hidden space-y-4 lg:block">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>

              {/* Quick actions block */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-36" />
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              </div>

              {/* Learning tip block */}
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalQuizzes = quizzes?.length || 0;
  const recentQuizzes = quizzes || [];
  const hasQuizzes = totalQuizzes > 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.welcomeBack'); // Adjusting slightly as dictionary has welcomeBack
    if (hour < 17) return t('dashboard.welcomeBack'); 
    return t('dashboard.welcomeBack');
  };



  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-8rem)] flex flex-col">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`space-y-8 flex-1 ${!hasQuizzes ? "flex flex-col items-center justify-center" : ""}`}
      >
        {/* Welcome Section */}
        <motion.section variants={itemVariants} className={!hasQuizzes ? "text-center w-full" : "w-full"}>
          <div className={`flex flex-col gap-4 ${!hasQuizzes ? "items-center" : "md:flex-row md:items-end md:justify-between"}`}>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                {getGreeting()}, <span className="text-primary">{user?.username || t('common.user')}</span>
              </h1>
              <p className="text-muted-foreground">
                {hasQuizzes
                  ? t('dashboard.continueWhereLeftOff')
                  : t('dashboard.createFirstQuiz')
                }
              </p>
            </div>
          </div>
        </motion.section>

        {/* Daily revision is shown before continue learning on mobile. */}
        {hasQuizzes && (
          <motion.section variants={itemVariants} className="space-y-4 lg:hidden">
            <div className="flex items-center gap-2 mb-1">
              <CalendarCheck className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-bold text-foreground">{t('dashboard.dailyRevision')}</h2>
            </div>
            <DailyRevisionPanel
              revision={dailyRevision}
              isLoading={isLoadingResultHistory || isLoadingDailyRevision}
              dayKey={dailyRevisionKey}
            />
          </motion.section>
        )}

        {/* Dynamic Grid Layout */}
        {!hasQuizzes ? (
          <motion.section variants={itemVariants} className="w-full max-w-2xl mx-auto">
            <EmptyState onCreateQuiz={() => setLocation("/create")} />
          </motion.section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
            {/* Main Content (Left Column) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Continue Section */}
              {(isLoadingProgress || latestSavedQuiz) && (
                <motion.section variants={itemVariants}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Play className="w-5 h-5 text-primary fill-primary" />
                      {t('dashboard.continueLearning')}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-bold text-muted-foreground hover:text-primary"
                      onClick={() => setLocation("/in-progress")}
                    >
                      {t('dashboard.viewAllInProgress')}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="relative">
                    {isLoadingProgress ? (
                      <Card className="overflow-hidden border border-border/50 bg-card/40">
                        <CardContent className="p-4 sm:p-5">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                              <div className="flex-1 min-w-0 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <div className="flex items-center gap-2">
                                  <Skeleton className="h-5 w-16 rounded-full" />
                                  <Skeleton className="h-5 w-20 rounded-full" />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-3 w-10" />
                              </div>
                              <Skeleton className="h-2.5 w-full rounded-full" />
                            </div>
                            <Skeleton className="h-10 w-full rounded-xl" />
                          </div>
                        </CardContent>
                      </Card>
                    ) : latestSavedQuiz ? (() => {
                      const item = latestSavedQuiz;
                      const answerKeys = Object.keys(item.answers);
                      const retryAnswerKeys = answerKeys.filter(k => k.startsWith('retry-'));
                      const originalAnswerKeys = answerKeys.filter(k => !k.startsWith('retry-'));
                      const totalQuestions = item.quiz.questions?.length || 0;
                      const checkedQuestionsCount = item.checkedQuestions?.length || 0;

                      let wrongQuestionsCount = 0;
                      if (item.quiz.questions) {
                        const questions = item.quiz.questions as any[];
                        wrongQuestionsCount = questions.filter(q => {
                          const userAnswer = item.answers[q.id];
                          return userAnswer && userAnswer.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim();
                        }).length;
                      }

                      const hasCompletedFirstAttempt = checkedQuestionsCount >= totalQuestions && totalQuestions > 0;
                      const hasWrongAnswersToRetry = wrongQuestionsCount > 0;
                      const hasRetryProgress = retryAnswerKeys.length > 0;
                      const isRevising = (hasCompletedFirstAttempt && hasWrongAnswersToRetry) || hasRetryProgress;

                      const retryAnsweredCount = retryAnswerKeys.length;
                      const retryTotalCount = wrongQuestionsCount;

                      return (
                        <ContinueQuizCard
                          quiz={item.quiz}
                          answeredCount={originalAnswerKeys.length}
                          totalCount={item.quiz.questions?.length || 0}
                          onContinue={() => handleContinueSavedQuiz(item.quizId)}
                          onDiscard={() => handleAttemptDiscard(item)}
                          isCurrent={false}
                          savedAt={item.savedAt}
                          isRevising={isRevising}
                          retryAnsweredCount={retryAnsweredCount}
                          retryTotalCount={retryTotalCount}
                        />
                      );
                    })() : null}
                  </div>
                </motion.section>
              )}

              {/* Recent Quizzes */}
              <motion.section variants={itemVariants}>
                <div>
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <h2 className="text-xl font-bold text-foreground">{t('dashboard.recentQuizzes')}</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation("/history")}
                      className="font-bold"
                    >
                      {t('dashboard.viewAll')}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {recentQuizzes.map((quiz, index) => (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        index={index}
                        onTake={() => handleTakeQuiz(quiz)}
                        onStudy={() => handleStudyQuiz(quiz)}
                      />
                    ))}
                  </div>
                </div>
              </motion.section>
            </div>

            {/* Sidebar (Right Column) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Daily Revision Sidebar Block */}
              <motion.section variants={itemVariants} className="hidden space-y-4 lg:block">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarCheck className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-bold text-foreground">{t('dashboard.dailyRevision')}</h2>
                </div>
                <div className="lg:pt-1">
                  <DailyRevisionPanel
                    revision={dailyRevision}
                    isLoading={isLoadingResultHistory || isLoadingDailyRevision}
                    dayKey={dailyRevisionKey}
                  />
                </div>
              </motion.section>

              {/* Quick Actions Sidebar Block */}
              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-5">
                  <Zap className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-bold text-foreground">{t('dashboard.quickActions')}</h2>
                </div>
                <div className="flex flex-col gap-4">
                  <QuickActionCard 
                    title={t('dashboard.createNewQuiz')}
                    description={t('dashboard.aiPoweredGeneration')}
                    icon={Plus}
                    onClick={() => setLocation("/create")}
                    variant="primary"
                    testId="card-create-quiz"
                  />
                  {recentQuizzes[0] && (
                    <QuickActionCard
                      title={t('dashboard.continueStudy')}
                      description={recentQuizzes[0].title}
                      icon={BookOpen}
                      onClick={() => handleStudyQuiz(recentQuizzes[0])}
                      testId="card-continue-studying"
                    />
                  )}
                </div>
              </motion.section>

              {/* Learning Tip Sidebar Block */}
              <LearningTipCard />
            </div>
          </div>
        )}
      </motion.div>

      <AlertDialog
        open={revisionExitWarning.open}
        onOpenChange={(open) => !open && setRevisionExitWarning({ open: false, quizId: null, type: null })}
      >
        <AlertDialogContent data-testid="dialog-revision-exit-warning">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.deleteQuizProgress')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.revisingWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-revision-exit">
              {t('dashboard.keepRevising')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevisionExit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-revision-exit"
            >
              {t('dashboard.deleteAllProgress')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
