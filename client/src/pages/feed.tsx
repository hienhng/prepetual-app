import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Search, Play, Loader2, Users, BookOpen, 
  Sparkles, Clock, Filter, Target, Zap, 
  GraduationCap, Beaker, Calculator, Globe2, 
  Palette, Music, Code, Heart, Dumbbell, Languages, Archive
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useQuiz } from "@/lib/quiz-context";
import type { Quiz } from "@shared/schema";

type PublicQuiz = Quiz & { 
  author?: { 
    firstName: string | null; 
    lastName: string | null; 
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

// const categories = [
//   { id: "all", label: "All", icon: Sparkles },
//   { id: "science", label: "Science", icon: Beaker },
//   { id: "math", label: "Math", icon: Calculator },
//   { id: "languages", label: "Languages", icon: Languages },
//   { id: "history", label: "History", icon: Globe2 },
//   { id: "arts", label: "Arts", icon: Palette },
//   { id: "tech", label: "Technology", icon: Code },
//   { id: "health", label: "Health", icon: Heart },
//   { id: "sports", label: "Sports", icon: Dumbbell },
//   { id: "music", label: "Music", icon: Music },
// ];

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
  const [isHovered, setIsHovered] = useState(false);

  const handleTakeQuiz = () => {
    setCurrentQuiz({
      ...quiz,
      createdAt: typeof quiz.createdAt === "string" ? quiz.createdAt : quiz.createdAt.toISOString(),
    } as any);
    setSourceMaterial({
      type: quiz.sourceImageUrl ? "image" : null,
      text: quiz.sourceText,
      imageDataUrl: quiz.sourceImageUrl || null,
    });
    setLocation("/quiz");
  };

  const handleStudyQuiz = () => {
    setCurrentQuiz({
      ...quiz,
      createdAt: typeof quiz.createdAt === "string" ? quiz.createdAt : quiz.createdAt.toISOString(),
    } as any);
    setSourceMaterial({
      type: quiz.sourceImageUrl ? "image" : null,
      text: quiz.sourceText,
      imageDataUrl: quiz.sourceImageUrl || null,
    });
    setLocation("/study");
  };

  const getAuthorName = (author?: PublicQuiz["author"]) => {
    if (!author) return "Anonymous";
    const firstName = author.firstName || "";
    const lastName = author.lastName || "";
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return "Anonymous";
  };

  const getAuthorInitials = (author?: PublicQuiz["author"]) => {
    if (!author) return "A";
    const first = author.firstName?.[0] || "";
    const last = author.lastName?.[0] || "";
    return (first + last).toUpperCase() || "A";
  };

  const getDifficultyConfig = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return { label: "Easy", color: "text-emerald-300" };
      case "hard": return { label: "Hard", color: "text-rose-300" };
      default: return { label: "Medium", color: "text-amber-300" };
    }
  };

  const diffConfig = getDifficultyConfig(quiz.difficulty);
  const gradient = getGradientForQuiz(quiz.id);
  const questionCount = (quiz.questions as any[]).length;

  return (
    <motion.div
      variants={itemVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Card 
        className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
        /* onClick={handleTakeQuiz} */
        data-testid={`card-quiz-${quiz.id}`}
      >
        <div className={`relative h-36 sm:h-40 bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-2 left-2 w-16 h-16 rounded-full bg-white/10 blur-lg" />
          </div>
          
          <div className="relative flex items-start justify-between gap-2">
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs font-medium"
            >
              {questionCount} {questionCount === 1 ? "question" : "questions"}
            </Badge>
            <span className={`text-xs font-medium ${diffConfig.color}`}>
              {diffConfig.label}
            </span>
          </div>

          <div className="relative">
            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-sm">
              {quiz.title}
            </h3>
          </div>

          <motion.div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              size="lg"
              variant ="outline"
              className="gap-4 bg-white/90 text-gray-900 hover:bg-white hover:-translate-y-1 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                handleStudyQuiz();
              }}
              data-testid={`button-study-${quiz.id}`}
            >
              <BookOpen className="h-4 w-4" />
              
            </Button>
            <Button 
              size="lg"
              className="gap-4 bg-primary text-gray-900 hover:bg-primary/90 hover:-translate-y-1 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                handleTakeQuiz();
              }}
              data-testid={`button-play-${quiz.id}`}
            >
              <Play className="h-4 w-4 " />
              
            </Button>
          </motion.div>
        </div>

        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
              <AvatarFallback className="text-[10px] bg-muted">
                {getAuthorInitials(quiz.author)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {getAuthorName(quiz.author)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Feed() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: quizzes, isLoading } = useQuery<PublicQuiz[]>({
    queryKey: ["/api/public-quizzes"],
  });

  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return [];
    
    return quizzes.filter(quiz => {
      const matchesSearch = searchQuery === "" || 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.sourceText.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quizzes, searchQuery]);

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
            {/* {categories.slice(0, 6).map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`gap-2 ${isActive ? "" : "bg-background/50 backdrop-blur-sm"}`}
                  data-testid={`button-category-${category.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </Button>
              );
            })} */}
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

        {filteredQuizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No quizzes found</h3>
                <p className="text-muted-foreground mb-6">
                  Try a different search term or browse all quizzes
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
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
