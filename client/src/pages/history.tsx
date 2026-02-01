import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { History, Play, BookOpen, Share2, Trash2, Clock, FileText, Loader2, Edit2, Archive, CirclePlus, Globe, GlobeLock, Target, Calculator, Languages, FlaskConical, Landmark, LayoutGrid, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Quiz } from "@shared/schema";

type QuizWithAttempts = Quiz & { attemptCount?: number };

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial, savedProgresses, loadSavedProgress } = useQuiz();
  const { toast } = useToast();
  const [quizToDelete, setQuizToDelete] = useState<QuizWithAttempts | null>(null);

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
      setQuizToDelete(null);
      toast({ title: "Quiz deleted", description: "The quiz has been removed from your history.", variant: "success" as any });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete quiz", variant: "destructive" });
    },
  });

  const handleDeleteClick = (quiz: QuizWithAttempts) => {
    setQuizToDelete(quiz);
  };

  const confirmDelete = () => {
    if (quizToDelete) {
      deleteMutation.mutate(quizToDelete.id);
    }
  };

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

  const handleStudy = (quiz: Quiz) => {
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

  const handleEdit = (quiz: Quiz) => {
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

  const getDifficultyBadge = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-900  font-medium">easy</Badge>;
      case "hard": return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-900  font-medium">hard</Badge>;
      default: return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900  font-medium">medium</Badge>;
    }
  };

  const getCategoryIcon = (category?: string | null, size: string = "h-20 w-20") => {
    switch (category) {
      case "Math": return <Calculator className={size} />;
      case "English": return <Languages className={size} />;
      case "Science": return <FlaskConical className={size} />;
      case "Social Studies": return <Landmark className={size} />;
      case "Global Languages": return <Languages className={size} />;
      case "Others/General": return <LayoutGrid className={size} />;
      default: return <HelpCircle className={size} />;
    }
  };

  const getDifficultyBg = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return {
        section: "bg-green-500/5 dark:bg-green-500/10",
        icon: "text-green-500/20 dark:text-green-500/30"
      };
      case "hard": return {
        section: "bg-red-500/5 dark:bg-red-500/10",
        icon: "text-red-500/20 dark:text-red-500/30"
      };
      default: return {
        section: "bg-yellow-500/5 dark:bg-yellow-500/10",
        icon: "text-yellow-500/20 dark:text-yellow-500/30"
      };
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
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-white-700 flex items-center justify-center shrink-0">
              <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Quiz Archive</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Your materials, as quizzes</p>
            </div>
          </div>
          <Button
            className="text-sm group shrink-0" 
            size="sm"
            data-testid="button-new-quiz"
            onClick={() => setLocation("/create")}
          >
            <CirclePlus className="h-4 w-4 mr-1 transition-transform duration-300 ease-in-out group-hover:rotate-90" />
            <span className="hidden xs:inline">Create</span>
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
                <Card className="group overflow-hidden border-border/40 transition-all hover:border-primary/20 hover:shadow-md dark:bg-card/50" data-testid={`card-quiz-${quiz.id}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Left Info Section */}
                      <div className={`flex-1 p-5 sm:p-6 space-y-4 relative overflow-hidden ${getDifficultyBg(quiz.difficulty).section}`}>
                        {/* Faded Category Icon Background */}
                        <div className={`absolute -right-4 top-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12 pointer-events-none ${getDifficultyBg(quiz.difficulty).icon}`}>
                          {getCategoryIcon(quiz.category, "h-24 w-24")}
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors leading-tight">{quiz.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatDate(quiz.createdAt)}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5" />
                                  {(quiz.questions as any[]).length} questions
                                </span>
                              </div>
                            </div>
                            {getDifficultyBadge(quiz.difficulty)}
                          </div>

                          <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-semibold text-primary">
                              <Target className="h-3.5 w-3.5" />
                              {quiz.attemptCount || 0} {quiz.attemptCount === 1 ? "attempt" : "attempts"}
                            </div>
                            {quiz.isPublic === 1 && (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                                <Globe className="h-3.5 w-3.5" />
                                Publicly Shared
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Section */}
                      <div className="flex flex-col sm:flex-col justify-center gap-2 p-3 sm:p-5 bg-muted/30 sm:border-l border-t sm:border-t-0 border-border/40">
                        <div className="flex flex-row sm:flex-row items-center gap-2 w-full">
                          <Button
                            onClick={() => handleRetake(quiz)}
                            className="flex-1 sm:w-28 font-semibold shadow-sm"
                            size="sm"
                            data-testid={`button-retake-${quiz.id}`}
                          >
                            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                            Take
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleStudy(quiz)}
                            className="flex-1 sm:w-28 font-semibold bg-background"
                            size="sm"
                            data-testid={`button-study-${quiz.id}`}
                          >
                            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                            Review
                          </Button>
                        </div>

                        <div className="flex items-center justify-between sm:justify-center gap-1 px-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(quiz)}
                            data-testid={`button-edit-${quiz.id}`}
                            title="Edit quiz"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => togglePublicMutation.mutate({ 
                              quizId: quiz.id, 
                              isPublic: quiz.isPublic !== 1 
                            })}
                            disabled={togglePublicMutation.isPending}
                            data-testid={`button-toggle-public-${quiz.id}`}
                            title={quiz.isPublic === 1 ? "Make private" : "Share to community"}
                          >
                            {quiz.isPublic === 1 ? (
                              <Globe className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <GlobeLock className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleShare(quiz.id)}
                            data-testid={`button-share-${quiz.id}`}
                            title="Copy share link"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteClick(quiz)}
                            data-testid={`button-delete-${quiz.id}`}
                            title="Delete quiz"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </motion.div>

      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{quizToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
