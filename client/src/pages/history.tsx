import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { History, Play, BookOpen, Share2, Trash2, Clock, FileText, Loader2, Edit2, Archive, CirclePlus, Globe, GlobeLock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuiz } from "@/lib/quiz-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Quiz } from "@shared/schema";

type QuizWithAttempts = Quiz & { attemptCount?: number };

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial } = useQuiz();
  const { toast } = useToast();

  const { data: quizzes, isLoading } = useQuery<QuizWithAttempts[]>({
    queryKey: ["/api/quizzes"],
    refetchOnMount: "always",
  });

  const deleteMutation = useMutation({
    mutationFn: async (quizId: string) => {
      return apiRequest("DELETE", `/api/quiz/${quizId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({ title: "Quiz deleted", description: "The quiz has been removed from your history." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete quiz", variant: "destructive" });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ quizId, isPublic }: { quizId: string; isPublic: boolean }) => {
      return apiRequest("PUT", `/api/quiz/${quizId}`, { isPublic });
    },
    onSuccess: (_, { isPublic }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public-quizzes"] });
      toast({ 
        title: isPublic ? "Quiz shared" : "Quiz hidden", 
        description: isPublic 
          ? "Your quiz is now visible in the community feed." 
          : "Your quiz is now private."
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update quiz visibility", variant: "destructive" });
    },
  });

  const handleRetake = (quiz: Quiz) => {
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

  const handleStudy = (quiz: Quiz) => {
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

  const handleEdit = (quiz: Quiz) => {
    setCurrentQuiz({
      ...quiz,
      createdAt: typeof quiz.createdAt === "string" ? quiz.createdAt : quiz.createdAt.toISOString(),
    } as any);
    setSourceMaterial({
      type: quiz.sourceImageUrl ? "image" : null,
      text: quiz.sourceText,
      imageDataUrl: quiz.sourceImageUrl || null,
    });
    setLocation("/edit-quiz");
  };

  const handleShare = (quizId: string) => {
    const url = `${window.location.origin}/share/${quizId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this link with others to let them take the quiz." });
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

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-white-700 flex items-center justify-center">
              <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Quiz Archive</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Your materials, as quizzes</p>
            </div>
          </div>
          <Button
            className="text-sm group" 
            data-testid="button-new-quiz"
            onClick={() => setLocation("/create")}
          >
            <CirclePlus className="h-4 w-4 mr-1 transition-transform duration-300 ease-in-out group-hover:rotate-90" />
            Create
          </Button>
        </div>

        {!quizzes || quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first quiz to see it here
              </p>
              <Button 
                data-testid="button-create-first-quiz"
                onClick={() => setLocation("/create")}
              >
                Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover-elevate" data-testid={`card-quiz-${quiz.id}`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-xl font-semibold truncate">{quiz.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {formatDate(quiz.createdAt)}
                          </div>
                          <Badge variant="secondary" className="text-xs sm:text-sm">
                            {(quiz.questions as any[]).length} questions
                          </Badge>
                          {quiz.difficulty && (
                            <Badge className={`text-xs sm:text-sm ${getDifficultyColor(quiz.difficulty)}`}>
                              {quiz.difficulty}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs sm:text-sm gap-1">
                            <Target className="h-3 w-3" />
                            {quiz.attemptCount || 0} {quiz.attemptCount === 1 ? "attempt" : "attempts"}
                          </Badge>
                          {/* {quiz.isPublic === 1 && (
                            <Badge variant="outline" className="text-xs sm:text-sm gap-1 text-primary border-primary/30">
                              <Globe className="h-3 w-3" />
                              Shared
                            </Badge>
                          )} */}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          onClick={() => handleRetake(quiz)}
                          className="flex-1 sm:flex-none"
                          data-testid={`button-retake-${quiz.id}`}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Take
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleStudy(quiz)}
                          className="flex-1 sm:flex-none"
                          data-testid={`button-study-${quiz.id}`}
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(quiz)}
                          data-testid={`button-edit-${quiz.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => togglePublicMutation.mutate({ 
                            quizId: quiz.id, 
                            isPublic: quiz.isPublic !== 1 
                          })}
                          disabled={togglePublicMutation.isPending}
                          data-testid={`button-toggle-public-${quiz.id}`}
                          title={quiz.isPublic === 1 ? "Make private" : "Share to community"}
                        >
                          {quiz.isPublic === 1 ? (
                            <Globe className="h-4 w-4 text-primary" />
                          ) : (
                            <GlobeLock className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleShare(quiz.id)}
                          data-testid={`button-share-${quiz.id}`}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(quiz.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${quiz.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
