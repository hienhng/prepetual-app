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
import type { Quiz } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

// Category to Icon mapping
const categoryIcons: Record<string, any> = {
  "Math": Binary,
  "English": Book,
  "Science": FlaskConical,
  "Social Studies": Globe,
  "Global Languages": Languages,
  "Others/General": GraduationCap,
};

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

const learningTips = [
  "Spaced repetition helps you remember better. Try reviewing your quizzes at increasing intervals for maximum retention.",
  "Teaching others what you've learned is one of the best ways to reinforce your own understanding.",
  "Taking breaks between study sessions helps your brain consolidate information more effectively.",
  "Active recall (testing yourself) is more effective than passive review. Keep taking those quizzes!",
  "Getting enough sleep is crucial for memory consolidation. Your brain processes what you learned while you rest.",
  "Mix up different topics in your study sessions. Interleaving subjects can improve long-term retention.",
  "Write down key concepts by hand. The physical act of writing helps cement information in memory.",
  "Create mental associations or stories to connect new information with what you already know.",
  "Study in short, focused bursts of 25-30 minutes, then take a 5-minute break. This is called the Pomodoro Technique.",
  "Challenge yourself with harder questions. Struggling a bit helps you learn more deeply.",
  "Review material right before sleep. Your brain will continue processing it overnight.",
  "Explain concepts in your own words. If you can't simplify it, you don't understand it well enough yet.",
  "Stay hydrated and maintain good nutrition. Your brain needs proper fuel to learn effectively.",
  "Test yourself before you think you're ready. Making mistakes early helps identify gaps in your knowledge.",
  "Connect new concepts to real-world examples. Practical applications make abstract ideas stick better.",
  "When doing multiple-choice questions, don't just find the right answer. Explain to yourself why the other three options are wrong. This triples your learning from a single question.",
  "Upload your material and take a quiz before you start intensive studying. This 'pre-test' highlights exactly which parts of the PDF you already know and which parts need your full attention.",
];

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
            Level Up Your Learning
          </h3>
          <p className="text-muted-foreground mb-8 leading-relaxed text-base font-medium">
            Turn your study notes into powerful AI-driven quizzes in seconds.
          </p>

          <Button
            size="lg"
            onClick={onCreateQuiz}
            data-testid="button-create-first"
            className="h-12 px-8 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            <Plus className="w-5 h-5 mr-2 stroke-[3]" />
            Get Started Now
          </Button>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs font-medium text-muted-foreground/60">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border/50">
                <FileText className="w-6 h-6" />
              </div>
              <span>PDFs</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border/50">
                <Brain className="w-6 h-6" />
              </div>
              <span>AI Analysis</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border/50">
                <Target className="w-6 h-6" />
              </div>
              <span>Master Topic</span>
            </div>
          </div>
        </motion.div>
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
  const difficultyRaw = quiz.difficulty?.toLowerCase() || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(difficultyRaw) ? difficultyRaw : "medium") as "easy" | "medium" | "hard";
  const colors = difficultyColors[difficulty] || difficultyColors.medium;
  const CategoryIcon = categoryIcons[quiz.category || "Others/General"] || GraduationCap;
  const questionCount = (quiz.questions as any[]).length;

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
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${colors.icon.replace('bg-gradient-to-br', 'bg')}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {quiz.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded-md">
              <HelpCircle className="w-3 h-3" />
              {questionCount} questions
            </span>
            <Badge variant="outline" className={`h-5 text-[10px] capitalize px-2 font-bold ${colors.badge}`}>
              {difficulty}
            </Badge>
            <span className="hidden sm:inline-flex items-center gap-1 opacity-70">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(quiz.createdAt))} ago
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
            <span className="hidden sm:inline">Start</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function LearningTipCard() {
  const randomTip = useMemo(() => {
    return learningTips[Math.floor(Math.random() * learningTips.length)];
  }, []);

  return (
    <motion.section variants={itemVariants}>
      <Card className="overflow-visible bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Learning Tip</h3>
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
  const displayAnswered = isRevising ? retryAnsweredCount : answeredCount;
  const displayTotal = isRevising ? retryTotalCount : totalCount;
  const progress = Math.round((displayAnswered / displayTotal) * 100) || 0;
  const remaining = displayTotal - displayAnswered;

  const difficultyRaw = quiz.difficulty?.toLowerCase() || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(difficultyRaw) ? difficultyRaw : "medium") as "easy" | "medium" | "hard";
  const colors = difficultyColors[difficulty] || difficultyColors.medium;
  const CategoryIcon = categoryIcons[quiz.category || "Others/General"] || GraduationCap;

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
                          Revising
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold ${colors.badge}`}>
                          {difficulty}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeLabel} ago
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
                  {remaining} question{remaining !== 1 ? 's' : ''} left to review
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {displayAnswered} of {displayTotal} completed
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
              <span className="font-semibold">{isRevising ? 'Continue Review' : 'Continue Quiz'}</span>
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
  const [revisionExitWarning, setRevisionExitWarning] = useState<{ open: boolean; quizId: string | null; type: 'saved' | null }>({
    open: false,
    quizId: null,
    type: null
  });

  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const handleTakeQuiz = (quiz: Quiz) => {
    // Check if there's saved progress for this quiz
    const hasSavedProgress = savedProgresses.some(p => p.quizId === quiz.id);
    if (hasSavedProgress) {
      loadSavedProgress(quiz.id);
    } else {
      setCurrentQuiz({
        ...quiz,
        createdAt: typeof quiz.createdAt === "string" ? quiz.createdAt : quiz.createdAt.toISOString(),
      } as any);
      setSourceMaterial({
        type: quiz.sourceImageUrl ? "image" : null,
        text: quiz.sourceText,
        imageDataUrl: quiz.sourceImageUrl || null,
        isOfficeWithImages: (quiz.sourceImages?.length || 0) > 0,
        documentImages: quiz.sourceImages || [],
      });
    }
    setLocation("/quiz");
  };

  const handleStudyQuiz = (quiz: Quiz) => {
    setCurrentQuiz({
      ...quiz,
      createdAt: typeof quiz.createdAt === "string" ? quiz.createdAt : quiz.createdAt.toISOString(),
    } as any);
    setSourceMaterial({
      type: quiz.sourceImageUrl ? "image" : null,
      text: quiz.sourceText,
      imageDataUrl: quiz.sourceImageUrl || null,
      isOfficeWithImages: (quiz.sourceImages?.length || 0) > 0,
      documentImages: quiz.sourceImages || [],
    });
    setLocation("/study");
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

  // Show only saved progresses from the database in the carousel
  const allSavedQuizzes = useMemo(() => {
    const items: Array<{
      type: 'saved';
      quizId: string;
      quiz: Quiz;
      answers: Record<string, string>;
      checkedQuestions: string[];
      savedAt: string;
    }> = [];

    // Only show saved progresses from the API (with savedAt timestamps)
    savedProgresses.forEach(p => {
      // Merge retryAnswers into answers with 'retry-' prefix for revision detection
      const mergedAnswers: Record<string, string> = { ...p.answers };
      if (p.retryAnswers) {
        Object.entries(p.retryAnswers).forEach(([key, value]) => {
          mergedAnswers[`retry-${key}`] = value;
        });
      }

      items.push({
        type: 'saved',
        quizId: p.quizId,
        quiz: p.quiz,
        answers: mergedAnswers,
        checkedQuestions: p.checkedQuestions || [],
        savedAt: p.savedAt,
      });
    });

    return items;
  }, [savedProgresses]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      setActiveIndex(Math.round(scrollLeft / clientWidth));
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, allSavedQuizzes]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };


  const hasSavedQuizzes = allSavedQuizzes.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const totalQuizzes = quizzes?.length || 0;
  const totalQuestions = quizzes?.reduce((acc, q) => acc + (q.questions as any[]).length, 0) || 0;
  const recentQuizzes = quizzes?.slice(0, 6) || [];
  const hasQuizzes = totalQuizzes > 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };



  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Welcome Section */}
        <motion.section variants={itemVariants}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                {getGreeting()}, <span className="text-primary">{user?.username || 'Learner'}</span>
              </h1>
              <p className="text-muted-foreground">
                {hasQuizzes
                  ? "Continue where you left off or create something new."
                  : "Let's create your first quiz and start learning."
                }
              </p>
            </div>
          </div>
        </motion.section>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Continue Section */}
            {hasSavedQuizzes && (
              <motion.section variants={itemVariants} className="relative group/carousel">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary fill-primary" />
                    Continue Learning
                  </h2>
                  <div className="hidden md:flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-9 w-9 rounded-full transition-all duration-300 ${!canScrollLeft ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                      onClick={() => scroll('left')}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-9 w-9 rounded-full transition-all duration-300 ${!canScrollRight ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                      onClick={() => scroll('right')}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {allSavedQuizzes.map((item, idx) => {
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
                        <div
                          key={item.quizId + idx}
                          className="w-full flex-shrink-0 snap-center"
                        >
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
                        </div>
                      );
                    })}
                  </div>

                  {allSavedQuizzes.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-2">
                      {allSavedQuizzes.map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeIndex === i ? 'bg-primary w-3' : 'bg-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* Recent Quizzes or Empty State */}
            <motion.section variants={itemVariants}>
              {!hasQuizzes ? (
                <EmptyState onCreateQuiz={() => setLocation("/create")} />
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <h2 className="text-xl font-bold text-foreground">Recent Quizzes</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation("/history")}
                      className="font-bold"
                    >
                      View all
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
              )}
            </motion.section>
          </div>

          {/* Sidebar (Right Column) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Stats Sidebar Block */}
            {hasQuizzes && (
              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <ChartNoAxesColumn className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-bold text-foreground">Your Stats</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <StatCard
                    label="CREATED"
                    value={totalQuizzes}
                    icon={() => <FontAwesomeIcon icon={faFileLines} className="h-6 w-6" />}
                    color="blue"
                  />
                  <StatCard
                    label="QUESTIONS"
                    value={totalQuestions}
                    icon={() => <FontAwesomeIcon icon={faMessage} className="h-6 w-6" />}
                    color="violet"
                  />
                  <StatCard
                    label="ACCURACY"
                    value={userStats?.totalAttempts ? `${userStats.averageAccuracy}%` : "-"}
                    icon={() => <FontAwesomeIcon icon={faChartSimple} className="h-6 w-6" />}
                    color="emerald"
                    isActive={(userStats?.totalAttempts ?? 0) > 0}
                    onClick={() => setLocation("/progress")}
                  />
                </div>
              </motion.section>
            )}

            {/* Quick Actions Sidebar Block */}
            {hasQuizzes && (
              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
                </div>
                <div className="flex flex-col gap-4">
                  <QuickActionCard
                    title="Create New Quiz"
                    description="AI-powered generation"
                    icon={Plus}
                    onClick={() => setLocation("/create")}
                    variant="primary"
                    testId="card-create-quiz"
                  />
                  {recentQuizzes[0] && (
                    <QuickActionCard
                      title="Continue Study"
                      description={recentQuizzes[0].title}
                      icon={BookOpen}
                      onClick={() => handleStudyQuiz(recentQuizzes[0])}
                      testId="card-continue-studying"
                    />
                  )}
                </div>
              </motion.section>
            )}

            {/* Learning Tip Sidebar Block */}
            {hasQuizzes && <LearningTipCard />}
          </div>
        </div>
      </motion.div>

      <AlertDialog
        open={revisionExitWarning.open}
        onOpenChange={(open) => !open && setRevisionExitWarning({ open: false, quizId: null, type: null })}
      >
        <AlertDialogContent data-testid="dialog-revision-exit-warning">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              You're currently revising this quiz. Deleting will remove all your progress including your original answers and revision progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-revision-exit">
              Keep Revising
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevisionExit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-revision-exit"
            >
              Delete All Progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
