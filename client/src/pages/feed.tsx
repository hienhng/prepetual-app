import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Play, Loader2, Users, BookOpen, 
  Sparkles, Clock, Target, Zap, 
  GraduationCap, Beaker, Calculator, Globe2, 
  BookText, Languages, LayoutGrid, Filter,
  Lightbulb, TrendingUp, CheckCircle2, BadgeCheck,
  ChevronRight, Star, ArrowRight
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuiz } from "@/lib/quiz-context";
import type { Quiz } from "@shared/schema";
import { QUIZ_CATEGORIES } from "@shared/schema";

type PublicQuiz = Quiz & { 
  author?: { 
    username: string | null; 
    email: string | null;
    profileImageUrl: string | null;
  } 
};

const categoryConfig: Record<string, { label: string; icon: typeof Sparkles; color: string }> = {
  "all": { label: "All", icon: LayoutGrid, color: "from-slate-500 to-slate-600" },
  "Math": { label: "Math", icon: Calculator, color: "from-blue-500 to-indigo-600" },
  "English": { label: "English", icon: BookText, color: "from-amber-500 to-orange-600" },
  "Science": { label: "Science", icon: Beaker, color: "from-emerald-500 to-teal-600" },
  "Social Studies": { label: "Social Studies", icon: Globe2, color: "from-purple-500 to-violet-600" },
  "Global Languages": { label: "Languages", icon: Languages, color: "from-pink-500 to-rose-600" },
  "Others/General": { label: "General", icon: GraduationCap, color: "from-cyan-500 to-blue-600" },
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
  "from-amber-500 to-orange-500",
  "from-rose-500 to-red-500",
];

