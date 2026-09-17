import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Play, BookOpen, Share2, Trash2, FileText, Loader2, Edit2, CirclePlus, Globe, GlobeLock, Target, Calculator, Languages, FlaskConical, Landmark, LayoutGrid, FolderPlus, Folder, MoreVertical, Pencil, Sparkles, Search, X, Pin, PinOff, BookText, Globe2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryIcon, getCategoryStorageKey, getCategoryTranslationKey } from "@/lib/category-icons";
import { QUIZ_CATEGORIES } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useLanguage } from "@/lib/language-context";
import type { Quiz, Folder as FolderType } from "@shared/schema";

type QuizWithAttempts = Quiz & { attemptCount?: number };

const categoryColorClasses: Record<string, string> = {
  "common.categories.math": "text-blue-600 bg-blue-500/10 border-blue-200/50",
  "common.categories.science": "text-emerald-600 bg-emerald-500/10 border-emerald-200/50",
  "common.categories.english": "text-violet-600 bg-violet-500/10 border-violet-200/50",
  "common.categories.globalLanguages": "text-violet-600 bg-violet-500/10 border-violet-200/50",
  "common.categories.socialStudies": "text-indigo-600 bg-indigo-500/10 border-indigo-200/50",
  "common.categories.general": "text-slate-600 bg-slate-500/10 border-slate-200/50",
};

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial } = useQuiz();
  const { toast } = useToast();
  const { t } = useLanguage();
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
      toast({ title: t('history.quizDeleted'), description: t('history.quizDeletedDesc'), variant: "success" as any });
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('history.failedDeleteQuiz'), variant: "destructive" });
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
        queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/folders"] })
      ]);
      toast({
        title: isPublic ? t('history.quizShared') : t('history.quizHidden'),
        description: isPublic
          ? t('history.quizSharedDesc')
          : t('history.quizHiddenDesc')
      });
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('history.failedUpdateVisibility'), variant: "destructive" });
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
      toast({ title: t('history.folderCreated') });
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('history.failedCreateFolder'), variant: "destructive" });
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
      toast({ title: t('history.folderRenamed') });
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('history.failedRenameFolder'), variant: "destructive" });
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
      toast({ title: t('history.folderDeleted') });
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('history.failedDeleteFolder'), variant: "destructive" });
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
      toast({ title: t('common.error'), description: t('history.failedTogglePin'), variant: "destructive" });
    },
  });

  const handleRetake = (quiz: any) => {
    setLocation(`/quiz?id=${encodeURIComponent(quiz.id)}`);
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
    toast({ title: t('history.linkCopied'), description: t('history.linkCopiedDesc') });
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(t('common.locale'), { month: "short", day: "numeric" });
  };

  const getDifficultyColor = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return "text-green-600 dark:text-green-400";
      case "hard": return "text-red-500 dark:text-red-400";
      default: return "text-yellow-600 dark:text-yellow-400";
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
      const cat = getCategoryStorageKey(quiz.category);
      if (cat !== selectedCategory) return false;
    }
    return true;
  });

  const sortedFolders = [...folders].sort((a, b) => {
    if (a.pinnedToSidebar && !b.pinnedToSidebar) return -1;
    if (!a.pinnedToSidebar && b.pinnedToSidebar) return 1;
    return 0;
  });

  const availableCategories = Array.from(new Set((quizzes || []).map(q => getCategoryStorageKey(q.category)))).sort();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-9 w-52" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
            <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-lg sm:gap-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          </div>

          <Skeleton className="h-12 w-full rounded-2xl" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-11 w-full flex-1 rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl sm:w-44" />
          </div>

          {/* Quiz rows */}
          <div className="flex flex-col gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40">
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3.5 w-16 rounded-md" />
                    <Skeleton className="h-3.5 w-14 rounded-md" />
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Skeleton className="h-8 w-8 rounded-lg hidden sm:block" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/75 px-5 py-6 shadow-sm sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-28 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl" data-testid="text-page-title">{t('history.title')}</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {t('history.libraryIntro')}
              </p>
            </div>
            <Button
              className="h-10 self-start rounded-xl px-4 font-bold shadow-sm"
              data-testid="button-new-quiz"
              onClick={() => setLocation("/create")}
            >
              <CirclePlus className="mr-2 h-4 w-4" />
              {t('history.createQuiz')}
            </Button>
          </div>

          <div className="relative mt-7 grid grid-cols-3 gap-2 sm:max-w-lg sm:gap-3">
            <div className="rounded-2xl border border-border/50 bg-background/65 p-3 sm:p-4">
              <FileText className="mb-3 h-4 w-4 text-primary" />
              <p className="text-xl font-bold tracking-tight sm:text-2xl">{quizzes?.length || 0}</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{t('history.quizzes')}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/65 p-3 sm:p-4">
              <Folder className="mb-3 h-4 w-4 text-violet-500" />
              <p className="text-xl font-bold tracking-tight sm:text-2xl">{folders.length}</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{t('history.folders')}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/65 p-3 sm:p-4">
              <LayoutGrid className="mb-3 h-4 w-4 text-emerald-500" />
              <p className="text-xl font-bold tracking-tight sm:text-2xl">{availableCategories.length}</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{t('history.allSubjects')}</p>
            </div>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl border border-border/60 bg-muted/30 p-1" data-testid="tabs-archive">
            <TabsTrigger
              value="quizzes"
              className="gap-2 rounded-xl font-bold text-muted-foreground shadow-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              data-testid="tab-quizzes"
            >
              <FileText className="h-3.5 w-3.5" />
              {t('history.quizzes')}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{quizzes?.length || 0}</span>
            </TabsTrigger>
            <TabsTrigger
              value="folders"
              className="gap-2 rounded-xl font-bold text-muted-foreground shadow-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              data-testid="tab-folders"
            >
              <Folder className="h-3.5 w-3.5" />
              {t('history.folders')}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{folders.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes" className="mt-5 space-y-4">
            {!quizzes || quizzes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-card/35 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-base font-semibold">{t('history.noQuizzesYet')}</h3>
                <p className="mb-5 text-sm text-muted-foreground">
                  {t('history.createFirstQuiz')}
                </p>
                <Button
                  className="rounded-xl"
                  data-testid="button-create-first-quiz"
                  onClick={() => setLocation("/create")}
                >
                  {t('history.createQuiz')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/45 p-2 sm:flex-row">
                  <div className="relative w-full flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('history.searchLibrary')}
                      className="h-11 border-0 bg-transparent pl-10 pr-9 shadow-none focus-visible:ring-0"
                      data-testid="input-search-quizzes"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
                      <SelectTrigger className="h-10 w-full rounded-xl border-border/60 bg-background sm:w-[180px]" data-testid="filter-categories">
                        <SelectValue placeholder={t('history.allSubjects')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" data-testid="filter-all">{t('history.allSubjects')}</SelectItem>
                        {availableCategories.map(cat => (
                          <SelectItem key={cat} value={cat} data-testid={`filter-${cat.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                            <span className="flex items-center gap-2">{t(getCategoryTranslationKey(cat))}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {filteredQuizzes.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-muted/10 py-20 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t('history.noMatchingQuizzes')}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                      data-testid="button-clear-filters"
                    >
                      {t('history.clearFilters')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredQuizzes.map((quiz, index) => {
                      const catKey = getCategoryTranslationKey(quiz.category);
                      const catLabel = t(catKey);
                      const catOrig = quiz.category || "General";
                      const colorClass = categoryColorClasses[catKey] ?? categoryColorClasses["common.categories.general"];

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
                              <div className="flex items-center gap-2 sm:gap-4">
                                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${colorClass} transition-transform duration-300 group-hover:scale-105 text-current`}>
                                    {(() => {
                                      const Icon = getCategoryIcon(catOrig);
                                      return <Icon className="h-4 w-4" />;
                                    })()}
                                  </div>

                                <div className="min-w-0 flex-1">
                                  <h3 className="font-bold text-sm sm:text-base leading-tight truncate text-foreground group-hover:text-primary transition-colors" data-testid={`text-quiz-title-${quiz.id}`}>
                                    {quiz.title}
                                  </h3>


                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:gap-3 mt-1 text-[11px] font-medium text-muted-foreground/70">
                                    <div className="hidden sm:flex items-center gap-1">
                                      {formatDate(quiz.createdAt)}
                                    </div>
                                    <span className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <div className="font-semibold text-primary/80">
                                      {catLabel}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {t('history.questions', { count: (quiz as any).questionCount || (quiz.questions as any[])?.length || 0 })}
                                    </div>
                                    <span className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <div className={`hidden sm:block capitalize ${getDifficultyColor(quiz.difficulty)}`}>
                                      {t(`quizGenerator.${quiz.difficulty || "medium"}`)}
                                    </div>
                                    {quiz.folderId && folders.find(f => f.id === quiz.folderId) && (
                                      <span className="hidden sm:contents">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                        <div className="flex items-center gap-1">
                                          <Folder className="h-3 w-3" />
                                          {folders.find(f => f.id === quiz.folderId)?.name}
                                        </div>
                                      </span>
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
                                    {t('history.review')}
                                  </Button>
                                  <Button
                                    size="sm"
                                     className="h-8 px-4 text-xs font-bold rounded-lg shadow-none"
                                    onClick={() => handleRetake(quiz)}
                                    data-testid={`button-retake-${quiz.id}`}
                                  >
                                    <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                                    {t('history.take')}
                                  </Button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <div className="sm:hidden">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-primary"
                                      onClick={() => handleStudy(quiz)}
                                      data-testid={`button-study-mobile-${quiz.id}`}
                                      aria-label={t('history.review')}
                                    >
                                      <BookOpen className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-primary"
                                      onClick={() => handleRetake(quiz)}
                                      data-testid={`button-retake-mobile-${quiz.id}`}
                                      aria-label={t('history.take')}
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
                                        {t('history.editQuiz')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => togglePublicMutation.mutate({
                                          quizId: quiz.id,
                                          isPublic: quiz.isPublic !== 1
                                        })}
                                        data-testid={`button-toggle-public-${quiz.id}`}
                                      >
                                        {quiz.isPublic === 1 ? (
                                          <><GlobeLock className="h-3.5 w-3.5 mr-2" />{t('history.draftMode')}</>
                                        ) : (
                                          <><Globe className="h-3.5 w-3.5 mr-2" />{t('history.publishToLibrary')}</>
                                        )}
                                      </DropdownMenuItem>
                                       <DropdownMenuItem onClick={() => handleShare(quiz.id)} data-testid={`button-share-${quiz.id}`}>
                                        <Share2 className="h-3.5 w-3.5 mr-2" />
                                        {t('history.copyShareLink')}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        onClick={() => setQuizToDelete(quiz)}
                                        data-testid={`button-delete-${quiz.id}`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        {t('history.permanentlyDelete')}
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
                <h3 className="text-sm font-bold text-foreground">{t('history.collectionManager')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('history.organizeDesc')}
                </p>
              </div>
              <Button
                size="sm"
                className="font-bold rounded-lg shadow-primary/60"
                onClick={openCreateFolder}
                data-testid="button-create-folder"
              >
                <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
                {t('history.createFolder')}
              </Button>
            </div>

            {folders.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-border/50 rounded-2xl bg-muted/10">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-bold mb-1">{t('history.stayOrganized')}</h3>
                <p className="text-xs text-muted-foreground mb-5 px-4">
                  {t('history.groupQuizzesDesc')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold h-9 rounded-lg"
                  onClick={openCreateFolder}
                  data-testid="button-create-first-folder"
                >
                  {t('history.createFolder')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedFolders.map((folder, index) => {
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
                                  {count} {count === 1 ? t('history.quiz') : t('history.quizzes')}
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
                                      <><PinOff className="h-3.5 w-3.5 mr-2" />{t('history.unpinFromTop')}</>
                                    ) : (
                                      <><Pin className="h-3.5 w-3.5 mr-2" />{t('history.pinToTop')}</>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditFolder(folder)} data-testid={`button-rename-folder-${folder.id}`}>
                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                    {t('history.renameFolder')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => setFolderToDelete(folder)}
                                    data-testid={`button-delete-folder-${folder.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    {t('history.deleteCollection')}
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
            <DialogTitle>{editingFolder ? t('history.renameFolder') : t('history.createFolder')}</DialogTitle>
            <DialogDescription>
              {editingFolder ? t('history.enterNewFolderName') : t('history.giveFolderName')}
            </DialogDescription>
          </DialogHeader>
          <Input
            ref={folderInputRef}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder={t('history.folderName')}
            data-testid="input-folder-name"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFolderSubmit();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)} data-testid="button-cancel-folder">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleFolderSubmit}
              disabled={!folderName.trim() || createFolderMutation.isPending || updateFolderMutation.isPending}
              data-testid="button-save-folder"
            >
              {(createFolderMutation.isPending || updateFolderMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingFolder ? t('history.rename') : t('history.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('history.deleteQuiz')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('history.deleteQuizConfirm', { title: quizToDelete?.title || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => quizToDelete && deleteMutation.mutate(quizToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive border-none text-destructive-foreground shadow-destructive/20"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('history.deleteCollection')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('history.deleteFolderConfirm', { name: folderToDelete?.name || "" })}
              </AlertDialogDescription>
            </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-folder">{t('common.cancel')}</AlertDialogCancel>
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
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
