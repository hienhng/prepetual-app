import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Search, Play, Users, BookOpen, 
  Sparkles, Clock, Target, Zap, 
  Lightbulb, TrendingUp, CheckCircle2, BadgeCheck,
  Star, Compass, LayoutGrid, GraduationCap, FileHeart, CirclePlus, Share2
} from "lucide-react";
import { getCategoryIcon, getCategoryGradient, getCategoryLabel, getCategoryTranslationKey, categoryConfig } from "@/lib/category-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuiz } from "@/lib/quiz-context";
import { useLanguage } from "@/lib/language-context";
import type { Quiz } from "@shared/schema";
import { QUIZ_CATEGORIES } from "@shared/schema";

type PublicQuiz = {
  id: string;
  userId: string | null;
  title: string;
  difficulty: string | null;
  category: string | null;
  generationMode: "generate" | "import" | "review" | null;
  isPublic: number | null;
  createdAt: string | Date;
  questionCount: number;
  topicCount: number;
  isCurated: boolean;
  author?: { 
    username: string | null; 
    profileImageUrl: string | null;
  };
};


const gradients = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
  "from-fuchsia-500 to-pink-500",
  "from-teal-500 to-emerald-500",
];

function getGradientForQuiz(quizId: string): string {
  let hash = 0;
  for (let i = 0; i < quizId.length; i++) {
    hash = quizId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

type QuizCardProps = {
  quiz: PublicQuiz;
  recommendationLabel?: "needs_improvement" | "matches_interests" | "popular" | null;
};

function QuizCard({ quiz, recommendationLabel }: QuizCardProps) {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial } = useQuiz();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const handleShare = (quizId: string) => {
    const url = `${window.location.origin}/share/${quizId}`;
    navigator.clipboard.writeText(url);
    toast({ title: t('history.linkCopied'), description: t('history.linkCopiedDesc') });
  };

  const setupQuiz = async (): Promise<boolean> => {
    setIsOpening(true);
    try {
      const response = await fetch(`/api/quiz/${quiz.id}`);
      if (!response.ok) {
        throw new Error("Failed to load quiz");
      }
      const fullQuiz = await response.json() as Quiz;

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
      return true;
    } catch {
      toast({
        title: t("common.error"),
        description: "The quiz could not be loaded. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsOpening(false);
    }
  };

  const handleTakeQuiz = () => {
    setLocation(`/quiz?id=${encodeURIComponent(quiz.id)}`);
  };

  const handleStudyQuiz = async () => {
    if (await setupQuiz()) setLocation("/study");
  };

  const getAuthorName = (author?: PublicQuiz["author"]) => {
    if (!author) return t('common.user');
    return author.username || t('common.user');
  };

  const getAuthorInitials = (author?: PublicQuiz["author"]) => {
    if (!author || !author.username) return "A";
    return author.username[0].toUpperCase();
  };

  const getDifficultyConfig = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return { label: t('quizGenerator.easy'), color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-500" };
      case "hard": return { label: t('quizGenerator.hard'), color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", dot: "bg-rose-500" };
      default: return { label: t('quizGenerator.medium'), color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-500" };
    }
  };

  const getCategoryIconLocal = (category?: string | null) => {
    return getCategoryIcon(category);
  };

  const getCategoryGradientLocal = (category?: string | null) => {
    return getCategoryGradient(category);
  };

  const getRecommendationConfig = () => {
    switch (recommendationLabel) {
      case "needs_improvement": return { label: t('feed.practiceMore'), icon: TrendingUp, bg: "bg-rose-500/10", color: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20" };
      case "matches_interests": return { label: t('feed.forYou'), icon: CheckCircle2, bg: "bg-blue-500/10", color: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" };
      default: return null;
    }
  };

  const diffConfig = getDifficultyConfig(quiz.difficulty);
  const categoryGradient = getCategoryGradientLocal(quiz.category);
  const questionCount = quiz.questionCount;
  const topicCount = quiz.topicCount;
  const CategoryIcon = getCategoryIconLocal(quiz.category);
  const isCurated = quiz.isCurated;
  const recConfig = getRecommendationConfig();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group cursor-pointer h-full"
        onClick={() => setIsDialogOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card 
          className="overflow-hidden h-full bg-card border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
          data-testid={`card-quiz-${quiz.id}`}
        >
          <CardContent className="p-0 flex flex-col h-full">
            <div className={`relative h-24 bg-gradient-to-br ${categoryGradient} p-4 flex items-end`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute top-3 right-3 flex gap-2">
                {isCurated && (
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[10px] gap-1">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {t('feed.curated')}
                  </Badge>
                )}
                {recConfig && (
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[10px] gap-1">
                    <recConfig.icon className="h-2.5 w-2.5" />
                    {recConfig.label}
                  </Badge>
                )}
              </div>
              <div className="relative flex items-center gap-3">
                <motion.div 
                  className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  animate={{ rotate: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CategoryIcon className="h-5 w-5 text-white" />
                </motion.div>
                <div className="flex-1">
                  <span className="text-white/70 text-xs font-medium">
                    {t(getCategoryTranslationKey(quiz.category))}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-foreground leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                {quiz.title}
              </h3>
              

              <div className="mt-auto space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${diffConfig.bg} ${diffConfig.color} border-0`}>
                    {diffConfig.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {topicCount > 0
                      ? `${topicCount} topics`
                      : t('history.questions', { count: questionCount })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                      <AvatarFallback className="text-[9px] bg-muted">
                        {getAuthorInitials(quiz.author)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                      {getAuthorName(quiz.author)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <motion.div 
                      className="flex items-center gap-1 text-xs text-primary font-medium pointer-events-none"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span>{t('feed.play')}</span>
                      <Play className="h-3 w-3 fill-primary" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className={`relative h-32 bg-gradient-to-br ${getCategoryGradientLocal(quiz.category)} p-5 flex items-end`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute top-4 right-4 flex gap-2">
              {isCurated && (
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs gap-1 mt-[20px] mb-[20px]">
                  <Star className="h-3 w-3 fill-current" />
                  {t('feed.curated')}
                </Badge>
              )}
            </div>
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CategoryIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-white/70 text-sm font-medium block mb-1">
                    {t(getCategoryTranslationKey(quiz.category))}
                </span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {t('history.questions', { count: questionCount })}
                  </Badge>
                  <Badge className={`${diffConfig.bg} ${diffConfig.color} border-0 text-xs`}>
                    {diffConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <DialogHeader className="text-left">
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-lg font-bold leading-snug flex-1">
                  {quiz.title}
                </DialogTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(quiz.id);
                  }}
                  data-testid={`button-share-dialog-${quiz.id}`}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-9 w-9">
                <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-muted text-sm">
                  {getAuthorInitials(quiz.author)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm">{getAuthorName(quiz.author)}</p>
                  {isCurated && (
                    <BadgeCheck className="h-4 w-4 text-green-500 fill-green-500/30" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t('feed.quizCreator')}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Button
                  variant="outline"
                  className="w-full h-12 gap-2 hover:bg-blue-500/5 hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                  onClick={handleStudyQuiz}
                  disabled={isOpening}
                  data-testid={`button-study-${quiz.id}`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">{t('feed.study')}</span>
                </Button>
              </div>

              <div className="flex-1">
                <Button
                  className="w-full h-12 gap-2"
                  onClick={handleTakeQuiz}
                  disabled={isOpening}
                  data-testid={`button-play-${quiz.id}`}
                >
                  <Play className="h-4 w-4" />
                  <span className="font-medium">{t('feed.takeQuiz')}</span>
                </Button>
              </div>

              
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type RecommendationQuiz = PublicQuiz & {
  recommendationReason?: "needs_improvement" | "matches_interests" | "popular";
};

type RecommendationsResponse = {
  hasData: boolean;
  recommendations: RecommendationQuiz[];
  userCategories?: string[];
  weakCategories?: string[];
  message?: string;
};

export default function Feed() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: quizzes, isLoading } = useQuery<PublicQuiz[]>({
    queryKey: ["/api/public-quizzes"],
  });

  const { data: recommendations } = useQuery<RecommendationsResponse>({
    queryKey: ["/api/recommendations"],
    enabled: !!user,
  });

  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return [];
    
    return quizzes.filter(quiz => {
      const matchesSearch = searchQuery === "" || 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || 
        quiz.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quizzes, searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    if (!quizzes) return {};
    const counts: Record<string, number> = { all: quizzes.length };
    for (const cat of QUIZ_CATEGORIES) {
      counts[cat] = quizzes.filter(q => q.category === cat).length;
    }
    return counts;
  }, [quizzes]);

  const stats = useMemo(() => {
    if (!quizzes) return { totalQuizzes: 0, totalQuestions: 0, totalContributors: 0 };
    return {
      totalQuizzes: quizzes.length,
      totalQuestions: quizzes.reduce((acc, q) => acc + q.questionCount, 0),
      totalContributors: new Set(quizzes.map(q => q.userId)).size,
    };
  }, [quizzes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="space-y-2 mb-10">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>

          {/* Search bar */}
          <Skeleton className="h-12 w-full max-w-xl rounded-xl mb-8" />

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-8 mb-10">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>

          {/* Quiz card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden">
                <Skeleton className="h-32 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('feed.discover')}</h1>
          <p className="text-muted-foreground">
            {t('feed.exploreCommunity')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('feed.searchQuizzes')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-muted/50 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
              data-testid="input-search-quizzes"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {["all", ...QUIZ_CATEGORIES].map((categoryId) => {
            const config = categoryConfig[categoryId];
            if (!config) return null;
            const Icon = config.icon;
            const isActive = selectedCategory === categoryId;
            const count = categoryCounts[categoryId] || 0;
            
            return (
              <motion.div
                key={categoryId}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setSelectedCategory(categoryId)}
                  className={`gap-2 rounded-full transition-all ${
                    isActive 
                      ? "shadow-md" 
                      : "bg-background hover:bg-muted"
                  }`}
                  data-testid={`button-category-${categoryId}`}
                >
                  <Icon className="h-4 w-4" />
                  {categoryId === "all" ? t('history.allSubjects') : t(getCategoryTranslationKey(categoryId))}
                  {count > 0 && (
                    <span className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>

        {stats.totalQuizzes > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-8 mb-10 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span><strong className="text-foreground">{stats.totalQuizzes}</strong> {t('feed.totalQuizzes')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span><strong className="text-foreground">{stats.totalQuestions}</strong> {t('feed.totalQuestions')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span><strong className="text-foreground">{stats.totalContributors}</strong> {t('feed.totalCreators')}</span>
            </div>
          </motion.div>
        )}

        {user && recommendations?.hasData && recommendations.recommendations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{t('feed.recommendedForYou')}</h2>
                <p className="text-sm text-muted-foreground">{t('feed.basedOnHistory')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {recommendations.recommendations.slice(0, 4).map((quiz, index) => (
                <motion.div 
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <QuizCard quiz={quiz} recommendationLabel={quiz.recommendationReason} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {filteredQuizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            {searchQuery || selectedCategory !== "all" ? (
              <>
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('feed.noQuizzesFound')}</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {selectedCategory !== "all" 
                    ? t('history.noMatchingQuizzes')
                    : t('feed.tryDifferentSearch')}
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                  {t('feed.clearFilters')}
                </Button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FileHeart className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('feed.noQuizzesYet')}</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {t('feed.beFirstToShare')}
                </p>
                <Button onClick={() => setLocation("/create")} className="gap-2" data-testid="button-create-quiz">
                  <CirclePlus className="h-4 w-4" />
                  {t('history.createQuiz')}
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-12">
            {filteredQuizzes.length >= 4 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <FontAwesomeIcon icon={faFire} className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{t('feed.featured')}</h2>
                    <p className="text-sm text-muted-foreground">{t('feed.popularQuizzes')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredQuizzes.slice(0, 4).map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <QuizCard quiz={quiz} />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {filteredQuizzes.length >= 4 ? t('feed.allQuizzes') : t('feed.recentQuizzes')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredQuizzes.length >= 4 
                      ? t('feed.moreQuizzesToExplore', { count: filteredQuizzes.length - 4 })
                      : t('feed.quizzesAvailable', { count: filteredQuizzes.length })
                    }
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {(filteredQuizzes.length >= 4 ? filteredQuizzes.slice(4) : filteredQuizzes).map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * Math.min(index, 12) }}
                  >
                    <QuizCard quiz={quiz} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>
        )}
      </div>
    </div>
  );
}
