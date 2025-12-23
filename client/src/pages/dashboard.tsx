import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Plus, BookOpen, Play, TrendingUp, Target, Award, 
  Clock, FileText, Loader2, Sparkles, ArrowRight, Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuiz } from "@/lib/quiz-context";
import type { Quiz } from "@shared/schema";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="text-3xl md:text-4xl font-bold text-foreground"
    >
      {value}{suffix}
    </motion.span>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial } = useQuiz();

  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
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

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDifficultyColor = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "hard": return "bg-red-500/10 text-red-600 dark:text-red-400";
      default: return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalQuizzes = quizzes?.length || 0;
  const totalQuestions = quizzes?.reduce((acc, q) => acc + (q.questions as any[]).length, 0) || 0;
  const recentQuizzes = quizzes?.slice(0, 4) || [];
  const hasQuizzes = totalQuizzes > 0;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Stats Section */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="overflow-visible">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quizzes Created</p>
                      <AnimatedCounter value={totalQuizzes} />
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="overflow-visible">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Questions</p>
                      <AnimatedCounter value={totalQuestions} />
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="col-span-2 md:col-span-1">
              <Card className="overflow-visible">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Keep Going</p>
                      <div className="flex items-center gap-2">
                        <AnimatedCounter value={hasQuizzes ? 1 : 0} />
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card 
                className="cursor-pointer border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-visible"
                onClick={() => setLocation("/")}
                data-testid="card-create-quiz"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="p-3 rounded-xl bg-primary/10"
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Plus className="w-6 h-6 text-primary" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Create New Quiz</h3>
                      <p className="text-sm text-muted-foreground">Upload materials and generate a quiz</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {hasQuizzes && recentQuizzes[0] && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  className="cursor-pointer border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-visible"
                  onClick={() => handleStudyQuiz(recentQuizzes[0])}
                  data-testid="card-continue-studying"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="p-3 rounded-xl bg-primary/10"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <BookOpen className="w-6 h-6 text-primary" />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">Continue Studying</h3>
                        <p className="text-sm text-muted-foreground truncate">{recentQuizzes[0].title}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!hasQuizzes && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  className="cursor-pointer border-dashed overflow-visible"
                  onClick={() => setLocation("/")}
                  data-testid="card-get-started"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted">
                        <Sparkles className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">Get Started</h3>
                        <p className="text-sm text-muted-foreground">Create your first quiz to begin</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Recent Quizzes */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Quizzes</h2>
            {hasQuizzes && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/history")}
                data-testid="button-view-all"
              >
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {!hasQuizzes ? (
            <Card>
              <CardContent className="py-12 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Upload your study materials and let AI create personalized quizzes for you
                  </p>
                  <Button onClick={() => setLocation("/")} data-testid="button-create-first">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Quiz
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {recentQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  variants={itemVariants}
                  custom={index}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full overflow-visible" data-testid={`card-recent-quiz-${quiz.id}`}>
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground truncate mb-2">{quiz.title}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(quiz.createdAt)}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {(quiz.questions as any[]).length} Qs
                            </Badge>
                            {quiz.difficulty && (
                              <Badge className={`text-xs ${getDifficultyColor(quiz.difficulty)}`}>
                                {quiz.difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleTakeQuiz(quiz)}
                            className="flex-1"
                            data-testid={`button-take-${quiz.id}`}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Take
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStudyQuiz(quiz)}
                            className="flex-1"
                            data-testid={`button-study-${quiz.id}`}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Study
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </motion.div>
    </div>
  );
}
