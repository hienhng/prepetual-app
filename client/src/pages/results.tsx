import { useLocation } from "wouter";
import { QuizResults } from "@/components/quiz-results";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function Results() {
  const [, setLocation] = useLocation();
  const { quizResult } = useQuiz();
  const { user } = useAuth();
  const quizResultRef = useRef(quizResult);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    quizResultRef.current = quizResult;
  }, [quizResult]);

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
    </div>
  );
}
