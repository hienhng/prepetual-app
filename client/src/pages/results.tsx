import { useLocation } from "wouter";
import { QuizResults } from "@/components/quiz-results";
import { useQuiz } from "@/lib/quiz-context";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function Results() {
  const [, setLocation] = useLocation();
  const { quizResult } = useQuiz();

  useEffect(() => {
    if (!quizResult) {
      setLocation("/");
    }
  }, [quizResult, setLocation]);

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
    </div>
  );
}
