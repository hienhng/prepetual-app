import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Play, Loader2, Users, BookOpen, Sparkles, 
  ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, 
  ChevronUp, Send, Trash2, TrendingUp, Clock, Filter,
  Award, Flame, Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Quiz, QuizComment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

type PublicQuiz = Quiz & { 
  author?: { 
    firstName: string | null; 
    lastName: string | null; 
    profileImageUrl: string | null;
  } 
};

type CommentWithAuthor = QuizComment & {
  author: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
};

type VoteData = {
  upvotes: number;
  downvotes: number;
  userVote: number | null;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function QuizCard({ quiz, rank }: { quiz: PublicQuiz; rank?: number }) {
  const [, setLocation] = useLocation();
  const { setCurrentQuiz, setSourceMaterial } = useQuiz();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const { data: votes } = useQuery<VoteData>({
    queryKey: ["/api/quiz", quiz.id, "votes"],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/${quiz.id}/votes`);
      return res.json();
    },
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/quiz", quiz.id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/${quiz.id}/comments`);
      return res.json();
    },
    enabled: showComments,
  });

  const voteMutation = useMutation({
    mutationFn: async (voteType: number) => {
      const res = await apiRequest("POST", `/api/quiz/${quiz.id}/vote`, { voteType });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz", quiz.id, "votes"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/quiz/${quiz.id}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/quiz", quiz.id, "comments"] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiRequest("DELETE", `/api/comments/${commentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz", quiz.id, "comments"] });
    },
  });

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

  const getAuthorInitials = (author?: PublicQuiz["author"] | CommentWithAuthor["author"]) => {
    if (!author) return "A";
    const first = author.firstName?.[0] || "";
    const last = author.lastName?.[0] || "";
    return (first + last).toUpperCase() || "A";
  };

  const getDifficultyConfig = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", label: "Easy" };
      case "hard": return { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", label: "Hard" };
      default: return { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "Medium" };
    }
  };

  const formatRelativeDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  };

  const handleVote = (voteType: number) => {
    if (!user) return;
    voteMutation.mutate(voteType);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user) return;
    addCommentMutation.mutate(newComment.trim());
  };

  const voteScore = (votes?.upvotes || 0) - (votes?.downvotes || 0);
  const diffConfig = getDifficultyConfig(quiz.difficulty);

  return (
    <Card className="group overflow-visible border-border/50 hover:border-border transition-colors" data-testid={`card-public-quiz-${quiz.id}`}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Vote Column */}
          <div className="flex flex-col items-center py-4 px-3 bg-muted/30 rounded-l-lg border-r border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote(1)}
              disabled={!user || voteMutation.isPending}
              className={`h-8 w-8 ${votes?.userVote === 1 ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
              data-testid={`button-upvote-${quiz.id}`}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className={`text-sm font-bold py-1 min-w-[2ch] text-center ${
              voteScore > 0 ? "text-primary" : voteScore < 0 ? "text-destructive" : "text-muted-foreground"
            }`}>
              {voteScore}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote(-1)}
              disabled={!user || voteMutation.isPending}
              className={`h-8 w-8 ${votes?.userVote === -1 ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive"}`}
              data-testid={`button-downvote-${quiz.id}`}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-9 w-9 ring-2 ring-background">
                <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getAuthorInitials(quiz.author)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {getAuthorName(quiz.author)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeDate(quiz.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {(quiz.questions as any[]).length} questions
                  </Badge>
                  <Badge className={`text-xs font-normal border-0 ${diffConfig.bg} ${diffConfig.text}`}>
                    {diffConfig.label}
                  </Badge>
                </div>
              </div>
              {rank && rank <= 3 && (
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  rank === 1 ? "bg-amber-500/20 text-amber-500" :
                  rank === 2 ? "bg-slate-400/20 text-slate-400" :
                  "bg-orange-600/20 text-orange-600"
                }`}>
                  <Award className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold mb-4 group-hover:text-primary transition-colors">
              {quiz.title}
            </h3>

            {/* Actions Row */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="gap-2 text-muted-foreground hover:text-foreground"
                data-testid={`button-comments-${quiz.id}`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{showComments && comments ? comments.length : "Discuss"}</span>
                {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleStudyQuiz}
                  className="gap-2"
                  data-testid={`button-study-${quiz.id}`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Study</span>
                </Button>
                <Button
                  onClick={handleTakeQuiz}
                  className="gap-2"
                  data-testid={`button-take-${quiz.id}`}
                >
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Take Quiz</span>
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-border/50 space-y-4">
                    {user && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {user.firstName?.[0] || user.email?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Textarea
                            placeholder="Share your thoughts..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[80px] resize-none bg-muted/50"
                            data-testid={`input-comment-${quiz.id}`}
                          />
                          <Button
                            size="icon"
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || addCommentMutation.isPending}
                            className="h-10 w-10 flex-shrink-0"
                            data-testid={`button-submit-comment-${quiz.id}`}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {!user && (
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Sign in to join the discussion
                        </p>
                      </div>
                    )}

                    {commentsLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : comments && comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                            <Avatar className="h-7 w-7 flex-shrink-0">
                              <AvatarImage src={comment.author?.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getAuthorInitials(comment.author)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 bg-muted/30 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {getAuthorName(comment.author as any)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeDate(comment.createdAt)}
                                </span>
                                {user && comment.userId === user.id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive"
                                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                                    disabled={deleteCommentMutation.isPending}
                                    data-testid={`button-delete-comment-${comment.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No comments yet. Be the first to share your thoughts!
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Feed() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");

  const { data: quizzes, isLoading } = useQuery<PublicQuiz[]>({
    queryKey: ["/api/public-quizzes"],
  });

  const sortedQuizzes = quizzes ? [...quizzes].sort((a, b) => {
    if (sortBy === "popular") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) : [];

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container relative mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              Community Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Discover & Learn Together
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore quizzes shared by the community. Study, test yourself, and join the discussion.
            </p>
          </motion.div>

          {/* Stats */}
          {quizzes && quizzes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-center gap-6 sm:gap-10 mt-8"
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{quizzes.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Quizzes</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {quizzes.reduce((acc, q) => acc + (q.questions as any[]).length, 0)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {new Set(quizzes.map(q => q.userId)).size}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Contributors</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Sort Tabs */}
        {quizzes && quizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="newest" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Newest
                </TabsTrigger>
                <TabsTrigger value="popular" className="gap-2">
                  <Flame className="h-4 w-4" />
                  Popular
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
        )}

        {!quizzes || quizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No shared quizzes yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Be the first to share your knowledge with the community and help others learn!
                </p>
                <Button onClick={() => setLocation("/create")} className="gap-2" data-testid="button-create-quiz">
                  <Zap className="h-4 w-4" />
                  Create & Share a Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {sortedQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                variants={itemVariants}
              >
                <QuizCard quiz={quiz} rank={sortBy === "popular" ? index + 1 : undefined} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {quizzes && quizzes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-10 pt-6 border-t"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Want to contribute? Share your own quiz with the community!
            </p>
            <Button variant="outline" onClick={() => setLocation("/create")} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Create a Quiz
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
