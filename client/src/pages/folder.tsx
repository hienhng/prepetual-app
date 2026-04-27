import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { Play, BookOpen, Share2, Trash2, Loader2, Edit2, Globe, GlobeLock, Calculator, Languages, FlaskConical, Landmark, LayoutGrid, Sparkles, MoreVertical, Pencil, X, ArrowLeft, Plus, FolderOpen, Check, Pin, PinOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuiz } from "@/lib/quiz-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Quiz, Folder as FolderType } from "@shared/schema";

type QuizWithAttempts = Quiz & { attemptCount?: number };

export default function FolderPage() {
  const params = useParams<{ id: string }>();
  const folderId = params.id;
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial, savedProgresses, loadSavedProgress } = useQuiz();
  const { toast } = useToast();
  const [quizToDelete, setQuizToDelete] = useState<QuizWithAttempts | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState(false);
  const [addQuizzesOpen, setAddQuizzesOpen] = useState(false);
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(new Set());
  const renameInputRef = useRef<HTMLInputElement>(null);

  const { data: folder, isLoading: folderLoading } = useQuery<FolderType>({
    queryKey: ["/api/folders", folderId],
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: allQuizzes = [], isLoading: quizzesLoading } = useQuery<QuizWithAttempts[]>({
    queryKey: ["/api/quizzes"],
    staleTime: 30 * 1000,
  });

  const folderQuizzes = allQuizzes.filter(q => q.folderId === folderId);
  const isLoading = folderLoading || quizzesLoading;

  useEffect(() => {
    if (renameDialogOpen && renameInputRef.current) {
      setTimeout(() => renameInputRef.current?.focus(), 100);
    }
  }, [renameDialogOpen]);

  const deleteMutation = useMutation({
    mutationFn: async (quizId: string) => {
      return apiRequest("DELETE", `/api/quiz/${quizId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setQuizToDelete(null);
      toast({ title: "Quiz deleted", description: "The quiz has been removed.", variant: "success" as any });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete quiz", variant: "destructive" });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ quizId, isPublic }: { quizId: string; isPublic: boolean }) => {
      return apiRequest("PUT", `/api/quiz/${quizId}`, { isPublic });
    },
    onSuccess: async (_, { isPublic }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/public-quizzes"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/folders"] })
      ]);
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

  const removeFromFolderMutation = useMutation({
    mutationFn: async (quizId: string) => {
      return apiRequest("PUT", `/api/quiz/${quizId}`, { folderId: null });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/folders"] })
      ]);
      toast({ title: "Quiz removed from folder" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove quiz", variant: "destructive" });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("PATCH", `/api/folders/${folderId}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders", folderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setRenameDialogOpen(false);
      setFolderName("");
      toast({ title: "Folder renamed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to rename folder", variant: "destructive" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/folders/${folderId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/folders"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] })
      ]);
      toast({ title: "Folder deleted" });
      setLocation("/history");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete folder", variant: "destructive" });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/folders/${folderId}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders", folderId] });
      toast({ title: folder?.pinnedToSidebar ? "Unpinned from sidebar" : "Pinned to sidebar" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to toggle pin", variant: "destructive" });
    },
  });

  const addQuizzesToFolderMutation = useMutation({
    mutationFn: async ({ add, remove }: { add: string[]; remove: string[] }) => {
      if (add.length === 0 && remove.length === 0) return;
      // Single request — 2 DB queries server-side regardless of count
      await apiRequest("PUT", "/api/quizzes/batch-folder", { folderId, add, remove });
    },
    onSuccess: (_, { add, remove }) => {
      setAddQuizzesOpen(false);
      setSelectedQuizIds(new Set());

      // Optimistic update: immediately reflect folderId changes in cache (no network wait)
      queryClient.setQueryData(["/api/quizzes"], (old: QuizWithAttempts[] | undefined) => {
        if (!old) return old;
        return old.map(quiz => {
          if (add.includes(quiz.id)) return { ...quiz, folderId };
          if (remove.includes(quiz.id)) return { ...quiz, folderId: null };
          return quiz;
        });
      });

      // Background refresh — don't await so toast fires immediately
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });

      toast({ title: "Quizzes updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update quizzes", variant: "destructive" });
    },
  });

  const handleRetake = async (quiz: any) => {
    const hasSavedProgress = savedProgresses.some(p => p.quizId === quiz.id);
    if (hasSavedProgress) {
      loadSavedProgress(quiz.id);
      setLocation("/quiz");
      return;
    }

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

  const handleStudy = async (quiz: any) => {
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

  const handleEdit = async (quiz: any) => {
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
      setLocation("/edit-quiz");
    } catch (err) {
      console.error("Failed to load quiz details:", err);
    }
  };

  const handleShare = (quizId: string) => {
    const url = `${window.location.origin}/share/${quizId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this link with others to let them take the quiz." });
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDifficultyColor = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return "text-green-600 dark:text-green-400";
      case "hard": return "text-red-500 dark:text-red-400";
      default: return "text-yellow-600 dark:text-yellow-400";
    }
  };

  const getCategoryIcon = (category?: string | null) => {
    const cls = "h-4 w-4";
    switch (category) {
      case "Math": return <Calculator className={cls} />;
      case "English": return <Languages className={cls} />;
      case "Science": return <FlaskConical className={cls} />;
      case "Social Studies": return <Landmark className={cls} />;
      case "Global Languages": return <Languages className={cls} />;
      case "Others/General": return <LayoutGrid className={cls} />;
      default: return <Sparkles className={cls} />;
    }
  };

  const openRenameDialog = () => {
    setFolderName(folder?.name || "");
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = () => {
    if (!folderName.trim()) return;
    renameFolderMutation.mutate(folderName.trim());
  };

  const openAddQuizzes = () => {
    const currentQuizIds = folderQuizzes.map(q => q.id);
    setSelectedQuizIds(new Set(currentQuizIds));
    setAddQuizzesOpen(true);
  };

  const toggleQuizSelection = (quizId: string) => {
    setSelectedQuizIds(prev => {
      const next = new Set(prev);
      if (next.has(quizId)) {
        next.delete(quizId);
      } else {
        next.add(quizId);
      }
      return next;
    });
  };

  const getTotalQuestions = () => {
    return folderQuizzes.reduce((sum, q) => sum + ((q.questions as any[])?.length || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Folder not found</h2>
        <p className="text-sm text-muted-foreground mb-5">This folder may have been deleted.</p>
        <Button onClick={() => setLocation("/history")} data-testid="button-back-to-archive">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Archive
        </Button>
      </div>
    );
  }

  const totalQuestions = getTotalQuestions();

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/history")}
            className="-ml-2 text-muted-foreground"
            data-testid="button-back-to-archive"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Archive
          </Button>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate" data-testid="text-folder-title">
                {folder.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span>{folderQuizzes.length} {folderQuizzes.length === 1 ? "quiz" : "quizzes"}</span>
                <span className="text-border">|</span>
                <span>{totalQuestions} questions</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={openAddQuizzes}
                data-testid="button-add-quizzes"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Quizzes
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" data-testid="button-folder-actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => togglePinMutation.mutate()} data-testid="button-toggle-pin-folder">
                    {folder.pinnedToSidebar ? (
                      <><PinOff className="h-3.5 w-3.5 mr-2" />Unpin from Sidebar</>
                    ) : (
                      <><Pin className="h-3.5 w-3.5 mr-2" />Pin to Sidebar</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openRenameDialog} data-testid="button-rename-folder">
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteFolderConfirm(true)}
                    data-testid="button-delete-folder"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {folderQuizzes.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No quizzes yet</h3>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
              Add existing quizzes or create new ones to organize here
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={openAddQuizzes}
                data-testid="button-add-first-quizzes"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Quizzes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/create")}
                data-testid="button-create-new-quiz"
              >
                Create New
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {folderQuizzes.map((quiz, index) => {
              const cat = quiz.category || "Others/General";
              const colorClass =
                cat === "Math" ? "text-blue-600 bg-blue-500/10 border-blue-200/50" :
                  cat === "Science" ? "text-emerald-600 bg-emerald-500/10 border-emerald-200/50" :
                    cat === "English" || cat === "Global Languages" ? "text-violet-600 bg-violet-500/10 border-violet-200/50" :
                      cat === "Social Studies" ? "text-indigo-600 bg-indigo-500/10 border-indigo-200/50" :
                        "text-slate-600 bg-slate-500/10 border-slate-200/50";

              return (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.025 }}
                >
                  <Card
                    className="group overflow-hidden border-border/40 hover:border-primary/30 hover:bg-muted/10 transition-all duration-200 shadow-none rounded-xl"
                    data-testid={`card-quiz-${quiz.id}`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${colorClass} transition-transform duration-300 group-hover:scale-105`}>
                          {getCategoryIcon(cat)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm sm:text-base leading-tight truncate text-foreground group-hover:text-primary transition-colors" data-testid={`text-quiz-title-${quiz.id}`}>
                            {quiz.title}
                          </h3>

                          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium text-muted-foreground/70">
                            <div className="flex items-center gap-1">
                              {formatDate(quiz.createdAt)}
                            </div>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <div className="flex items-center gap-1">
                              {(quiz as any).questionCount || (quiz.questions as any[])?.length || 0} questions
                            </div>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <div className={`capitalize ${getDifficultyColor(quiz.difficulty)}`}>
                              {quiz.difficulty || "medium"}
                            </div>
                            {quiz.isPublic === 1 && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                <div className="text-green-600 dark:text-green-400 font-bold">Public</div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-bold hover:bg-primary/10 hover:text-primary rounded-lg"
                            onClick={() => handleStudy(quiz)}
                            data-testid={`button-study-${quiz.id}`}
                          >
                            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 px-4 text-xs font-bold rounded-lg shadow-none"
                            onClick={() => handleRetake(quiz)}
                            data-testid={`button-retake-${quiz.id}`}
                          >
                            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                            Take
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="sm:hidden">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-primary"
                              onClick={() => handleRetake(quiz)}
                            >
                              <Play className="h-4 w-4 fill-current" />
                            </Button>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                data-testid={`button-more-${quiz.id}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 shadow-xl border-border/50">
                              <DropdownMenuItem onClick={() => handleEdit(quiz)} data-testid={`button-edit-${quiz.id}`}>
                                <Edit2 className="h-3.5 w-3.5 mr-2" />
                                Edit Quiz
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => togglePublicMutation.mutate({
                                  quizId: quiz.id,
                                  isPublic: quiz.isPublic !== 1
                                })}
                                data-testid={`button-toggle-public-${quiz.id}`}
                              >
                                {quiz.isPublic === 1 ? (
                                  <><GlobeLock className="h-3.5 w-3.5 mr-2" />Draft Mode</>
                                ) : (
                                  <><Globe className="h-3.5 w-3.5 mr-2" />Publish to Library</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(quiz.id)} data-testid={`button-share-${quiz.id}`}>
                                <Share2 className="h-3.5 w-3.5 mr-2" />
                                Copy Share Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => removeFromFolderMutation.mutate(quiz.id)}
                                data-testid={`button-remove-from-folder-${quiz.id}`}
                              >
                                <X className="h-3.5 w-3.5 mr-2" />
                                Remove from Folder
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => setQuizToDelete(quiz)}
                                data-testid={`button-delete-${quiz.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Permanently Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for this folder.
            </DialogDescription>
          </DialogHeader>
          <Input
            ref={renameInputRef}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            data-testid="input-rename-folder"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} data-testid="button-cancel-rename">
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={!folderName.trim() || renameFolderMutation.isPending}
              data-testid="button-confirm-rename"
            >
              {renameFolderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addQuizzesOpen} onOpenChange={(open) => { if (!open) { setAddQuizzesOpen(false); setSelectedQuizIds(new Set()); } }}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Quizzes to Folder</DialogTitle>
            <DialogDescription>
              Select quizzes to include in "{folder?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1 py-1 -mx-1 px-1">
            {allQuizzes.length > 0 ? (
              allQuizzes.map(quiz => {
                const isSelected = selectedQuizIds.has(quiz.id);
                const cat = quiz.category || "Others/General";
                return (
                  <div
                    key={quiz.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer select-none transition-all border ${isSelected
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/10 border-transparent hover:border-border/50"
                      }`}
                    onClick={() => toggleQuizSelection(quiz.id)}
                    data-testid={`select-quiz-${quiz.id}`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                      }`}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground stroke-[3px]" />}
                    </div>

                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${cat === "Math" ? "text-blue-600 bg-blue-500/10 border-blue-200/50" :
                        cat === "Science" ? "text-emerald-600 bg-emerald-500/10 border-emerald-200/50" :
                          cat === "English" || cat === "Global Languages" ? "text-violet-600 bg-violet-500/10 border-violet-200/50" :
                            cat === "Social Studies" ? "text-indigo-600 bg-indigo-500/10 border-indigo-200/50" :
                              "text-slate-600 bg-slate-500/10 border-slate-200/50"
                        }`}>
                        {getCategoryIcon(cat)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-foreground">{quiz.title}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
                          {(quiz.questions as any[]).length} questions
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No quizzes available</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddQuizzesOpen(false); setSelectedQuizIds(new Set()); }} data-testid="button-cancel-add-quizzes">
              Cancel
            </Button>
            <Button
              onClick={() => {
                const currentInFolder = folderQuizzes.map(q => q.id);
                const selectedArray = Array.from(selectedQuizIds);
                const add = selectedArray.filter(id => !currentInFolder.includes(id));
                const remove = currentInFolder.filter(id => !selectedQuizIds.has(id));
                addQuizzesToFolderMutation.mutate({ add, remove });
              }}
              disabled={addQuizzesToFolderMutation.isPending}
              data-testid="button-save-add-quizzes"
            >
              {addQuizzesToFolderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              onClick={() => quizToDelete && deleteMutation.mutate(quizToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive border-destructive text-destructive-foreground"
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

      <AlertDialog open={deleteFolderConfirm} onOpenChange={setDeleteFolderConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{folder?.name}"? Quizzes inside won't be deleted, they'll just become unfiled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-folder">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFolderMutation.mutate()}
              disabled={deleteFolderMutation.isPending}
              className="bg-destructive border-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-folder"
            >
              {deleteFolderMutation.isPending ? (
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
