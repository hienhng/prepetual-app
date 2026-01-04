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
  const [exitDirection, setExitDirection] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const leftIndicatorOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);

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
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
    }
  };

  const triggerSwipe = useCallback((direction: number, action?: "known" | "learning") => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setExitDirection(direction);
    setIsFlipped(false);
    
    if (action === "known") {
      setKnownCards(prev => {
        const newSet = new Set(prev);
        newSet.add(currentIndex);
        return newSet;
      });
      setStudyingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentIndex);
        return newSet;
      });
    } else if (action === "learning") {
      setStudyingCards(prev => {
        const newSet = new Set(prev);
        newSet.add(currentIndex);
        return newSet;
      });
      setKnownCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentIndex);
        return newSet;
      });
    }
  }, [isAnimating, currentIndex]);

  const handleExitComplete = useCallback(() => {
    if (exitDirection !== 0) {
      if (exitDirection > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (exitDirection < 0 && currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
    setExitDirection(0);
    setIsAnimating(false);
    x.set(0);
  }, [exitDirection, currentIndex, questions.length, x]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offsetThreshold = 80;
    const velocityThreshold = 400;
    
    const triggeredByOffset = Math.abs(info.offset.x) > offsetThreshold;
    const triggeredByVelocity = Math.abs(info.velocity.x) > velocityThreshold;
    
    if (triggeredByOffset || triggeredByVelocity) {
      const direction = info.offset.x > 0 ? 1 : -1;
      
      if (isFlipped) {
        if (direction > 0) {
          triggerSwipe(-1, "known");
        } else {
          triggerSwipe(-1, "learning");
        }
      } else {
        if (direction > 0 && currentIndex > 0) {
          triggerSwipe(1);
        } else if (direction < 0 && currentIndex < questions.length - 1) {
          triggerSwipe(-1);
        }
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsFlipped(false);
      triggerSwipe(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1 && !isAnimating) {
      setIsFlipped(false);
      triggerSwipe(-1);
    }
  };

  const handleKnown = () => {
    if (!isAnimating && currentIndex < questions.length - 1) {
      triggerSwipe(-1, "known");
    } else if (!isAnimating) {
      setKnownCards(prev => {
        const newSet = new Set(prev);
        newSet.add(currentIndex);
        return newSet;
      });
    }
  };

  const handleStillLearning = () => {
    if (!isAnimating && currentIndex < questions.length - 1) {
      triggerSwipe(-1, "learning");
    } else if (!isAnimating) {
      setStudyingCards(prev => {
        const newSet = new Set(prev);
        newSet.add(currentIndex);
        return newSet;
      });
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setStudyingCards(new Set());
    setExitDirection(0);
    setIsAnimating(false);
    x.set(0);
  };

  const getAnswerDisplay = (q: Question) => {
    return q.correctAnswer;
  };

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction < 0 ? 300 : direction > 0 ? -300 : 0,
      opacity: 0,
      scale: 0.92,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? -350 : direction > 0 ? 350 : 0,
      opacity: 0,
      scale: 0.88,
      rotate: direction < 0 ? -12 : direction > 0 ? 12 : 0,
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

        <div className="relative h-[380px] touch-none select-none">
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2 z-10">
            <motion.div 
              style={{ opacity: leftIndicatorOpacity }}
              className="bg-yellow-500/90 text-white px-3 py-2 rounded-full font-semibold shadow-lg text-sm"
            >
              <RotateCcw className="h-4 w-4 inline mr-1" />
              Learning
            </motion.div>
            <motion.div 
              style={{ opacity: rightIndicatorOpacity }}
              className="bg-green-500/90 text-white px-3 py-2 rounded-full font-semibold shadow-lg text-sm"
            >
              Got It
              <Check className="h-4 w-4 inline ml-1" />
            </motion.div>
          </div>

          <AnimatePresence 
            mode="wait" 
            custom={exitDirection}
            onExitComplete={handleExitComplete}
          >
            <motion.div
              key={currentIndex}
              custom={exitDirection}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 24,
                mass: 0.8,
              }}
              drag={!isAnimating ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 25 }}
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
                  transition={{ 
                    type: "spring", 
                    stiffness: 120, 
                    damping: 18,
                    mass: 0.5,
                  }}
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
                        <div className="w-full space-y-2 text-left max-h-[140px] overflow-y-auto">
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
                        <p className="text-sm text-muted-foreground max-h-[100px] overflow-y-auto">
                          {currentQuestion.explanation}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-6">
                        Swipe right = Got It, Swipe left = Still Learning
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
            disabled={currentIndex === 0 || isAnimating}
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
                disabled={isAnimating}
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
                disabled={isAnimating}
                data-testid="button-known"
              >
                <Check className="h-4 w-4 sm:mr-1" />
                <span>Got It</span>
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            className="sm:w-auto sm:px-3"
            onClick={handleNext}
            disabled={isLastCard || isAnimating}
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
