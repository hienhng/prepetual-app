import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Search, Play, Loader2, Users, BookOpen, 
  Sparkles, Clock, Target, Zap, 
  GraduationCap, Beaker, Calculator, Globe2, 
  BookText, Languages, LayoutGrid,
  Lightbulb, TrendingUp, CheckCircle2, BadgeCheck,
  Star
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

const categoryConfig: Record<string, { label: string; icon: typeof Sparkles; gradient: string }> = {
  "all": { label: "All", icon: LayoutGrid, gradient: "from-slate-500 to-slate-600" },
  "Math": { label: "Math", icon: Calculator, gradient: "from-blue-500 to-indigo-600" },
  "English": { label: "English", icon: BookText, gradient: "from-amber-500 to-orange-600" },
  "Science": { label: "Science", icon: Beaker, gradient: "from-emerald-500 to-teal-600" },
  "Social Studies": { label: "Social Studies", icon: Globe2, gradient: "from-purple-500 to-violet-600" },
  "Global Languages": { label: "Languages", icon: Languages, gradient: "from-pink-500 to-rose-600" },
  "Others/General": { label: "General", icon: GraduationCap, gradient: "from-cyan-500 to-blue-600" },
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

function QuizCard({ quiz }: { quiz: PublicQuiz }) {
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
      case "easy": return { label: "Easy", color: "text-emerald-400", bg: "bg-emerald-500/20" };
      case "hard": return { label: "Hard", color: "text-rose-400", bg: "bg-rose-500/20" };
      default: return { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/20" };
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="group cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
        <Card 
          className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
          data-testid={`card-quiz-${quiz.id}`}
        >
          <div className={`relative h-36 bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/20 blur-3xl" />
            </div>
            
            <div className="relative flex items-start justify-between">
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs font-medium"
              >
                {questionCount} {questionCount === 1 ? "Q" : "Qs"}
              </Badge>
              {isCurated && (
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs font-medium gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Curated
                </Badge>
              )}
            </div>

            <div className="relative">
              <h3 className="text-white font-bold text-base leading-snug line-clamp-2 drop-shadow-sm">
                {quiz.title}
              </h3>
            </div>
          </div>

          <CardContent className="p-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-7 w-7 ring-2 ring-background">
                  <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs bg-muted">
                    {getAuthorInitials(quiz.author)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  {getAuthorName(quiz.author)}
                  {isCurated && (
                    <BadgeCheck className="h-3.5 w-3.5 text-green-500 fill-green-500/30" />
                  )}
                </span>
              </div>
              <Badge className={`${diffConfig.bg} ${diffConfig.color} border-0 text-xs`}>
                {diffConfig.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className={`relative h-44 bg-gradient-to-br ${gradient} p-6 flex flex-col justify-end`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-6 right-6 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-white/25 text-white border-0 backdrop-blur-sm">
                  {questionCount} {questionCount === 1 ? "question" : "questions"}
                </Badge>
                <Badge className={`${diffConfig.bg} ${diffConfig.color} border-0`}>
                  {diffConfig.label}
                </Badge>
              </div>
              <DialogHeader className="text-left">
                <DialogTitle className="text-white text-xl font-bold drop-shadow-md leading-tight">
                  {quiz.title}
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-11 w-11 ring-2 ring-border">
                <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-muted">
                  {getAuthorInitials(quiz.author)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium">{getAuthorName(quiz.author)}</p>
                  {isCurated && (
                    <>
                      <BadgeCheck className="h-4 w-4 text-green-500 fill-green-500/30" />
                      <span className="text-xs text-green-500 font-medium">Curated</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CategoryIcon className="h-3.5 w-3.5" />
                  {categoryConfig[quiz.category || "Others/General"]?.label || "General"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-24 flex-col gap-2 border-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                  onClick={handleStudyQuiz}
                  data-testid={`button-study-${quiz.id}`}
                >
                  <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="font-medium">Study Mode</span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-24 flex-col gap-2 bg-primary hover:bg-primary/90 transition-all"
                  onClick={handleTakeQuiz}
                  data-testid={`button-play-${quiz.id}`}
                >
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                    <Play className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Take Quiz</span>
                </Button>
              </motion.div>
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
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Discovering quizzes...</p>
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover</h1>
          <p className="text-muted-foreground">
            Explore community quizzes and challenge yourself
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
              placeholder="Search quizzes..."
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
                  {config.label}
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
              <span><strong className="text-foreground">{stats.totalQuizzes}</strong> quizzes</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span><strong className="text-foreground">{stats.totalQuestions}</strong> questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span><strong className="text-foreground">{stats.totalContributors}</strong> creators</span>
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
                <h2 className="text-lg font-bold">Recommended for You</h2>
                <p className="text-sm text-muted-foreground">Based on your learning history</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {recommendations.recommendations.slice(0, 4).map((quiz, index) => (
                <motion.div 
                  key={quiz.id} 
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  {quiz.recommendationReason === "needs_improvement" && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-rose-500 text-white border-0 shadow-lg shadow-rose-500/30 gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Practice
                      </Badge>
                    </div>
                  )}
                  {quiz.recommendationReason === "matches_interests" && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-blue-500 text-white border-0 shadow-lg shadow-blue-500/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        For You
                      </Badge>
                    </div>
                  )}
                  <QuizCard quiz={quiz} />
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
                <h3 className="text-xl font-bold mb-2">No quizzes found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {selectedCategory !== "all" 
                    ? `No quizzes in ${categoryConfig[selectedCategory]?.label || selectedCategory}`
                    : "Try a different search term"}
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No quizzes yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Be the first to share your knowledge with the community!
                </p>
                <Button onClick={() => setLocation("/create")} className="gap-2" data-testid="button-create-quiz">
                  <Sparkles className="h-4 w-4" />
                  Create a Quiz
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
                    <h2 className="text-lg font-bold">Featured</h2>
                    <p className="text-sm text-muted-foreground">Popular quizzes from the community</p>
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
                    {filteredQuizzes.length >= 4 ? "All Quizzes" : "Recent Quizzes"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredQuizzes.length >= 4 
                      ? `${filteredQuizzes.length - 4} more quizzes to explore`
                      : `${filteredQuizzes.length} quizzes available`
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
