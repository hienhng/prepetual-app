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
  Heart, ArrowRight
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

const categoryConfig: Record<string, { label: string; icon: typeof Sparkles }> = {
  "all": { label: "All", icon: LayoutGrid },
  "Math": { label: "Math", icon: Calculator },
  "English": { label: "English", icon: BookText },
  "Science": { label: "Science", icon: Beaker },
  "Social Studies": { label: "Social Studies", icon: Globe2 },
  "Global Languages": { label: "Languages", icon: Languages },
  "Others/General": { label: "General", icon: GraduationCap },
};

const difficultyConfig = {
  easy: { label: "Easy", color: "bg-emerald-500" },
  medium: { label: "Medium", color: "bg-amber-500" },
  hard: { label: "Hard", color: "bg-rose-500" },
};

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

  const difficulty = (quiz.difficulty || "medium") as keyof typeof difficultyConfig;
  const diffConfig = difficultyConfig[difficulty] || difficultyConfig.medium;
  const questionCount = (quiz.questions as any[]).length;
  const CategoryIcon = categoryConfig[quiz.category || "Others/General"]?.icon || GraduationCap;
  const isCurated = quiz.author?.email === "giahienhn@gmail.com";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        className="group cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
        <Card 
          className="overflow-hidden bg-card hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-border"
          data-testid={`card-quiz-${quiz.id}`}
        >
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <CategoryIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {quiz.title}
                  </h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${diffConfig.color}`} />
                <span className="text-xs text-muted-foreground">{diffConfig.label}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{questionCount} questions</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-[10px] bg-muted">
                      {getAuthorInitials(quiz.author)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {getAuthorName(quiz.author)}
                    {isCurated && (
                      <BadgeCheck className="h-3 w-3 text-primary fill-primary/20" />
                    )}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CategoryIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-lg font-bold leading-snug">
                    {quiz.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className={`w-2 h-2 rounded-full ${diffConfig.color}`} />
                  <span className="text-sm text-muted-foreground">{diffConfig.label}</span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{questionCount} questions</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-5">
              <Avatar className="h-9 w-9">
                <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-muted">
                  {getAuthorInitials(quiz.author)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{getAuthorName(quiz.author)}</p>
                  {isCurated && (
                    <>
                      <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/20" />
                      <span className="text-xs text-primary font-medium">Verified</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {categoryConfig[quiz.category || "Others/General"]?.label || "General"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 gap-2"
                onClick={handleStudyQuiz}
                data-testid={`button-study-${quiz.id}`}
              >
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span>Study</span>
              </Button>

              <Button
                className="h-14 gap-2"
                onClick={handleTakeQuiz}
                data-testid={`button-play-${quiz.id}`}
              >
                <Play className="h-4 w-4" />
                <span>Take Quiz</span>
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
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading community quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Community</h1>
            </div>
          </div>
          <p className="text-muted-foreground">
            Discover quizzes shared by learners in the Prepetual community
          </p>
          
          {stats.totalQuizzes > 0 && (
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4 text-rose-500" />
                <span><strong className="text-foreground">{stats.totalContributors}</strong> contributors</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4 text-primary" />
                <span><strong className="text-foreground">{stats.totalQuizzes}</strong> quizzes</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4 text-amber-500" />
                <span><strong className="text-foreground">{stats.totalQuestions}</strong> questions</span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
              data-testid="input-search-quizzes"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
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
                  className={`gap-1.5 ${!isActive ? "text-muted-foreground hover:text-foreground" : ""}`}
                  data-testid={`button-category-${categoryId}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                  {count > 0 && isActive && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {user && recommendations?.hasData && recommendations.recommendations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold">Recommended for You</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recommendations.recommendations.slice(0, 4).map((quiz, index) => (
                <motion.div 
                  key={quiz.id} 
                  className="relative"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  {quiz.recommendationReason === "needs_improvement" && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-rose-500 text-white border-0 text-[10px] gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Practice
                      </Badge>
                    </div>
                  )}
                  {quiz.recommendationReason === "matches_interests" && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-blue-500 text-white border-0 text-[10px] gap-1">
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
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
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
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Be the first contributor!</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Share your knowledge with the Prepetual community
                </p>
                <Button onClick={() => setLocation("/create")} className="gap-2" data-testid="button-create-quiz">
                  <Sparkles className="h-4 w-4" />
                  Create a Quiz
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-10">
            {filteredQuizzes.length >= 4 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <FontAwesomeIcon icon={faFire} className="h-5 w-5 text-orange-500" />
                  <h2 className="font-semibold">Featured</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredQuizzes.slice(0, 4).map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * index }}
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
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">
                  {filteredQuizzes.length >= 4 ? "All Quizzes" : "Recent Quizzes"}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(filteredQuizzes.length >= 4 ? filteredQuizzes.slice(4) : filteredQuizzes).map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.02 * Math.min(index, 12) }}
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
