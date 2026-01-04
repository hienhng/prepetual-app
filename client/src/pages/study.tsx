import { useState } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useTransform, useAnimationControls, PanInfo } from "framer-motion";
import { BookOpen, RotateCcw, Check, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuiz } from "@/lib/quiz-context";
import type { Question } from "@shared/schema";

export default function StudyPage() {
  const { currentQuiz } = useQuiz();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [studyingCards, setStudyingCards] = useState<Set<number>>(new Set());
  const [isSwiping, setIsSwiping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const leftOpacity = useTransform(x, [-120, -40, 0], [1, 0.4, 0]);
  const rightOpacity = useTransform(x, [0, 40, 120], [0, 0.4, 1]);

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
  const isLastCard = currentIndex === questions.length - 1;

  const handleFlip = () => {
    if (!isSwiping) {
      setIsFlipped(prev => !prev);
    }
  };

  const flyOut = async (direction: number) => {
    setIsSwiping(true);
    await controls.start({
      x: direction * 400,
      rotate: direction * 15,
      opacity: 0,
      transition: { type: "spring", stiffness: 250, damping: 30 }
    });
  };

  const resetCard = () => {
    controls.set({ x: 0, rotate: 0, opacity: 1 });
    x.set(0);
    setIsFlipped(false);
    setIsSwiping(false);
  };

  const snapBack = async () => {
    await controls.start({
      x: 0,
      rotate: 0,
      transition: { type: "spring", stiffness: 200, damping: 26 }
    });
  };

  const handleSwipeAction = async (direction: number, action: "known" | "learning") => {
    if (isSwiping) return;
    
    if (action === "known") {
      setKnownCards(prev => new Set(prev).add(currentIndex));
      setStudyingCards(prev => {
        const s = new Set(prev);
        s.delete(currentIndex);
        return s;
      });
    } else {
      setStudyingCards(prev => new Set(prev).add(currentIndex));
      setKnownCards(prev => {
        const s = new Set(prev);
        s.delete(currentIndex);
        return s;
      });
    }

    await flyOut(direction);
    
    if (isLastCard) {
      setIsCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
    
    resetCard();
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const offsetThreshold = 80;
    const velocityThreshold = 400;
    
    const swipedRight = info.offset.x > offsetThreshold || info.velocity.x > velocityThreshold;
    const swipedLeft = info.offset.x < -offsetThreshold || info.velocity.x < -velocityThreshold;

    if (swipedRight) {
      await handleSwipeAction(1, "known");
    } else if (swipedLeft) {
      await handleSwipeAction(-1, "learning");
    } else {
      await snapBack();
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setStudyingCards(new Set());
    setIsCompleted(false);
    resetCard();
  };

  if (isCompleted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-muted rounded-lg"
        >
          <div className="mb-6">
            <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Study Session Complete!</h2>
            <p className="text-muted-foreground">
              Great job reviewing all {questions.length} cards!
            </p>
          </div>
          
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{knownCards.size}</p>
              <p className="text-sm text-muted-foreground">Known</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{studyingCards.size}</p>
              <p className="text-sm text-muted-foreground">Still Learning</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleReset} data-testid="button-study-again">
              <RotateCcw className="h-4 w-4 mr-2" />
              Study Again
            </Button>
            <Link href="/dashboard">
              <Button data-testid="button-finish-study">
                <Home className="h-4 w-4 mr-2" />
                Done
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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

        <div className="relative h-[420px] touch-none select-none">
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2 z-10">
            <motion.div 
              style={{ opacity: leftOpacity }}
              className="bg-yellow-500 text-white px-3 py-2 rounded-full font-semibold shadow-lg text-sm"
            >
              <RotateCcw className="h-4 w-4 inline mr-1" />
              Learning
            </motion.div>
            <motion.div 
              style={{ opacity: rightOpacity }}
              className="bg-green-500 text-white px-3 py-2 rounded-full font-semibold shadow-lg text-sm"
            >
              Got It
              <Check className="h-4 w-4 inline ml-1" />
            </motion.div>
          </div>

          <motion.div
            key={currentIndex}
            animate={controls}
            drag="x"
            dragElastic={0.25}
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
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
                className="h-full relative"
              >
                <Card className="absolute inset-0 backface-hidden">
                  <CardContent className="h-full flex flex-col p-0">
                    <ScrollArea className="flex-1 p-6 sm:p-8">
                      <div className="text-center">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground mb-4 block">
                          Question
                        </span>
                        <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>
                        {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                          <div className="w-full space-y-2 text-left mt-4">
                            {currentQuestion.options.map((opt, i) => (
                              <div key={i} className="p-3 bg-muted/50 rounded-md text-sm">
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="p-4 text-center border-t">
                      <p className="text-sm text-muted-foreground">
                        Tap to reveal answer
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="absolute inset-0 backface-hidden"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <CardContent className="h-full flex flex-col p-0">
                    <ScrollArea className="flex-1 p-6 sm:p-8">
                      <div className="text-center">
                        <span className="text-xs uppercase tracking-wide text-primary mb-4 block">
                          Answer
                        </span>
                        <p className="text-lg font-semibold text-primary mb-4">
                          {currentQuestion.correctAnswer}
                        </p>
                        {currentQuestion.explanation && (
                          <div className="mt-4 p-4 bg-muted/30 rounded-lg text-left">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                              Explanation
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {currentQuestion.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="p-4 text-center border-t">
                      <p className="text-xs text-muted-foreground">
                        Swipe right = Got It, left = Learning
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
