import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Plus, BookOpen, Play, Target,
  Clock, FileText, Loader2, Sparkles, ArrowRight,
  Brain, GraduationCap, Lightbulb, ChartNoAxesColumn, ChevronLeft, ChevronRight, X,
  Calculator, Languages, FlaskConical, Globe2, HelpCircle, BookText, Zap,
  Binary, Book, Globe
} from "lucide-react";
import { getCategoryIcon, getCategoryTranslationKey } from "@/lib/category-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faBullseye,
  faChartSimple,
  faComment,
  faMessage
} from "@fortawesome/free-solid-svg-icons";
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
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/language-context";
import type { Quiz } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";


// Difficulty to Color mapping
const difficultyColors: Record<string, { border: string, from: string, via: string, text: string, icon: string, shadow: string, badge: string }> = {
  "easy": {
    border: "border-emerald-500/30",
    from: "from-emerald-500/10",
    via: "via-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    shadow: "shadow-emerald-500/5",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900",
  },
  "medium": {
    border: "border-amber-500/30",
    from: "from-amber-500/10",
    via: "via-amber-500/5",
    text: "text-amber-600 dark:text-amber-400",
    icon: "bg-gradient-to-br from-amber-500 to-amber-600",
    shadow: "shadow-amber-500/5",
    badge: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900",
  },
  "hard": {
    border: "border-rose-500/30",
    from: "from-rose-500/10",
    via: "via-rose-500/5",
    text: "text-rose-600 dark:text-rose-400",
    icon: "bg-gradient-to-br from-rose-500 to-rose-600",
    shadow: "shadow-rose-500/5",
    badge: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900",
  }
};

interface UserStats {
  averageAccuracy: number;
  totalAttempts: number;
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

function CountingNumber({ value, duration = 2 }: { value: number | string, duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const targetValue = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, '')) || 0;
  const isPercent = typeof value === 'string' && value.includes('%');

