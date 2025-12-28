import { useLocation } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizPlayer } from "@/components/quiz-player";
import { useQuiz } from "@/lib/quiz-context";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const { currentQuiz } = useQuiz();

  useEffect(() => {
    if (!currentQuiz) {
      setLocation("/create");
    }
  }, [currentQuiz, setLocation]);

  if (!currentQuiz) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="gap-2"
            data-testid="button-back-generate"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-sm" data-testid="text-quiz-title">
              {currentQuiz.title}
            </span>
          </div>
        </motion.div>

        <QuizPlayer />
      </div>
    </div>
  );
}
