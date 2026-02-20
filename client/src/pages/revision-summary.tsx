import { useLocation } from "wouter";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Check, ArrowRight, Sparkles } from "lucide-react";

const WEEKLY_REVISIONS_KEY = "prepetual_weekly_revisions";

interface WeeklyRevisions {
  count: number;
  weekStart: string;
}

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().split('T')[0];
}

function getWeeklyRevisions(): WeeklyRevisions {
  try {
    const stored = localStorage.getItem(WEEKLY_REVISIONS_KEY);
    if (stored) {
      const data = JSON.parse(stored) as WeeklyRevisions;
      const currentWeekStart = getWeekStart();
      if (data.weekStart === currentWeekStart) {
        return data;
      }
    }
  } catch (e) {
    console.error("Error reading weekly revisions:", e);
  }
  return { count: 0, weekStart: getWeekStart() };
}

function addWeeklyRevisions(count: number): number {
  const current = getWeeklyRevisions();
  const newCount = current.count + count;
  const data: WeeklyRevisions = {
    count: newCount,
    weekStart: getWeekStart(),
  };
  localStorage.setItem(WEEKLY_REVISIONS_KEY, JSON.stringify(data));
  return newCount;
}

export default function RevisionSummary() {
  const [, setLocation] = useLocation();
  const { quizResult, revisedQuestionsCount, retryCorrectCount } = useQuiz();
  const { user } = useAuth();
  const [weeklyRevisionCount, setWeeklyRevisionCount] = useState(0);
  const hasTrackedRevisions = useRef(false);

  useEffect(() => {
    if (revisedQuestionsCount > 0 && !hasTrackedRevisions.current) {
      hasTrackedRevisions.current = true;
      const newTotal = addWeeklyRevisions(revisedQuestionsCount);
      setWeeklyRevisionCount(newTotal);
    } else if (!hasTrackedRevisions.current) {
      setWeeklyRevisionCount(getWeeklyRevisions().count);
    }
  }, [revisedQuestionsCount]);

  useEffect(() => {
    if (!quizResult) {
      setLocation(user ? "/dashboard" : "/");
    }
  }, [quizResult, setLocation, user]);

  if (!quizResult) {
    return null;
  }

  const totalCorrectWithRetries = quizResult.correctAnswers + retryCorrectCount;

  const handleContinue = () => {
    setLocation(user ? "/dashboard" : "/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-8"
        >
          <Brain className="h-12 w-12 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            <Sparkles className="h-8 w-8 inline-block mr-2 text-yellow-500" />
            Great Practice!
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            You're building stronger memories
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6 mb-10"
        >
          <div className="bg-card rounded-xl p-6 border">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-4xl font-bold text-foreground">{totalCorrectWithRetries}</span>
            </div>
            <p className="text-muted-foreground">
              questions mastered
              {retryCorrectCount > 0 && (
                <span className="block text-sm mt-1">
                  (including {retryCorrectCount} on your 2nd try)
                </span>
              )}
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl p-6 border border-purple-500/20">
            <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500 mb-2">
              {weeklyRevisionCount}
            </p>
            <p className="text-muted-foreground">
              questions revised this week
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Reviewing mistakes right away helps lock information into your long-term memory. Keep it up!
          </p>
          <Button 
            size="lg" 
            onClick={handleContinue}
            className="gap-2 px-8"
            data-testid="button-continue-revision"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
