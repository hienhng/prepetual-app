import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Loader2, Play, Sparkles, Clock, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuiz } from "@/lib/quiz-context";
import type { Quiz } from "@shared/schema";
import logoImage from "@assets/image_1765894870887.png";

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { setCurrentQuiz } = useQuiz();

  const { data: quiz, isLoading, error } = useQuery<Quiz>({
    queryKey: ["/api/share", id],
    enabled: !!id,
  });

  const handleStartQuiz = () => {
    if (quiz) {
      setCurrentQuiz({
        ...quiz,
        createdAt: typeof quiz.createdAt === "string" ? quiz.createdAt : quiz.createdAt.toISOString(),
      } as any);
      setLocation("/quiz");
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

  if (error || !quiz) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Quiz not found</h2>
        <p className="text-muted-foreground mb-4">
          This quiz may have been deleted or the link is invalid
        </p>
        <Link href="/">
          <Button data-testid="button-go-home">Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 border-2 rounded-full  flex items-center justify-center mx-auto mb-4">
            <img src={logoImage} alt="Prepetual Logo" className="w-12 h-12 rounded-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Shared Quiz</h1>
          <p className="text-muted-foreground">Someone shared a quiz with you</p>
        </div>

        <Card data-testid="card-shared-quiz">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold">{quiz.title}</h2>
            </div>
            
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDate(quiz.createdAt)}
              </div>
              <Badge variant="secondary">
                {(quiz.questions as any[]).length} questions
              </Badge>
              {quiz.difficulty && (
                <Badge className={`${getDifficultyColor(quiz.difficulty)}`}>
                  {quiz.difficulty}
                </Badge>
              )}
            </div>

            <Button
              className="w-full py-6 text-lg hover:scale-[1.03] transition-transform"
              onClick={handleStartQuiz}
              data-testid="button-start-shared-quiz"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Quiz
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Want to create your own quizzes?{" "}
          <Link href="/" className="text-primary hover:underline">
            Get started
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
