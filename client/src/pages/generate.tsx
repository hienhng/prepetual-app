import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizGenerator } from "@/components/quiz-generator";
import { useQuiz } from "@/lib/quiz-context";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function Generate() {
  const [, setLocation] = useLocation();
  const { extractedText } = useQuiz();

  useEffect(() => {
    if (!extractedText) {
      setLocation("/create");
    }
  }, [extractedText, setLocation]);

  if (!extractedText) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => setLocation("/create")}
            className="gap-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Generate Your Quiz
          </h1>
          <p className="text-muted-foreground">
            Customize your quiz settings and let AI create the perfect study material
          </p>
        </motion.div>

        <QuizGenerator />
      </div>
    </div>
  );
}
