import { useState } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useTransform, useAnimationControls, PanInfo } from "framer-motion";
import { BookOpen, RotateCcw, Check, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuiz } from "@/lib/quiz-context";
import type { Question } from "@shared/schema";

export default function StudyPage() {
  const { currentQuiz } = useQuiz();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [studyingCards, setStudyingCards] = useState<Set<number>>(new Set());
  const [isSwiping, setIsSwiping] = useState(false);

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

  const goToNextCard = async (direction: number, action: "known" | "learning") => {
    if (isSwiping || isLastCard) return;
    
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
    setCurrentIndex(prev => prev + 1);
    resetCard();
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const offsetThreshold = 80;
    const velocityThreshold = 400;
    
    const swipedRight = info.offset.x > offsetThreshold || info.velocity.x > velocityThreshold;
    const swipedLeft = info.offset.x < -offsetThreshold || info.velocity.x < -velocityThreshold;

    if (swipedRight && !isLastCard) {
      await goToNextCard(1, "known");
    } else if (swipedLeft && !isLastCard) {
      await goToNextCard(-1, "learning");
    } else {
      await snapBack();
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setStudyingCards(new Set());
    resetCard();
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

        <div className="relative h-[380px] touch-none select-none">
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
                      {currentQuestion.correctAnswer}
                    </p>
                    {currentQuestion.explanation && (
                      <p className="text-sm text-muted-foreground max-h-[100px] overflow-y-auto">
                        {currentQuestion.explanation}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-6">
                      Swipe right = Got It, left = Learning
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {isLastCard && (
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
