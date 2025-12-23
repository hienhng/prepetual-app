import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Play, Clock, FileText, Loader2, 
  Users, BookOpen, Sparkles, ThumbsUp, ThumbsDown,
  MessageSquare, ChevronDown, ChevronUp, Send, Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/use-auth";
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
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function QuizCard({ quiz }: { quiz: PublicQuiz }) {
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

  const getDifficultyColor = (difficulty?: string | null) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "hard": return "bg-red-500/10 text-red-600 dark:text-red-400";
      default: return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
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
  const commentCount = comments?.length || 0;

  return (
    <Card className="overflow-visible" data-testid={`card-public-quiz-${quiz.id}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold line-clamp-2 mb-2">
                {quiz.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {(quiz.questions as any[]).length} questions
                </Badge>
                {quiz.difficulty && (
                  <Badge className={`text-xs ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7">
                <AvatarImage src={quiz.author?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {getAuthorInitials(quiz.author)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <span className="text-foreground font-medium">
                  {getAuthorName(quiz.author)}
                </span>
                <span className="text-muted-foreground mx-1.5">·</span>
                <span className="text-muted-foreground text-xs">
                  {formatRelativeDate(quiz.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStudyQuiz}
                data-testid={`button-study-${quiz.id}`}
              >
                <BookOpen className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Study</span>
              </Button>
              <Button
                size="sm"
                onClick={handleTakeQuiz}
                data-testid={`button-take-${quiz.id}`}
              >
                <Play className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Take Quiz</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVote(1)}
                disabled={!user || voteMutation.isPending}
                className={votes?.userVote === 1 ? "text-green-500" : ""}
                data-testid={`button-upvote-${quiz.id}`}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <span className={`text-sm font-medium min-w-[2ch] text-center ${
                voteScore > 0 ? "text-green-500" : voteScore < 0 ? "text-red-500" : "text-muted-foreground"
              }`}>
                {voteScore}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVote(-1)}
                disabled={!user || voteMutation.isPending}
                className={votes?.userVote === -1 ? "text-red-500" : ""}
                data-testid={`button-downvote-${quiz.id}`}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-1.5"
              data-testid={`button-comments-${quiz.id}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{showComments && comments ? comments.length : "Comments"}</span>
              {showComments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t space-y-4">
                  {user && (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[60px] resize-none"
                        data-testid={`input-comment-${quiz.id}`}
                      />
                      <Button
                        size="icon"
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        data-testid={`button-submit-comment-${quiz.id}`}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {!user && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Sign in to leave a comment
                    </p>
                  )}

                  {commentsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : comments && comments.length > 0 ? (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2.5" data-testid={`comment-${comment.id}`}>
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={comment.author?.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getAuthorInitials(comment.author)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
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
                                  className="h-6 w-6 ml-auto"
                                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                                  disabled={deleteCommentMutation.isPending}
                                  data-testid={`button-delete-comment-${comment.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No comments yet
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Feed() {
  const [, setLocation] = useLocation();

  const { data: quizzes, isLoading } = useQuery<PublicQuiz[]>({
    queryKey: ["/api/public-quizzes"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Community Feed</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Discover and take quizzes shared by others
            </p>
          </div>
        </motion.div>

        {!quizzes || quizzes.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No shared quizzes yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share a quiz with the community!
                </p>
                <Button onClick={() => setLocation("/create")} data-testid="button-create-quiz">
                  Create a Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                variants={itemVariants}
                custom={index}
              >
                <QuizCard quiz={quiz} />
              </motion.div>
            ))}
          </div>
        )}

        {quizzes && quizzes.length > 0 && (
          <motion.p 
            variants={itemVariants}
            className="text-center text-sm text-muted-foreground pt-4"
          >
            <Sparkles className="h-4 w-4 inline mr-1" />
            {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} shared by the community
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
