import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Play, BookOpen, Share2, Trash2, Clock, FileText, Loader2, Edit2, Archive, CirclePlus, Globe, GlobeLock, Target, Calculator, Languages, FlaskConical, Landmark, LayoutGrid, HelpCircle, FolderPlus, Folder, FolderOpen, MoreVertical, Pencil, FolderInput, X, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuiz } from "@/lib/quiz-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Quiz, Folder as FolderType } from "@shared/schema";

type QuizWithAttempts = Quiz & { attemptCount?: number };

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial, savedProgresses, loadSavedProgress } = useQuiz();
  const { toast } = useToast();
  const [quizToDelete, setQuizToDelete] = useState<QuizWithAttempts | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
  const [activeTab, setActiveTab] = useState("quizzes");
  const folderInputRef = useRef<HTMLInputElement>(null);

  const { data: quizzes, isLoading } = useQuery<QuizWithAttempts[]>({
    queryKey: ["/api/quizzes"],
    refetchOnMount: "always",
  });

  const { data: folders = [] } = useQuery<FolderType[]>({
    queryKey: ["/api/folders"],
  });

  useEffect(() => {
    if (folderDialogOpen && folderInputRef.current) {
      setTimeout(() => folderInputRef.current?.focus(), 100);
    }
  }, [folderDialogOpen]);

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

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/folders", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setFolderDialogOpen(false);
      setFolderName("");
      toast({ title: "Folder created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return apiRequest("PATCH", `/api/folders/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setFolderDialogOpen(false);
      setFolderName("");
      setEditingFolder(null);
      toast({ title: "Folder renamed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to rename folder", variant: "destructive" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      if (folderToDelete && selectedFolderId === folderToDelete.id) {
        setSelectedFolderId(null);
      }
      setFolderToDelete(null);
      toast({ title: "Folder deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete folder", variant: "destructive" });
    },
  });

  const moveToFolderMutation = useMutation({
    mutationFn: async ({ quizId, folderId }: { quizId: string; folderId: string | null }) => {
      return apiRequest("PUT", `/api/quiz/${quizId}`, { folderId });
    },
    onSuccess: (_, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      const folderObj = folders.find(f => f.id === folderId);
      toast({ 
        title: folderId ? `Moved to ${folderObj?.name || "folder"}` : "Removed from folder"
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to move quiz", variant: "destructive" });
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

  const handleRetake = (quiz: Quiz) => {
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
      case "easy": return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-900 font-medium">easy</Badge>;
      case "hard": return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-900 font-medium">hard</Badge>;
      default: return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900 font-medium">medium</Badge>;
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

  const openCreateFolder = () => {
    setEditingFolder(null);
    setFolderName("");
    setFolderDialogOpen(true);
  };

  const openEditFolder = (folder: FolderType) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDialogOpen(true);
  };

  const handleFolderSubmit = () => {
    if (!folderName.trim()) return;
    if (editingFolder) {
      updateFolderMutation.mutate({ id: editingFolder.id, name: folderName.trim() });
    } else {
      createFolderMutation.mutate(folderName.trim());
    }
  };

  const handleOpenFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    setActiveTab("quizzes");
  };

  const filteredQuizzes = quizzes?.filter(quiz => {
    if (selectedFolderId === null) return true;
    if (selectedFolderId === "__unfiled__") return !quiz.folderId;
    return quiz.folderId === selectedFolderId;
  });

  const getFolderQuizCount = (folderId: string | null) => {
    if (!quizzes) return 0;
    if (folderId === null) return quizzes.length;
    if (folderId === "__unfiled__") return quizzes.filter(q => !q.folderId).length;
    return quizzes.filter(q => q.folderId === folderId).length;
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
        className="space-y-5"
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center shrink-0">
              <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate" data-testid="text-page-title">Quiz Archive</h1>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full" data-testid="tabs-archive">
            <TabsTrigger value="quizzes" className="flex-1 gap-1.5" data-testid="tab-quizzes">
              <FileText className="h-3.5 w-3.5" />
              Quizzes
              {quizzes && quizzes.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{quizzes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex-1 gap-1.5" data-testid="tab-folders">
              <Folder className="h-3.5 w-3.5" />
              Folders
              {folders.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{folders.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes" className="mt-4 space-y-4">
            {quizzes && quizzes.length > 0 && folders.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
                <Button
                  variant={selectedFolderId === null ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSelectedFolderId(null)}
                  data-testid="button-folder-all"
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                  All
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{getFolderQuizCount(null)}</Badge>
                </Button>

                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    variant={selectedFolderId === folder.id ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => setSelectedFolderId(folder.id)}
                    data-testid={`button-folder-${folder.id}`}
                  >
                    {selectedFolderId === folder.id ? (
                      <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <Folder className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {folder.name}
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{getFolderQuizCount(folder.id)}</Badge>
                  </Button>
                ))}

                {quizzes.some(q => !q.folderId) && (
                  <Button
                    variant={selectedFolderId === "__unfiled__" ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => setSelectedFolderId("__unfiled__")}
                    data-testid="button-folder-unfiled"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Unfiled
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{getFolderQuizCount("__unfiled__")}</Badge>
                  </Button>
                )}
              </div>
            )}

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
            ) : filteredQuizzes && filteredQuizzes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No quizzes in this folder</h3>
                  <p className="text-muted-foreground mb-4">
                    Move quizzes here using the menu on each quiz card
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredQuizzes?.map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group overflow-hidden dark:bg-card/50" data-testid={`card-quiz-${quiz.id}`}>
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          <div className={`flex-1 p-5 sm:p-6 space-y-4 relative overflow-hidden ${getDifficultyBg(quiz.difficulty).section}`}>
                            <div className={`absolute -right-4 top-1/2 -translate-y-1/2 pointer-events-none ${getDifficultyBg(quiz.difficulty).icon}`}>
                              {getCategoryIcon(quiz.category, "h-24 w-24")}
                            </div>
                            <div className="relative z-10">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <h3 className="text-lg font-bold tracking-tight leading-tight" data-testid={`text-quiz-title-${quiz.id}`}>{quiz.title}</h3>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium flex-wrap">
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5" />
                                      {formatDate(quiz.createdAt)}
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1.5">
                                      <FileText className="h-3.5 w-3.5" />
                                      {(quiz.questions as any[]).length} questions
                                    </span>
                                    {quiz.folderId && folders.find(f => f.id === quiz.folderId) && (
                                      <>
                                        <span>·</span>
                                        <span className="flex items-center gap-1 text-primary/70">
                                          <Folder className="h-3 w-3" />
                                          {folders.find(f => f.id === quiz.folderId)?.name}
                                        </span>
                                      </>
                                    )}
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
                                onClick={() => handleEdit(quiz)}
                                data-testid={`button-edit-${quiz.id}`}
                                title="Edit quiz"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
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
                                  <Globe className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <GlobeLock className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleShare(quiz.id)}
                                data-testid={`button-share-${quiz.id}`}
                                title="Copy share link"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    data-testid={`button-more-${quiz.id}`}
                                    title="More actions"
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {folders.length > 0 && (
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger data-testid={`button-move-to-folder-${quiz.id}`}>
                                        <FolderInput className="h-3.5 w-3.5 mr-2" />
                                        Move to folder
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        {quiz.folderId && (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => moveToFolderMutation.mutate({ quizId: quiz.id, folderId: null })}
                                              data-testid={`button-remove-from-folder-${quiz.id}`}
                                            >
                                              <X className="h-3.5 w-3.5 mr-2" />
                                              Remove from folder
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                          </>
                                        )}
                                        {folders.map(folder => (
                                          <DropdownMenuItem
                                            key={folder.id}
                                            onClick={() => moveToFolderMutation.mutate({ quizId: quiz.id, folderId: folder.id })}
                                            disabled={quiz.folderId === folder.id}
                                            data-testid={`button-move-quiz-${quiz.id}-to-${folder.id}`}
                                          >
                                            <Folder className="h-3.5 w-3.5 mr-2" />
                                            {folder.name}
                                            {quiz.folderId === folder.id && (
                                              <span className="ml-auto text-xs text-muted-foreground">(current)</span>
                                            )}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  )}
                                  {folders.length > 0 && <DropdownMenuSeparator />}
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteClick(quiz)}
                                    data-testid={`button-delete-${quiz.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete quiz
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="folders" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                Organize your quizzes into folders for easy access
              </p>
              <Button
                size="sm"
                className="shrink-0 group"
                onClick={openCreateFolder}
                data-testid="button-create-folder"
              >
                <FolderPlus className="h-3.5 w-3.5 mr-1.5 transition-transform duration-300 ease-in-out group-hover:scale-110" />
                New Folder
              </Button>
            </div>

            {folders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No folders yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create folders to organize your quizzes by topic or subject
                  </p>
                  <Button
                    onClick={openCreateFolder}
                    data-testid="button-create-first-folder"
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Your First Folder
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {folders.map((folder, index) => {
                  const count = getFolderQuizCount(folder.id);
                  return (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover-elevate"
                        onClick={() => handleOpenFolder(folder.id)}
                        data-testid={`card-folder-${folder.id}`}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <FolderOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate" data-testid={`text-folder-name-${folder.id}`}>
                              {folder.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {count} {count === 1 ? "quiz" : "quizzes"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`button-folder-menu-${folder.id}`}
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditFolder(folder)} data-testid={`button-rename-folder-${folder.id}`}>
                                  <Pencil className="h-3.5 w-3.5 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setFolderToDelete(folder)}
                                  data-testid={`button-delete-folder-${folder.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {quizzes && quizzes.some(q => !q.folderId) && folders.length > 0 && (
              <div
                className="flex items-center gap-3 p-4 rounded-md border border-dashed border-border/60 cursor-pointer hover-elevate"
                onClick={() => { setSelectedFolderId("__unfiled__"); setActiveTab("quizzes"); }}
                data-testid="card-unfiled-quizzes"
              >
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-muted-foreground">Unfiled Quizzes</h3>
                  <p className="text-xs text-muted-foreground">
                    {getFolderQuizCount("__unfiled__")} {getFolderQuizCount("__unfiled__") === 1 ? "quiz" : "quizzes"} not in any folder
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Rename Folder" : "Create Folder"}</DialogTitle>
            <DialogDescription>
              {editingFolder ? "Enter a new name for this folder." : "Give your folder a name to organize your quizzes."}
            </DialogDescription>
          </DialogHeader>
          <Input
            ref={folderInputRef}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            data-testid="input-folder-name"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFolderSubmit();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)} data-testid="button-cancel-folder">
              Cancel
            </Button>
            <Button 
              onClick={handleFolderSubmit} 
              disabled={!folderName.trim() || createFolderMutation.isPending || updateFolderMutation.isPending}
              data-testid="button-save-folder"
            >
              {(createFolderMutation.isPending || updateFolderMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingFolder ? "Rename" : "Create"}
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
              onClick={confirmDelete}
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

      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{folderToDelete?.name}"? Quizzes inside won't be deleted, they'll just become unfiled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-folder">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => folderToDelete && deleteFolderMutation.mutate(folderToDelete.id)}
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
