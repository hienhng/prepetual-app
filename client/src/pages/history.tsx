import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Play, BookOpen, Share2, Trash2, FileText, Loader2, Edit2, CirclePlus, Globe, GlobeLock, Target, Calculator, Languages, FlaskConical, Landmark, LayoutGrid, FolderPlus, Folder, MoreVertical, Pencil, Sparkles, Search, X, Pin, PinOff } from "lucide-react";
import { QUIZ_CATEGORIES } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
  const [activeTab, setActiveTab] = useState("quizzes");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "folders") {
      setActiveTab("folders");
    }
  }, []);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const { data: quizzes, isLoading } = useQuery<QuizWithAttempts[]>({
    queryKey: ["/api/quizzes"],
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: folders = [] } = useQuery<FolderType[]>({
    queryKey: ["/api/folders"],
    refetchOnMount: "always",
    staleTime: 0,
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/folders"] })
      ]);
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

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/folders", { name });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
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
      setFolderToDelete(null);
      toast({ title: "Folder deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete folder", variant: "destructive" });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/folders/${id}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to toggle pin", variant: "destructive" });
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

  const getFolderQuizCount = (folderId: string) => {
    if (!quizzes) return 0;
    return quizzes.filter(q => q.folderId === folderId).length;
  };

  const filteredQuizzes = (quizzes || []).filter(quiz => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = quiz.title?.toLowerCase().includes(q);
      if (!titleMatch) return false;
    }
    if (selectedCategory) {
      const cat = quiz.category || "Others/General";
      if (cat !== selectedCategory) return false;
    }
    return true;
  });

  const availableCategories = Array.from(new Set((quizzes || []).map(q => q.category || "Others/General"))).sort();

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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-page-title">Your Quizzes</h1>
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
          <TabsList className="bg-transparent p-0 h-auto gap-4 rounded-none border-b border-border justify-start" data-testid="tabs-archive">
            <TabsTrigger
              value="quizzes"
              className="gap-1.5 rounded-none bg-transparent px-0 pb-2.5 pt-0 shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground"
              data-testid="tab-quizzes"
            >
              <FileText className="h-3.5 w-3.5" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger
              value="folders"
              className="gap-1.5 rounded-none bg-transparent px-0 pb-2.5 pt-0 shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground"
              data-testid="tab-folders"
            >
              <Folder className="h-3.5 w-3.5" />
              Folders
              {folders.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 py-0">{folders.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes" className="mt-5 space-y-4">
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
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your library..."
                      className="pl-9 pr-9 h-11 bg-muted/30 border-border/50 focus:bg-background transition-all"
                      data-testid="input-search-quizzes"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-clear-search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {availableCategories.length > 1 && (
                    <Select
                      value={selectedCategory || "all"}
                      onValueChange={(val) => setSelectedCategory(val === "all" ? null : val)}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] h-11 bg-muted/30 border-border/50" data-testid="filter-categories">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" data-testid="filter-all">All Subjects</SelectItem>
                        {availableCategories.map(cat => (
                          <SelectItem key={cat} value={cat} data-testid={`filter-${cat.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                            <span className="flex items-center gap-2">
                              {cat}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {filteredQuizzes.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-border/50 rounded-2xl bg-muted/10">
                    <p className="text-sm text-muted-foreground">
                      No matching quizzes found in your library.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                      data-testid="button-clear-filters"
                    >
                      Clear all filters
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredQuizzes.map((quiz, index) => {
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
                          transition={{ delay: index * 0.02 }}
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


                                  <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-muted-foreground/70">
                                    <div className="flex items-center gap-1">
                                      {formatDate(quiz.createdAt)}
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <div className="font-semibold text-primary/80">
                                      {quiz.category || "Others/General"}
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <div className="flex items-center gap-1">
                                      {(quiz.questions as any[]).length} questions
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <div className={`capitalize ${getDifficultyColor(quiz.difficulty)}`}>
                                      {quiz.difficulty || "medium"}
                                    </div>
                                    {quiz.folderId && folders.find(f => f.id === quiz.folderId) && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                        <div className="flex items-center gap-1">
                                          <Folder className="h-3 w-3" />
                                          {folders.find(f => f.id === quiz.folderId)?.name}
                                        </div>
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
              </div>
            )}
          </TabsContent>

          <TabsContent value="folders" className="mt-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 p-4 rounded-2xl border border-border/50">
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-bold text-foreground">Collection Manager</h3>
                <p className="text-xs text-muted-foreground">
                  Organize your personal practice library into subjects.
                </p>
              </div>
              <Button
                size="sm"
                className="font-bold rounded-lg shadow-none"
                onClick={openCreateFolder}
                data-testid="button-create-folder"
              >
                <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
                Create Folder
              </Button>
            </div>

            {folders.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-border/50 rounded-2xl bg-muted/10">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-bold mb-1">Stay organized</h3>
                <p className="text-xs text-muted-foreground mb-5 px-4">
                  Group your quizzes by class, exam, or topic for faster access.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold h-9 rounded-lg"
                  onClick={openCreateFolder}
                  data-testid="button-create-first-folder"
                >
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card
                        className="group overflow-hidden cursor-pointer border-border/40 hover:border-primary/30 hover:bg-muted/10 transition-all duration-200 shadow-none rounded-xl"
                        onClick={() => setLocation(`/folder/${folder.id}`)}
                        data-testid={`card-folder-${folder.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 transition-transform group-hover:scale-105">
                                <Folder className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors" data-testid={`text-folder-name-${folder.id}`}>
                                    {folder.name}
                                  </h3>
                                  {folder.pinnedToSidebar && (
                                    <Pin className="h-2.5 w-2.5 text-primary shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] font-medium text-muted-foreground/70">
                                  {count} {count === 1 ? "quiz" : "quizzes"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    data-testid={`button-folder-menu-${folder.id}`}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 shadow-xl border-border/50">
                                  <DropdownMenuItem onClick={() => togglePinMutation.mutate(folder.id)} data-testid={`button-toggle-pin-folder-${folder.id}`}>
                                    {folder.pinnedToSidebar ? (
                                      <><PinOff className="h-3.5 w-3.5 mr-2" />Unpin from Sidebar</>
                                    ) : (
                                      <><Pin className="h-3.5 w-3.5 mr-2" />Pin to Sidebar</>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditFolder(folder)} data-testid={`button-rename-folder-${folder.id}`}>
                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                    Rename Folder
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => setFolderToDelete(folder)}
                                    data-testid={`button-delete-folder-${folder.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete Collection
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
