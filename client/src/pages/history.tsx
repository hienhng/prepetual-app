import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Play, BookOpen, Share2, Trash2, Clock, FileText, Loader2, Edit2, CirclePlus, Globe, GlobeLock, Target, Calculator, Languages, FlaskConical, Landmark, LayoutGrid, HelpCircle, FolderPlus, Folder, FolderOpen, MoreVertical, Pencil, FolderInput, X, ChevronRight, Sparkles, Hash } from "lucide-react";
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
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-page-title">Archive</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {quizzes && quizzes.length > 0
                ? `${quizzes.length} ${quizzes.length === 1 ? "quiz" : "quizzes"} saved`
                : "Your saved quizzes will appear here"}
            </p>
          </div>
          <Button
            size="sm"
            data-testid="button-new-quiz"
            onClick={() => setLocation("/create")}
          >
            <CirclePlus className="h-4 w-4 mr-1.5" />
            New Quiz
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-archive">
            <TabsTrigger value="quizzes" className="gap-1.5" data-testid="tab-quizzes">
              <FileText className="h-3.5 w-3.5" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="folders" className="gap-1.5" data-testid="tab-folders">
              <Folder className="h-3.5 w-3.5" />
              Folders
              {folders.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 py-0">{folders.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes" className="mt-5 space-y-4">
            {quizzes && quizzes.length > 0 && folders.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={selectedFolderId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolderId(null)}
                  data-testid="button-folder-all"
                >
                  All
                </Button>
                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    variant={selectedFolderId === folder.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFolderId(folder.id)}
                    data-testid={`button-folder-${folder.id}`}
                  >
                    {folder.name}
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{getFolderQuizCount(folder.id)}</Badge>
                  </Button>
                ))}
                {quizzes.some(q => !q.folderId) && (
                  <Button
                    variant={selectedFolderId === "__unfiled__" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFolderId("__unfiled__")}
                    data-testid="button-folder-unfiled"
                  >
                    Unfiled
                  </Button>
                )}
              </div>
            )}

            {!quizzes || quizzes.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No quizzes yet</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Create your first quiz to get started
                </p>
                <Button
                  data-testid="button-create-first-quiz"
                  onClick={() => setLocation("/create")}
                >
                  Create Quiz
                </Button>
              </div>
            ) : filteredQuizzes && filteredQuizzes.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">This folder is empty</h3>
                <p className="text-sm text-muted-foreground">
                  Move quizzes here from the quiz menu
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredQuizzes?.map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="overflow-visible" data-testid={`card-quiz-${quiz.id}`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-primary">
                              {getCategoryIcon(quiz.category)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm leading-snug line-clamp-2" data-testid={`text-quiz-title-${quiz.id}`}>
                                {quiz.title}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
                                <span>{formatDate(quiz.createdAt)}</span>
                                <span className="text-border">|</span>
                                <span>{(quiz.questions as any[]).length}q</span>
                                <span className="text-border">|</span>
                                <span className={`capitalize font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                                  {quiz.difficulty || "medium"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-testid={`button-more-${quiz.id}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(quiz)} data-testid={`button-edit-${quiz.id}`}>
                                <Edit2 className="h-3.5 w-3.5 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => togglePublicMutation.mutate({
                                  quizId: quiz.id,
                                  isPublic: quiz.isPublic !== 1
                                })}
                                data-testid={`button-toggle-public-${quiz.id}`}
                              >
                                {quiz.isPublic === 1 ? (
                                  <><GlobeLock className="h-3.5 w-3.5 mr-2" />Make Private</>
                                ) : (
                                  <><Globe className="h-3.5 w-3.5 mr-2" />Share Publicly</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(quiz.id)} data-testid={`button-share-${quiz.id}`}>
                                <Share2 className="h-3.5 w-3.5 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              {folders.length > 0 && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger data-testid={`button-move-to-folder-${quiz.id}`}>
                                    <FolderInput className="h-3.5 w-3.5 mr-2" />
                                    Move to Folder
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setQuizToDelete(quiz)}
                                data-testid={`button-delete-${quiz.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                          {quiz.folderId && folders.find(f => f.id === quiz.folderId) && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Folder className="h-3 w-3" />
                              {folders.find(f => f.id === quiz.folderId)?.name}
                            </span>
                          )}
                          {quiz.isPublic === 1 && (
                            <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                              <Globe className="h-3 w-3" />
                              Public
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Target className="h-3 w-3" />
                            {quiz.attemptCount || 0} {quiz.attemptCount === 1 ? "attempt" : "attempts"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleRetake(quiz)}
                            size="sm"
                            className="flex-1"
                            data-testid={`button-retake-${quiz.id}`}
                          >
                            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                            Take
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleStudy(quiz)}
                            size="sm"
                            className="flex-1"
                            data-testid={`button-study-${quiz.id}`}
                          >
                            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                            Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="folders" className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                Organize your quizzes by topic or subject
              </p>
              <Button
                size="sm"
                onClick={openCreateFolder}
                data-testid="button-create-folder"
              >
                <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
                New Folder
              </Button>
            </div>

            {folders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Folder className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No folders yet</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Create folders to keep your quizzes organized
                </p>
                <Button
                  onClick={openCreateFolder}
                  data-testid="button-create-first-folder"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {folders.map((folder, index) => {
                  const count = getFolderQuizCount(folder.id);
                  return (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Card
                        className="cursor-pointer overflow-visible hover-elevate"
                        onClick={() => handleOpenFolder(folder.id)}
                        data-testid={`card-folder-${folder.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <FolderOpen className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    data-testid={`button-folder-menu-${folder.id}`}
                                  >
                                    <MoreVertical className="h-4 w-4" />
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
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm truncate" data-testid={`text-folder-name-${folder.id}`}>
                            {folder.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {count} {count === 1 ? "quiz" : "quizzes"}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {quizzes && quizzes.some(q => !q.folderId) && folders.length > 0 && (
              <Card
                className="cursor-pointer overflow-visible hover-elevate"
                onClick={() => { setSelectedFolderId("__unfiled__"); setActiveTab("quizzes"); }}
                data-testid="card-unfiled-quizzes"
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-muted-foreground">Unfiled Quizzes</h3>
                      <p className="text-xs text-muted-foreground">
                        {getFolderQuizCount("__unfiled__")} {getFolderQuizCount("__unfiled__") === 1 ? "quiz" : "quizzes"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
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