function getGradientForQuiz(quizId: string): string {
  let hash = 0;
  for (let i = 0; i < quizId.length; i++) {
    hash = quizId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function QuizCard({ quiz, featured = false }: { quiz: PublicQuiz; featured?: boolean }) {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial } = useQuiz();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const setupQuiz = () => {
    setCurrentQuiz({
      ...quiz,
      createdAt: typeof quiz.createdAt === "string" ? quiz.createdAt : quiz.createdAt.toISOString(),
    } as any);
    setSourceMaterial({
      type: quiz.sourceImageUrl ? "image" : null,
      text: quiz.sourceText,
      imageDataUrl: quiz.sourceImageUrl || null,
    });
  };

  const handleTakeQuiz = () => {
    setupQuiz();
    setLocation("/quiz");
  };

  const handleStudyQuiz = () => {
    setupQuiz();
    setLocation("/study");
  };

  const getAuthorName = (author?: PublicQuiz["author"]) => {
    if (!author) return "Anonymous";
    return author.username || "Anonymous";
  };

  const getAuthorInitials = (author?: PublicQuiz["author"]) => {
    if (!author || !author.username) return "A";
    return author.username[0].toUpperCase();
  };

  const getDifficultyConfig = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return { label: "Easy", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      case "hard": return { label: "Hard", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
      default: return { label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    }
  };

  const getCategoryIcon = (category?: string | null) => {
    const config = categoryConfig[category || "Others/General"];
    return config?.icon || GraduationCap;
  };

  const diffConfig = getDifficultyConfig(quiz.difficulty);
  const gradient = getGradientForQuiz(quiz.id);
  const questionCount = (quiz.questions as any[]).length;
  const CategoryIcon = getCategoryIcon(quiz.category);
  const isCurated = quiz.author?.email === "giahienhn@gmail.com";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        className="group cursor-pointer h-full"
        onClick={() => setIsDialogOpen(true)}
      >
        <Card 
          className={`overflow-hidden border-0 h-full transition-all duration-300 ${
            featured 
              ? "shadow-lg hover:shadow-xl" 
              : "bg-muted/30 hover:bg-muted/50 shadow-sm hover:shadow-md"
          }`}
          data-testid={`card-quiz-${quiz.id}`}
        >
          {featured ? (
            <div className={`relative h-28 bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between`}>
              <div className="absolute inset-0 bg-black/5" />
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1 right-1 w-16 h-16 rounded-full bg-white/20 blur-2xl" />
              </div>
              
              <div className="relative flex items-start justify-between gap-2">
                <Badge 
                  variant="secondary" 
                  className="bg-white/20 text-white border-0 backdrop-blur-sm text-[10px] font-medium px-1.5 py-0"
                >
                  {questionCount}Q
                </Badge>
                {isCurated && (
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[10px] font-medium px-1.5 py-0 gap-1">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Curated
                  </Badge>
                )}
              </div>

              <div className="relative mt-auto">
                <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow-sm">
                  {quiz.title}
                </h3>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="p-3 flex flex-col h-full">
              <div className="flex items-start gap-2.5 mb-2">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                  <CategoryIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {quiz.title}
                  </h3>
                </div>
              </div>
              
              <div className="mt-auto flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${diffConfig.color} ${diffConfig.bg} ${diffConfig.border}`}>
                    {diffConfig.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{questionCount}Q</span>
                </div>
                {isCurated && (
                  <BadgeCheck className="h-3.5 w-3.5 text-green-500 fill-green-500/30" />
                )}
              </div>
            </div>
          )}

          {featured && (
            <CardContent className="p-2.5 bg-card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-5 w-5 flex-shrink-0">
                    <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-[9px] bg-muted">
                      {getAuthorInitials(quiz.author)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {getAuthorName(quiz.author)}
                  </span>
                </div>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${diffConfig.color} ${diffConfig.bg} ${diffConfig.border}`}>
                  {diffConfig.label}
                </Badge>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className={`relative h-36 bg-gradient-to-br ${gradient} p-5 flex flex-col justify-end`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-4 right-4 w-28 h-28 rounded-full bg-white/10 blur-3xl" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  {questionCount} {questionCount === 1 ? "question" : "questions"}
                </Badge>
                <Badge className={`${diffConfig.bg} ${diffConfig.color} border-0 text-xs`}>
                  {diffConfig.label}
                </Badge>
              </div>
              <DialogHeader className="text-left">
                <DialogTitle className="text-white text-lg font-bold drop-shadow-md leading-tight">
                  {quiz.title}
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Avatar className="h-9 w-9">
                <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                <AvatarFallback className="text-sm bg-muted">
                  {getAuthorInitials(quiz.author)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{getAuthorName(quiz.author)}</p>
                  {isCurated && (
                    <>
                      <BadgeCheck className="h-3.5 w-3.5 text-green-500 fill-green-500/30" />
                      <span className="text-xs text-green-500">Curated</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CategoryIcon className="h-3 w-3" />
                  {categoryConfig[quiz.category || "Others/General"]?.label || "General"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-1.5 border hover:border-primary/50 hover:bg-primary/5"
                onClick={handleStudyQuiz}
                data-testid={`button-study-${quiz.id}`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-xs font-medium">Study</span>
              </Button>

              <Button
                className="h-20 flex-col gap-1.5 bg-primary hover:bg-primary/90"
                onClick={handleTakeQuiz}
                data-testid={`button-play-${quiz.id}`}
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">Take Quiz</span>
              </Button>
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
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.sourceText.toLowerCase().includes(searchQuery.toLowerCase());
      
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
      totalQuestions: quizzes.reduce((acc, q) => acc + (q.questions as any[]).length, 0),
      totalContributors: new Set(quizzes.map(q => q.userId)).size,
    };
  }, [quizzes]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Discover</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Explore community quizzes and test your knowledge
              </p>
            </div>
            
            {stats.totalQuizzes > 0 && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  <span><strong className="text-foreground">{stats.totalQuizzes}</strong> quizzes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span><strong className="text-foreground">{stats.totalQuestions}</strong> questions</span>
                </div>
                <div className="flex items-center gap-1.5 hidden sm:flex">
                  <Users className="h-3.5 w-3.5" />
                  <span><strong className="text-foreground">{stats.totalContributors}</strong> creators</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary/20"
                data-testid="input-search-quizzes"
              />
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              {["all", ...QUIZ_CATEGORIES].map((categoryId) => {
                const config = categoryConfig[categoryId];
                if (!config) return null;
                const Icon = config.icon;
                const isActive = selectedCategory === categoryId;
                const count = categoryCounts[categoryId] || 0;
                
                return (
                  <Button
                    key={categoryId}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(categoryId)}
                    className={`gap-1.5 h-8 px-3 flex-shrink-0 ${
                      isActive ? "" : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`button-category-${categoryId}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs">{config.label}</span>
                    {count > 0 && isActive && (
                      <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px] bg-white/20">
                        {count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {user && recommendations?.hasData && recommendations.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <h2 className="text-sm font-semibold">Recommended for You</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {recommendations.recommendations.slice(0, 4).map((quiz) => (
                <div key={quiz.id} className="relative">
                  {quiz.recommendationReason === "needs_improvement" && (
                    <div className="absolute -top-1.5 -right-1.5 z-10">
                      <Badge className="bg-rose-500 text-white border-0 text-[9px] px-1.5 py-0 gap-0.5">
                        <TrendingUp className="h-2.5 w-2.5" />
                        Practice
                      </Badge>
                    </div>
                  )}
                  {quiz.recommendationReason === "matches_interests" && (
                    <div className="absolute -top-1.5 -right-1.5 z-10">
                      <Badge className="bg-blue-500 text-white border-0 text-[9px] px-1.5 py-0 gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        For You
                      </Badge>
                    </div>
                  )}
                  <QuizCard quiz={quiz} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {filteredQuizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            {searchQuery || selectedCategory !== "all" ? (
              <>
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No quizzes found</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                  {selectedCategory !== "all" 
                    ? `No quizzes in ${categoryConfig[selectedCategory]?.label || selectedCategory}`
                    : "Try a different search term"}
                </p>
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No quizzes yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                  Be the first to share your knowledge!
                </p>
                <Button onClick={() => setLocation("/create")} size="sm" className="gap-1.5" data-testid="button-create-quiz">
                  <Sparkles className="h-3.5 w-3.5" />
                  Create Quiz
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredQuizzes.length >= 4 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-orange-500/10 flex items-center justify-center">
                      <FontAwesomeIcon icon={faFire} className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <h2 className="text-sm font-semibold">Featured</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredQuizzes.slice(0, 4).map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} featured />
                  ))}
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <h2 className="text-sm font-semibold">
                    {filteredQuizzes.length >= 4 ? "Browse All" : "Recent Quizzes"}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({(filteredQuizzes.length >= 4 ? filteredQuizzes.length - 4 : filteredQuizzes.length)} quizzes)
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {(filteredQuizzes.length >= 4 ? filteredQuizzes.slice(4) : filteredQuizzes).map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.02 * Math.min(index, 10) }}
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
