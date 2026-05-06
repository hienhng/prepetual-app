import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2, XCircle, Clock, Loader2, ChevronDown, Sparkles,
  History, Star, Search, X, Filter
} from "lucide-react";

import { getCategoryIcon, getCategoryTranslationKey } from "@/lib/category-icons";
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
import { useQuiz } from "@/lib/quiz-context";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";
import { apiRequest } from "@/lib/queryClient";

interface ResultHistoryItem {
  date: string;
  accuracy: number;
  quizTitle: string;
  correctAnswers: number;
  totalQuestions: number;
  category: string;
  quizId: string;
}

interface GroupedQuiz {
  quizId: string;
  quizTitle: string;
  category: string;
  attempts: ResultHistoryItem[];
  bestAccuracy: number;
  avgAccuracy: number;
  lastAttemptDate: string;
}

const categoryGradients: Record<string, string> = {
  "Math": "bg-gradient-to-br from-blue-500 to-blue-600",
  "English": "bg-gradient-to-br from-violet-500 to-violet-600",
  "Science": "bg-gradient-to-br from-emerald-500 to-emerald-600",
  "Social Studies": "bg-gradient-to-br from-orange-500 to-orange-600",
  "Global Languages": "bg-gradient-to-br from-pink-500 to-pink-600",
  "Others/General": "bg-gradient-to-br from-slate-500 to-slate-600",
};

