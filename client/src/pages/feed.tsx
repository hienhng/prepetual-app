import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Globe, Play, Clock, FileText, Loader2, 
  Users, BookOpen, Sparkles 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuiz } from "@/lib/quiz-context";
import type { Quiz } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

type PublicQuiz = Quiz & { 
  author?: { 
    firstName: string | null; 
    lastName: string | null; 
    profileImageUrl: string | null;
  } 
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Feed() {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial } = useQuiz();

  const { data: quizzes, isLoading } = useQuery<PublicQuiz[]>({
    queryKey: ["/api/public-quizzes"],
  });

  const handleTakeQuiz = (quiz: PublicQuiz) => {
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

  const handleStudyQuiz = (quiz: PublicQuiz) => {
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

  const getAuthorName = (author?: PublicQuiz["author"]) => {
    if (!author) return "Anonymous";
    const firstName = author.firstName || "";
    const lastName = author.lastName || "";
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return "Anonymous";
  };

  const getAuthorInitials = (author?: PublicQuiz["author"]) => {
    if (!author) return "A";
    const first = author.firstName?.[0] || "";
    const last = author.lastName?.[0] || "";
    return (first + last).toUpperCase() || "A";
  };

  const getDifficultyColor = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "hard": return "bg-red-500/10 text-red-600 dark:text-red-400";
      default: return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    }
  };

  const formatRelativeDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Community Feed</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Discover and take quizzes shared by others
            </p>
          </div>
        </motion.div>

        {!quizzes || quizzes.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No shared quizzes yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share a quiz with the community!
                </p>
                <Button onClick={() => setLocation("/create")} data-testid="button-create-quiz">
                  Create a Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                variants={itemVariants}
                custom={index}
              >
                <Card className="hover-elevate overflow-visible" data-testid={`card-public-quiz-${quiz.id}`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold line-clamp-2 mb-2">
                            {quiz.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {(quiz.questions as any[]).length} questions
                            </Badge>
                            {quiz.difficulty && (
                              <Badge className={`text-xs ${getDifficultyColor(quiz.difficulty)}`}>
                                {quiz.difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2 border-t">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getAuthorInitials(quiz.author)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <span className="text-foreground font-medium">
                              {getAuthorName(quiz.author)}
                            </span>
                            <span className="text-muted-foreground mx-1.5">·</span>
                            <span className="text-muted-foreground text-xs">
                              {formatRelativeDate(quiz.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStudyQuiz(quiz)}
                            data-testid={`button-study-${quiz.id}`}
                          >
                            <BookOpen className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Study</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleTakeQuiz(quiz)}
                            data-testid={`button-take-${quiz.id}`}
                          >
                            <Play className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Take Quiz</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {quizzes && quizzes.length > 0 && (
          <motion.p 
            variants={itemVariants}
            className="text-center text-sm text-muted-foreground pt-4"
          >
            <Sparkles className="h-4 w-4 inline mr-1" />
            {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} shared by the community
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
