import { useLocation } from "wouter";
import { QuizResults } from "@/components/quiz-results";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles, Brain } from "lucide-react";

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

export default function Results() {
  const [, setLocation] = useLocation();
  const { quizResult, revisedQuestionsCount } = useQuiz();
  const { user } = useAuth();
  const quizResultRef = useRef(quizResult);
  const mountTimeRef = useRef(Date.now());
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [weeklyRevisionCount, setWeeklyRevisionCount] = useState(0);
  const hasTrackedRevisions = useRef(false);

  useEffect(() => {
    quizResultRef.current = quizResult;
  }, [quizResult]);

  useEffect(() => {
    if (revisedQuestionsCount > 0 && !hasTrackedRevisions.current) {
      hasTrackedRevisions.current = true;
      const newTotal = addWeeklyRevisions(revisedQuestionsCount);
      setWeeklyRevisionCount(newTotal);
      
      if (newTotal > 5) {
        setTimeout(() => {
          setShowRevisionDialog(true);
        }, 4000);
      }
    }
  }, [revisedQuestionsCount]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!quizResultRef.current) {
        setLocation(user ? "/dashboard" : "/");
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [setLocation, user]);

  useEffect(() => {
    if (!quizResult && Date.now() - mountTimeRef.current > 200) {
      setLocation(user ? "/dashboard" : "/");
    }
  }, [quizResult, setLocation, user]);

  if (!quizResult) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Quiz Complete!
          </h1>
          <p className="text-muted-foreground">
            See how you did and review your answers
          </p>
        </motion.div>

        <QuizResults />
      </div>

      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Brain className="h-8 w-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              <Sparkles className="h-5 w-5 inline-block mr-2 text-yellow-500" />
              You're Building Strong Memories!
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              You've revised <span className="font-bold text-foreground">{weeklyRevisionCount} questions</span> this week through our spaced repetition system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <RotateCcw className="h-5 w-5 text-purple-500 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Why does this matter?</p>
                  <p>
                    Reviewing mistakes right away helps move information from short-term to long-term memory. Keep it up!
                  </p>
                </div>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => setShowRevisionDialog(false)}
              data-testid="button-close-revision-dialog"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