function QuizAttemptGroup({ group, index }: { group: GroupedQuiz; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [, setLocation] = useLocation();
  const { setCurrentQuiz } = useQuiz();
  const { toast } = useToast();
  const { t } = useLanguage();

  const Icon = getCategoryIcon(group.category);
  const gradient = categoryGradients[group.category] || categoryGradients["Others/General"];
  const hasMultipleAttempts = group.attempts.length > 1;
  const singleAttempt = !hasMultipleAttempts ? group.attempts[0] : null;

  const handleSmartReview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingReview(true);
    try {
      const response = await apiRequest("POST", `/api/quiz/${group.quizId}/smart-review`);
      const reviewQuiz = await response.json();
      setCurrentQuiz(reviewQuiz);
      toast({
        title: t('results.smartReviewGenerated'),
        description: t('results.smartReviewGeneratedDesc'),
      });
      setLocation("/quiz");
    } catch (error) {
      toast({
        title: t('results.reviewFailed'),
        description: t('results.reviewFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReview(false);
    }
  };

  const headerContent = (
    <>
      <div className="flex items-center justify-center flex-shrink-0">
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold truncate text-foreground">{group.quizTitle}</p>
          {group.attempts.length >= 5 && (
            <Badge variant="outline" className="h-5 px-1.5 py-0 text-primary bg-primary/5 border-primary/20">
              <History className="w-2.5 h-2.5 mr-1" />
              {t('results.revisionAvailable')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground/70 mt-0.5 flex-wrap">
          <span className="text-primary/70">{t(getCategoryTranslationKey(group.category))}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
          {singleAttempt ? (
            <>
              <span>{format(parseISO(singleAttempt.date), "MMM d, yyyy", { locale: t('common.locale') === 'vi-VN' ? undefined : undefined })}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
              <span>{t('results.correctCount', { correct: singleAttempt.correctAnswers, total: singleAttempt.totalQuestions })}</span>
            </>
          ) : (
            <>
              <span>{t('results.attemptsCount', { count: group.attempts.length })}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
              <span>{t('results.best', { score: group.bestAccuracy })}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {group.attempts.length >= 5 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-xs font-bold gap-1.5 hover:bg-primary/10 hover:text-primary rounded-lg hidden sm:flex"
            onClick={handleSmartReview}
            disabled={isGeneratingReview}
          >
            {isGeneratingReview ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <History className="w-3.5 h-3.5" />
            )}
            {t('results.revise')}
          </Button>
        )}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className={`text-lg font-black ${group.bestAccuracy >= 80 ? "text-emerald-500" :
              group.bestAccuracy >= 60 ? "text-amber-500" : "text-rose-500"
              }`}>
              {group.bestAccuracy}%
            </span>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50 leading-none">{t('results.bestLabel')}</p>
          </div>
          {hasMultipleAttempts && (
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="p-1 rounded-md hover:bg-muted"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.3 }}
      className="mb-3"
    >
      <div className="rounded-xl border border-border/40 bg-card hover:border-primary/20 transition-all duration-200 overflow-hidden shadow-sm">
        {hasMultipleAttempts ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex gap-4 p-4 items-center text-left cursor-pointer transition-colors"
          >
            {headerContent}
          </button>
        ) : (
          <div className="flex gap-4 p-4 items-center">
            {headerContent}
          </div>
        )}

        <AnimatePresence initial={false}>
          {isOpen && hasMultipleAttempts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2 bg-muted/30">
                <div className="border-t border-border/40 pt-3 mb-2" />
                {group.attempts.map((attempt, attemptIndex) => (
                  <div
                    key={attemptIndex}
                    className="flex items-center gap-4 py-2.5 px-4 rounded-xl bg-background border border-border/40 shadow-sm"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-[11px] font-black text-muted-foreground flex-shrink-0">
                      {group.attempts.length - attemptIndex}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80 flex-wrap">
                        <span>{format(parseISO(attempt.date), "MMM d, yyyy 'at' h:mm a", { locale: t('common.locale') === 'vi-VN' ? undefined : undefined })}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                        <span>{t('results.correctCount', { correct: attempt.correctAnswers, total: attempt.totalQuestions })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-black ${attempt.accuracy >= 80 ? "text-emerald-500" :
                        attempt.accuracy >= 60 ? "text-amber-500" : "text-rose-500"
                        }`}>
                        {attempt.accuracy}%
                      </span>
                      {attempt.accuracy >= 80 ? (
                        <Star className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                      ) : attempt.accuracy >= 60 ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export default function ResultsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { t } = useLanguage();

  const { data: history = [], isLoading } = useQuery<ResultHistoryItem[]>({
    queryKey: ["/api/user/result-history"],
  });

  const groupedQuizzes = useMemo((): GroupedQuiz[] => {
    const groups: Record<string, ResultHistoryItem[]> = {};
    history.forEach(item => {
      if (!groups[item.quizId]) {
        groups[item.quizId] = [];
      }
      groups[item.quizId].push(item);
    });

    return Object.entries(groups)
      .map(([quizId, attempts]) => {
        const sorted = [...attempts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const accuracies = sorted.map(a => a.accuracy);
        return {
          quizId,
          quizTitle: sorted[0].quizTitle,
          category: sorted[0].category,
          attempts: sorted,
          bestAccuracy: Math.max(...accuracies),
          avgAccuracy: Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
          lastAttemptDate: sorted[0].date,
        };
      })
      .sort((a, b) => new Date(b.lastAttemptDate).getTime() - new Date(a.lastAttemptDate).getTime());
  }, [history]);

  const filteredQuizzes = useMemo(() => {
    return groupedQuizzes.filter(quiz => {
      const matchesSearch = quiz.quizTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === "all" || quiz.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [groupedQuizzes, searchQuery, selectedCategory]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(groupedQuizzes.map(q => q.category))).sort();
  }, [groupedQuizzes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <span className="ml-2 text-muted-foreground">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <section>
          <div className="flex items-end justify-between gap-4 flex-wrap mb-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('results.title')}</h1>
              <p className="text-muted-foreground mt-1">{t('results.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted/30 px-3 py-1.5 rounded-full border border-border/40">
              <History className="w-4 h-4" />
              {t('results.totalAttempts', { count: history.length })}
            </div>
          </div>
        </section>

        {history.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('results.noResultsYet')}</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">{t('results.noResultsYetDesc')}</p>
              <Button size="lg" className="font-bold rounded-full px-8 shadow-lg shadow-primary/20" onClick={() => window.location.href = "/create"}>
                {t('results.createQuiz')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('results.searchPlaceholder')}
                  className="pl-11 h-12 bg-muted/20 border-border/50 focus:bg-background transition-all rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {availableCategories.length > 0 && (
                <Select
                  value={selectedCategory || "all"}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-[200px] h-12 bg-muted/20 border-border/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder={t('history.allSubjects')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('history.allSubjects')}</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{t(getCategoryTranslationKey(cat))}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              {filteredQuizzes.length === 0 ? (
                <div className="py-20 text-center bg-muted/10 rounded-2xl border border-dashed border-border">
                  <p className="text-muted-foreground font-medium">{t('results.noResultsMatching')}</p>
                  <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}>
                    {t('history.clearFilters')}
                  </Button>
                </div>
              ) : (
                filteredQuizzes.map((group, index) => (
                  <QuizAttemptGroup key={group.quizId} group={group} index={index} />
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
