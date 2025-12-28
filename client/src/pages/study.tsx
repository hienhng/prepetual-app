import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, RotateCcw, ChevronLeft, ChevronRight, Check, X, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuiz } from "@/lib/quiz-context";
import type { Question } from "@shared/schema";

export default function StudyPage() {
  const [, setLocation] = useLocation();
  const { currentQuiz } = useQuiz();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [studyingCards, setStudyingCards] = useState<Set<number>>(new Set());

  if (!currentQuiz) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No quiz selected</h2>
        <p className="text-muted-foreground mb-4">Select a quiz from your history to study</p>
        <Link href="/history">
          <Button data-testid="button-go-history">Go to History</Button>
        </Link>
      </div>
    );
  }

  const questions = currentQuiz.questions as Question[];
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 150);
    }
  };

  const handleKnown = () => {
    const newKnown = new Set(knownCards);
    newKnown.add(currentIndex);
    setKnownCards(newKnown);
    
    const newStudying = new Set(studyingCards);
    newStudying.delete(currentIndex);
    setStudyingCards(newStudying);
    handleNext();
  };

  const handleStillLearning = () => {
    const newStudying = new Set(studyingCards);
    newStudying.add(currentIndex);
    setStudyingCards(newStudying);
    
    const newKnown = new Set(knownCards);
    newKnown.delete(currentIndex);
    setKnownCards(newKnown);
    handleNext();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setStudyingCards(new Set());
  };

  const getAnswerDisplay = (q: Question) => {
    if (q.type === "multiple_choice") {
      return q.correctAnswer;
    }
    return q.correctAnswer;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">{currentQuiz.title}</h1>
            <p className="text-sm text-muted-foreground">Study Mode</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleReset} data-testid="button-reset">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Link href="/dashboard">
              <Button size="sm" variant="outline" data-testid="button-back-history">
                <Home className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Card {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex gap-4">
              <span className="text-green-600">
                <Check className="h-4 w-4 inline mr-1" />
                {knownCards.size} known
              </span>
              <span className="text-yellow-600">
                <RotateCcw className="h-4 w-4 inline mr-1" />
                {studyingCards.size} learning
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div 
          className="perspective-1000 cursor-pointer"
          onClick={handleFlip}
          data-testid="flashcard-container"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${isFlipped}`}
              initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Card className="min-h-[300px] flex items-center justify-center">
                <CardContent className="p-8 text-center">
                  {!isFlipped ? (
                    <div className="space-y-4">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Question
                      </span>
                      <p className="text-lg font-medium">{currentQuestion.question}</p>
                      {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                        <div className="mt-4 space-y-2 text-left">
                          {currentQuestion.options.map((opt, i) => (
                            <div key={i} className="p-2 bg-muted/50 rounded-md text-sm">
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-4">
                        Click to reveal answer
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <span className="text-xs uppercase tracking-wide text-primary">
                        Answer
                      </span>
                      <p className="text-lg font-semibold text-primary">
                        {getAnswerDisplay(currentQuestion)}
                      </p>
                      {currentQuestion.explanation && (
                        <p className="text-sm text-muted-foreground mt-4">
                          {currentQuestion.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            className="sm:w-auto sm:px-3"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            data-testid="button-prev-card"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          {isFlipped && (
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950 px-2 sm:px-3"
                onClick={handleStillLearning}
                data-testid="button-still-learning"
              >
                <RotateCcw className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Still Learning</span>
                <span className="sm:hidden">Learning</span>
              </Button>
              <Button
                size="sm"
                className="bg-green-600 border-green-800 hover:bg-green-700 hover:border-green-500 px-2 sm:px-3"
                onClick={handleKnown}
                data-testid="button-known"
              >
                <Check className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Got It</span>
                <span className="sm:hidden">Got It</span>
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            className="sm:w-auto sm:px-3"
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            data-testid="button-next-card"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>

        {currentIndex === questions.length - 1 && isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-6 bg-muted rounded-lg"
          >
            <h3 className="text-lg font-semibold mb-2">Study Session Complete!</h3>
            <p className="text-muted-foreground mb-4">
              You marked {knownCards.size} cards as known and {studyingCards.size} as still learning.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleReset} data-testid="button-study-again">
                Study Again
              </Button>
              <Link href="/history">
                <Button data-testid="button-finish-study">Finish</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
