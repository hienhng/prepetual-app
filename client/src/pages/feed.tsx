import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Search, Play, Loader2, Users, BookOpen, 
  Sparkles, Clock, Target, Zap, 
  GraduationCap, Beaker, Calculator, Globe2, 
  BookText, Languages, Archive, LayoutGrid, X,
  Lightbulb, TrendingUp, CheckCircle2
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
    profileImageUrl: string | null;
  } 
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
};

const categoryConfig: Record<string, { label: string; icon: typeof Sparkles }> = {
  "all": { label: "All", icon: LayoutGrid },
  "Math": { label: "Math", icon: Calculator },
  "English": { label: "English", icon: BookText },
  "Science": { label: "Science", icon: Beaker },
  "Social Studies": { label: "Social Studies", icon: Globe2 },
  "Global Languages": { label: "Languages", icon: Languages },
  "Others/General": { label: "General", icon: GraduationCap },
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

  return (
    <>
      <motion.div
        variants={itemVariants}
        className="group cursor-pointer"
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsDialogOpen(true)}
      >
        <Card 
          className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300"
          data-testid={`card-quiz-${quiz.id}`}
        >
          <div className={`relative h-32 sm:h-36 bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between`}>
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-2 right-2 w-20 h-20 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/10 blur-xl" />
            </div>
            
            <div className="relative flex items-start justify-between gap-2">
              <Badge 
                variant="secondary" 
                className="bg-white/25 text-white border-0 backdrop-blur-sm text-[10px] font-medium px-2 py-0.5"
              >
                {questionCount}Q
              </Badge>
              <Badge className={`${diffConfig.bg} ${diffConfig.color} border-0 text-[10px] font-medium px-2 py-0.5`}>
                {diffConfig.label}
              </Badge>
            </div>

            <div className="relative mt-auto">
              <h3 className="text-white font-bold text-sm sm:text-base leading-tight line-clamp-2 drop-shadow-md">
                {quiz.title}
              </h3>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

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
              <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className={`relative h-40 bg-gradient-to-br ${gradient} p-6 flex flex-col justify-end`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/25 text-white border-0 backdrop-blur-sm text-xs">
                  {questionCount} {questionCount === 1 ? "question" : "questions"}
                </Badge>
                <Badge className={`${diffConfig.bg} ${diffConfig.color} border-0 text-xs`}>
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

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                <AvatarFallback className="text-sm bg-muted">
                  {getAuthorInitials(quiz.author)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{getAuthorName(quiz.author)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CategoryIcon className="h-3 w-3" />
                  {categoryConfig[quiz.category || "Others/General"]?.label || "General"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-24 flex-col gap-2 border-2 hover:border-primary/50 hover:bg-primary/5"
                  onClick={handleStudyQuiz}
                  data-testid={`button-study-${quiz.id}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="font-medium">Study Mode</span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-24 flex-col gap-2 bg-primary hover:bg-primary/90"
                  onClick={handleTakeQuiz}
                  data-testid={`button-play-${quiz.id}`}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
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

  const { data: recommendations, isLoading: isLoadingRecs } = useQuery<RecommendationsResponse>({
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
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 sm:px-6 pt-8 pb-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Discover Quizzes
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Explore community-created quizzes and test your knowledge
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search quizzes by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-background/80 border-border/50 focus:border-primary"
                data-testid="input-search-quizzes"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            {["all", ...QUIZ_CATEGORIES].map((categoryId) => {
              const config = categoryConfig[categoryId];
              if (!config) return null;
              const Icon = config.icon;
              const isActive = selectedCategory === categoryId;
              const count = categoryCounts[categoryId] || 0;
              return (
                <Button
                  key={categoryId}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(categoryId)}
                  className={`gap-2 ${isActive ? "" : "bg-background/50 backdrop-blur-sm"}`}
                  data-testid={`button-category-${categoryId}`}
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        {stats.totalQuizzes > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6 mb-8 text-sm text-muted-foreground"
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Suggested For You</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.recommendations.slice(0, 3).map((quiz) => (
                <div key={quiz.id} className="relative">
                  {quiz.recommendationReason === "needs_improvement" && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-rose-500 text-white border-0 text-[10px] px-2 py-0.5">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Improve
                      </Badge>
                    </div>
                  )}
                  {quiz.recommendationReason === "matches_interests" && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-blue-500 text-white border-0 text-[10px] px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            {searchQuery || selectedCategory !== "all" ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No quizzes found</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedCategory !== "all" 
                    ? `No quizzes in ${categoryConfig[selectedCategory]?.label || selectedCategory} category`
                    : "Try a different search term or browse all quizzes"}
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No quizzes yet</h3>
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
          <>
            {filteredQuizzes.length >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <FontAwesomeIcon icon={faFire} className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-semibold">Featured</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredQuizzes.slice(0, 4).map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  {filteredQuizzes.length >= 4 ? "All Quizzes" : "Recent Quizzes"}
                </h2>
              </div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              >
                {(filteredQuizzes.length >= 4 ? filteredQuizzes.slice(4) : filteredQuizzes).map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </motion.div>
            </motion.div>
          </>
        )}

        {filteredQuizzes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12 pt-8 border-t"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Have study materials to share? Create your own quiz!
            </p>
            <Button variant="default" onClick={() => setLocation("/create")} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Create a Quiz
            </Button>
            <Button variant="outline" onClick={() => setLocation("/history")} className="gap-2 ml-5">
              <Archive className="h-4 w-4" />
              Your Quizzes
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
