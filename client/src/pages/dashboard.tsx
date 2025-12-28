import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Plus, BookOpen, Play, Target, 
  Clock, FileText, Loader2, Sparkles, ArrowRight, 
  Flame, Brain, GraduationCap, Lightbulb
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import type { Quiz } from "@shared/schema";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
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

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  gradient 
}: { 
  label: string; 
  value: number | string; 
  icon: any; 
  gradient: string;
}) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-visible border-0 shadow-md">
        <CardContent className="p-0">
          <div className={`p-5 rounded-md ${gradient}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/80 mb-1">{label}</p>
                <motion.p 
                  className="text-3xl font-bold text-white"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  {value}
                </motion.p>
              </div>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Icon className="w-6 h-6 text-white" />
              </div>
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
    >
      <Card 
        className={`cursor-pointer overflow-visible transition-shadow hover:shadow-lg ${
          isPrimary 
            ? "bg-gradient-to-br from-primary to-primary/80 border-0" 
            : "border-border/50"
        }`}
        onClick={onClick}
        data-testid={testId}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <motion.div 
              className={`p-3 rounded-xl ${isPrimary ? "bg-white/20" : "bg-primary/10"}`}
              whileHover={{ rotate: isPrimary ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className={`w-6 h-6 ${isPrimary ? "text-white" : "text-primary"}`} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold mb-0.5 ${isPrimary ? "text-white" : "text-foreground"}`}>
                {title}
              </h3>
              <p className={`text-sm truncate ${isPrimary ? "text-white/80" : "text-muted-foreground"}`}>
                {description}
              </p>
            </div>
            <ArrowRight className={`w-5 h-5 flex-shrink-0 ${isPrimary ? "text-white/60" : "text-muted-foreground"}`} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ onCreateQuiz }: { onCreateQuiz: () => void }) {
  return (
    <Card className="overflow-visible">
      <CardContent className="py-16 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md mx-auto"
        >
          <motion.div 
            className="relative w-32 h-32 mx-auto mb-8 cursor-pointer group"
            animate={floatAnimation}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-quiz-purple/20 to-primary/20 rounded-full blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full transition-all duration-300 group-hover:from-primary/30 group-hover:to-primary/15"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ background: "conic-gradient(from 0deg, hsl(var(--primary) / 0.2), hsl(var(--quiz-purple) / 0.1), hsl(var(--primary) / 0.2))" }}
            />
            <div className="absolute inset-1 bg-background rounded-full" />
            <div className="absolute inset-4 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full transition-all duration-300 group-hover:from-primary/40 group-hover:to-primary/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Brain className="w-12 h-12 text-primary transition-transform duration-300 group-hover:scale-110" />
              </motion.div>
            </div>
            <motion.div 
              className="absolute -top-1 -right-1"
              animate={{ y: [0, -4, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-6 h-6 text-primary transition-all duration-300 group-hover:scale-125 group-hover:text-quiz-purple" />
            </motion.div>
            <motion.div 
              className="absolute -bottom-1 -left-1"
              animate={{ y: [0, 3, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-quiz-purple/70 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
            </motion.div>
          </motion.div>
          
          <h3 className="text-2xl font-bold text-foreground mb-3">
            Ready to learn smarter?
          </h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Upload your study materials and let AI create personalized quizzes tailored just for you.
          </p>
          
          <Button size="lg" onClick={onCreateQuiz} data-testid="button-create-first">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Quiz
          </Button>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>PDFs</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span>Images</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Any topic</span>
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
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDifficultyStyle = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "hard": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      default: return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  };

  const questionCount = (quiz.questions as any[]).length;

  return (
    <motion.div
      variants={itemVariants}
      custom={index}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full overflow-visible group" data-testid={`card-recent-quiz-${quiz.id}`}>
        <CardContent className="p-5">
          <div className="space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{quiz.title}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs font-normal">
                  <Target className="w-3 h-3 mr-1" />
                  {questionCount} {questionCount === 1 ? "question" : "questions"}
                </Badge>
                {quiz.difficulty && (
                  <Badge variant="outline" className={`text-xs font-normal ${getDifficultyStyle(quiz.difficulty)}`}>
                    {quiz.difficulty}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDate(quiz.createdAt)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onStudy}
                  data-testid={`button-study-${quiz.id}`}
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={onTake}
                  data-testid={`button-take-${quiz.id}`}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Take
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial } = useQuiz();
  const { user } = useAuth();

  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const { data: streakData } = useQuery<StreakData>({
    queryKey: ["/api/user/streak"],
  });

  const handleTakeQuiz = (quiz: Quiz) => {
    setCurrentQuiz({
      ...quiz,
      createdAt: typeof quiz.createdAt === "string" ? quiz.createdAt : quiz.createdAt.toISOString(),
    } as any);
    setSourceMaterial({
      type: quiz.sourceImageUrl ? "image" : null,
      text: quiz.sourceText,
      imageDataUrl: quiz.sourceImageUrl || null,
    });
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
    });
    setLocation("/study");
  };

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
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {getGreeting()}
              </h1>
              <p className="text-muted-foreground">
                {hasQuizzes 
                  ? "Continue where you left off or create something new."
                  : "Let's create your first quiz and start learning."
                }
              </p>
            </div>
            {hasQuizzes && (
              <Button onClick={() => setLocation("/create")} data-testid="button-create-new">
                <Plus className="w-4 h-4 mr-2" />
                New Quiz
              </Button>
            )}
          </div>
        </motion.section>

        {/* Stats Section */}
        {hasQuizzes && (
          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Quizzes"
                value={totalQuizzes}
                icon={FileText}
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                label="Questions"
                value={totalQuestions}
                icon={Target}
                gradient="bg-gradient-to-br from-violet-500 to-violet-600"
              />
              <StatCard
                label="Streak"
                value={streakData?.currentStreak ?? 0}
                icon={Flame}
                gradient="bg-gradient-to-br from-orange-500 to-orange-600"
              />
              <StatCard
                label="This Week"
                value={`${Math.min(totalQuizzes, 7)}`}
                icon={GraduationCap}
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
            </div>
          </motion.section>
        )}

        {/* Quick Actions */}
        {hasQuizzes && (
          <motion.section variants={itemVariants}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <QuickActionCard
                title="Create New Quiz"
                description="Upload materials and generate questions"
                icon={Plus}
                onClick={() => setLocation("/create")}
                variant="primary"
                testId="card-create-quiz"
              />
              {recentQuizzes[0] && (
                <QuickActionCard
                  title="Continue Studying"
                  description={recentQuizzes[0].title}
                  icon={BookOpen}
                  onClick={() => handleStudyQuiz(recentQuizzes[0])}
                  testId="card-continue-studying"
                />
              )}
            </div>
          </motion.section>
        )}

        {/* Recent Quizzes or Empty State */}
        <motion.section variants={itemVariants}>
          {hasQuizzes && (
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Quizzes</h2>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/history")}
                data-testid="button-view-all"
              >
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {!hasQuizzes ? (
            <EmptyState onCreateQuiz={() => setLocation("/create")} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          )}
        </motion.section>

        {/* Learning Tip */}
        {hasQuizzes && <LearningTipCard />}
      </motion.div>
    </div>
  );
}