  useEffect(() => {
    let start = 0;
    const end = targetValue;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const timer = setInterval(() => {
      start += Math.ceil(end / (duration * 60));
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [targetValue, duration]);

  return <>{isPercent ? `${displayValue}%` : displayValue}</>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  isActive = true,
  onClick,
  color = "blue"
}: {
  label: string;
  value: number | string;
  icon: any;
  isActive?: boolean;
  onClick?: () => void;
  color?: "blue" | "violet" | "emerald";
}) {
  const colorSchemes = {
    blue: {
      bg: "bg-blue-50/50 dark:bg-blue-500/5",
      border: "border-blue-100 dark:border-blue-500/10",
      iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
      iconText: "text-blue-600 dark:text-blue-400"
    },
    violet: {
      bg: "bg-violet-50/50 dark:bg-violet-500/5",
      border: "border-violet-100 dark:border-violet-500/10",
      iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
      iconText: "text-violet-600 dark:text-violet-400"
    },
    emerald: {
      bg: "bg-emerald-50/50 dark:bg-emerald-500/5",
      border: "border-emerald-100 dark:border-emerald-500/10",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconText: "text-emerald-600 dark:text-emerald-400"
    },
    muted: {
      bg: "bg-muted/30",
      border: "border-border",
      iconBg: "bg-muted",
      iconText: "text-muted-foreground"
    }
  };

  const scheme = isActive ? colorSchemes[color] : colorSchemes.muted;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`relative h-full ${onClick ? "cursor-pointer" : ""}`}
    >
      <Card className={`h-full border ${scheme.border} ${scheme.bg} shadow-sm overflow-hidden group transition-all duration-300`}>
        <CardContent className="p-5 h-full flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${scheme.iconBg} ${scheme.iconText} transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-0.5">
              {label}
            </p>
            <div className="text-2xl font-black tracking-tight text-foreground">
              <CountingNumber value={value} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


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

            <motion.div
              className="absolute -top-2 -right-2 p-1.5 bg-card rounded-xl shadow-lg border border-border/50"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
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
            className="h-12 px-8 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            <Plus className="w-5 h-5 mr-2 stroke-[3]" />
            {t('history.createQuiz')}
          </Button>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs font-medium text-muted-foreground/60">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border/50">
                <FileText className="w-6 h-6" />
              </div>
              <span>{t('home.hero.fileFormats').split(',')[0]}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border/50">
                <Brain className="w-6 h-6" />
              </div>
              <span>{t('home.features.aiGen.title')}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border/50">
                <Target className="w-6 h-6" />
              </div>
              <span>{t('home.cta.title1').split(' ')[0]} {t('about.subjects.Math.title')}</span>
            </div>
          </div>
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
      <div className="relative flex items-center gap-4 p-4 rounded-2xl bg-card/40 hover:bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <CategoryIcon className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {quiz.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded-md">
              <HelpCircle className="w-3 h-3" />
              {t('history.questions', { count: questionCount })}
            </span>
            <Badge variant="outline" className={`h-5 text-[10px] capitalize px-2 font-bold ${colors.badge}`}>
              {t(`quizGenerator.${difficulty}`)}
            </Badge>
            <span className="flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded-md">
              {t(getCategoryTranslationKey(quiz.category))}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 opacity-70">
              <Clock className="w-3 h-3" />
              {t('inProgress.ago', { time: formatDistanceToNow(new Date(quiz.createdAt)) })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-xl hidden sm:flex hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); onStudy(); }}
            data-testid={`button-study-${quiz.id}`}
          >
            <BookOpen className="w-5 h-5" />
          </Button>
          <Button
            size="default"
            className="h-10 px-5 rounded-xl font-bold shadow-sm shadow-primary/20 group-hover:shadow-primary/40 transition-all"
            onClick={(e) => { e.stopPropagation(); onTake(); }}
            data-testid={`button-take-${quiz.id}`}
          >
            <Play className="w-4 h-4 mr-2 fill-current" />
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

  return (
    <motion.div
      whileHover={{ y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative group"
    >
      <Card className={`overflow-hidden border ${isRevising ? 'border-violet-500/40' : colors.border} transition-all duration-300 bg-gradient-to-br ${isRevising ? 'from-violet-500/5 via-purple-500/5' : `${colors.from} ${colors.via}`} to-transparent`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            {/* Header row */}
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${isRevising ? 'bg-gradient-to-br from-violet-500 to-purple-600' : colors.icon}`}>
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
                    className={`absolute inset-y-0 left-0 rounded-full ${colors.icon.replace('bg-gradient-to-br', 'bg-gradient-to-r')}`}
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
              className={`w-full gap-2 h-10 shadow-md transition-all duration-300 ${isRevising
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
                : colors.icon.replace('bg-gradient-to-br', 'bg-gradient-to-r')
                } hover:brightness-110 text-white border-0`}
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

  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes?limit=8"],
  });

  const { data: latestProgress } = useQuery<any[]>({
    queryKey: ["/api/quiz-progress?limit=1"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const handleTakeQuiz = async (quiz: any) => {
    // Check if there's saved progress for this quiz
    const hasSavedProgress = savedProgresses.some(p => p.quizId === quiz.id);
    if (hasSavedProgress) {
      loadSavedProgress(quiz.id);
      setLocation("/quiz");
      return;
    }

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
      setLocation("/quiz");
    } catch (err) {
      console.error("Failed to load quiz details:", err);
    }
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

  // Show only the latest saved progress in the dashboard to ease loading
  const latestSavedQuiz = useMemo(() => {
    if (!latestProgress || latestProgress.length === 0) return null;

    const p = latestProgress[0];
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
  }, [latestProgress]);




  const hasSavedQuizzes = !!latestSavedQuiz;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const totalQuizzes = quizzes?.length || 0;
  const totalQuestions = quizzes?.reduce((acc, q) => acc + (q as any).questionCount, 0) || 0;
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
              {latestSavedQuiz && (
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
                    {(() => {
                      const item = latestSavedQuiz;
                      if (!item) return null;
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
                    })()}
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
              {/* Stats Sidebar Block */}
              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <ChartNoAxesColumn className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-bold text-foreground">{t('dashboard.yourStats')}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <StatCard
                    label={t('dashboard.created')}
                    value={totalQuizzes}
                    icon={() => <FontAwesomeIcon icon={faFileLines} className="h-6 w-6" />}
                    color="blue"
                  />
                  <StatCard
                    label={t('dashboard.questions')}
                    value={totalQuestions}
                    icon={() => <FontAwesomeIcon icon={faMessage} className="h-6 w-6" />}
                    color="violet"
                  />
                  <StatCard
                    label={t('dashboard.accuracy')}
                    value={userStats?.totalAttempts ? `${userStats.averageAccuracy}%` : "-"}
                    icon={() => <FontAwesomeIcon icon={faChartSimple} className="h-6 w-6" />}
                    color="emerald"
                    isActive={(userStats?.totalAttempts ?? 0) > 0}
                    onClick={() => setLocation("/progress")}
                  />
                </div>
              </motion.section>

              {/* Quick Actions Sidebar Block */}
              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
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
