import { useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { BookOpen, RotateCcw, Check, X, Home, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const leftIndicatorOpacity = useTransform(x, [-200, -50, 0], [1, 0.5, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 50, 200], [0, 0.5, 1]);

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

  const handleFlip = () => {
    if (!isDragging) {
      setIsFlipped(!isFlipped);
    }
  };

  const goToNext = useCallback((direction: "left" | "right") => {
    if (currentIndex < questions.length - 1) {
      setExitDirection(direction);
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setExitDirection(null);
        x.set(0);
      }, 200);
    }
  }, [currentIndex, questions.length, x]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setExitDirection("right");
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setExitDirection(null);
        x.set(0);
      }, 200);
    }
  };

  const handleKnown = useCallback(() => {
    const newKnown = new Set(knownCards);
    newKnown.add(currentIndex);
    setKnownCards(newKnown);
    
    const newStudying = new Set(studyingCards);
    newStudying.delete(currentIndex);
    setStudyingCards(newStudying);
    goToNext("right");
  }, [currentIndex, knownCards, studyingCards, goToNext]);

  const handleStillLearning = useCallback(() => {
    const newStudying = new Set(studyingCards);
    newStudying.add(currentIndex);
    setStudyingCards(newStudying);
    
    const newKnown = new Set(knownCards);
    newKnown.delete(currentIndex);
    setKnownCards(newKnown);
    goToNext("left");
  }, [currentIndex, knownCards, studyingCards, goToNext]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100;
    
    if (info.offset.x > threshold && isFlipped) {
      handleKnown();
    } else if (info.offset.x < -threshold && isFlipped) {
      handleStillLearning();
    } else if (Math.abs(info.offset.x) > threshold && !isFlipped) {
      if (info.offset.x > 0 && currentIndex > 0) {
        handlePrev();
      } else if (info.offset.x < 0 && currentIndex < questions.length - 1) {
        goToNext("left");
      }
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setStudyingCards(new Set());
    setExitDirection(null);
    x.set(0);
  };

  const getAnswerDisplay = (q: Question) => {
    if (q.type === "multiple_choice") {
      return q.correctAnswer;
    }
    return q.correctAnswer;
  };

  const cardVariants = {
    enter: (direction: "left" | "right" | null) => ({
      x: direction === "left" ? 300 : direction === "right" ? -300 : 0,
      opacity: 0,
      scale: 0.8,
      rotateY: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: "left" | "right" | null) => ({
      x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
      opacity: 0,
      scale: 0.8,
      rotate: direction === "left" ? -15 : direction === "right" ? 15 : 0,
    }),
  };

  const isLastCard = currentIndex === questions.length - 1;

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

        <div className="relative h-[380px] touch-none">
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4 z-10">
            <motion.div 
              style={{ opacity: leftIndicatorOpacity }}
              className="bg-yellow-500/90 text-white px-4 py-2 rounded-full font-semibold shadow-lg"
            >
              <RotateCcw className="h-5 w-5 inline mr-1" />
              Learning
            </motion.div>
            <motion.div 
              style={{ opacity: rightIndicatorOpacity }}
              className="bg-green-500/90 text-white px-4 py-2 rounded-full font-semibold shadow-lg"
            >
              Got It
              <Check className="h-5 w-5 inline ml-1" />
            </motion.div>
          </div>

          <AnimatePresence mode="wait" custom={exitDirection}>
            <motion.div
              key={currentIndex}
              custom={exitDirection}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              style={{ x, rotate }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              data-testid="flashcard-container"
            >
              <div 
                className="h-full perspective-1000"
                onClick={handleFlip}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="h-full relative"
                >
                  <Card className="absolute inset-0 backface-hidden">
                    <CardContent className="h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground mb-4">
                        Question
                      </span>
                      <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>
                      {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                        <div className="w-full space-y-2 text-left">
                          {currentQuestion.options.map((opt, i) => (
                            <div key={i} className="p-2 bg-muted/50 rounded-md text-sm">
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-4">
                        Tap to reveal answer
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="absolute inset-0 backface-hidden"
                    style={{ transform: "rotateY(180deg)" }}
                  >
                    <CardContent className="h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                      <span className="text-xs uppercase tracking-wide text-primary mb-4">
                        Answer
                      </span>
                      <p className="text-lg font-semibold text-primary mb-4">
                        {getAnswerDisplay(currentQuestion)}
                      </p>
                      {currentQuestion.explanation && (
                        <p className="text-sm text-muted-foreground">
                          {currentQuestion.explanation}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-6">
                        Swipe right for "Got It" or left for "Still Learning"
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
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
                className="border-yellow-500 text-yellow-600 px-2 sm:px-3"
                onClick={handleStillLearning}
                data-testid="button-still-learning"
              >
                <RotateCcw className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Still Learning</span>
                <span className="sm:hidden">Learning</span>
              </Button>
              <Button
                size="sm"
                className="bg-green-600 border-green-800 px-2 sm:px-3"
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
            onClick={() => goToNext("left")}
            disabled={isLastCard}
            data-testid="button-next-card"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>

        {isLastCard && isFlipped && (
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
