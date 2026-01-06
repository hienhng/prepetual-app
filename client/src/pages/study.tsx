import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useTransform, useAnimationControls, PanInfo, animate } from "framer-motion";
import { BookOpen, RotateCcw, Check, Home, Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  const [history, setHistory] = useState<{ index: number; action: "known" | "learning" }[]>([]);

  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const leftOpacity = useTransform(x, [-120, -40, 0], [1, 0.4, 0]);
  const rightOpacity = useTransform(x, [0, 40, 120], [0, 0.4, 1]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || isSwiping) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        handleSwipeAction(1, "known");
      } else if (e.code === "ArrowLeft") {
        handleSwipeAction(-1, "learning");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCompleted, isSwiping, currentIndex, isFlipped]);

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

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice": return "Multiple Choice";
      case "true_false": return "True / False";
      case "short_answer": return "Short Answer";
      default: return type.replace("_", " ");
    }
  };

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
    // Explicitly animate the motion value x so the overlays react
    await Promise.all([
      animate(x, direction * 500, { type: "spring", stiffness: 200, damping: 35 }),
      controls.start({
        rotate: direction * 25,
        opacity: 0,
        transition: { type: "spring", stiffness: 200, damping: 35 }
      })
    ]);
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
    
    setHistory(prev => [...prev, { index: currentIndex, action }]);

    if (isLastCard) {
      setIsCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
    
    resetCard();
  };

  const handleDragStart = () => {
    document.body.style.overflow = "hidden";
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    document.body.style.overflow = "auto";
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
    setHistory([]);
    setIsCompleted(false);
    resetCard();
  };

  const handleUndo = () => {
    if (history.length === 0 || isSwiping) return;

    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    
    if (last.action === "known") {
      setKnownCards(prev => {
        const s = new Set(prev);
        s.delete(last.index);
        return s;
      });
    } else {
      setStudyingCards(prev => {
        const s = new Set(prev);
        s.delete(last.index);
        return s;
      });
    }

    setCurrentIndex(last.index);
    setIsFlipped(false);
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
              You just reviewed {questions.length} cards! 
            </p>
          </div>
          
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{knownCards.size}</p>
              <p className="text-sm text-muted-foreground">Know</p>
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

        <div className="relative h-[calc(100vh-160px)] min-h-[650px] max-h-[1100px] touch-none select-none">
          <motion.div
            key={currentIndex}
            animate={controls}
            drag="x"
            dragElastic={0.25}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{ x, rotate }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            data-testid="flashcard-container"
          >
            <div 
              className="h-full perspective-1000 relative"
              onClick={handleFlip}
            >
              {/* Swipe Overlays - Moved outside flipping container so they stay visible when flipped */}
              <motion.div 
                style={{ opacity: rightOpacity }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-green-500/90 text-white rounded-xl pointer-events-none"
              >
                <Check className="h-20 w-20 mb-4" />
                <span className="text-3xl font-bold uppercase tracking-widest">Know</span>
              </motion.div>

              <motion.div 
                style={{ opacity: leftOpacity }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-yellow-500/90 text-white rounded-xl pointer-events-none"
              >
                <RotateCcw className="h-20 w-20 mb-4" />
                <span className="text-3xl font-bold uppercase tracking-widest text-center px-4">Still Learning</span>
              </motion.div>

              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
                className="h-full relative"
              >

                <Card className="absolute inset-0 backface-hidden shadow-lg border-primary/10">
                  <CardContent className="h-full flex flex-col p-0 overflow-hidden">
                    <ScrollArea className="flex-1">
                      <div className="p-6 sm:p-10 flex flex-col min-h-full">
                        <div className="flex flex-col items-center mb-6">
                          <span className="text-xs uppercase tracking-widest text-muted-foreground block font-bold opacity-70 mb-1">
                            Question
                          </span>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter font-bold px-2 py-0 h-5 bg-primary/10 text-primary border-primary/20">
                            {getQuestionTypeLabel(currentQuestion.type)}
                          </Badge>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <p className="text-xl sm:text-2xl font-bold mb-8 text-center leading-tight">{currentQuestion.question}</p>
                          {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                            <div className="w-full space-y-3 mt-4">
                              {currentQuestion.options.map((opt, i) => (
                                <div key={i} className="p-4 bg-muted/50 rounded-xl text-base border border-transparent hover:border-primary/20 transition-colors">
                                  <span className="inline-block w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mr-3 text-center leading-6">
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                    <div className="p-6 text-center border-t bg-muted/20">
                      <p className="text-sm font-medium text-muted-foreground animate-pulse">
                        Tap to reveal answer
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="absolute inset-0 backface-hidden shadow-lg border-primary/20"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <CardContent className="h-full flex flex-col p-0 overflow-hidden">
                    <ScrollArea className="flex-1">
                      <div className="p-6 sm:p-10 flex flex-col min-h-full">
                        <span className="text-xs uppercase tracking-widest text-primary mb-6 block text-center font-bold">
                          Answer
                        </span>
                        <div className="flex-1 flex flex-col justify-center">
                          <p className="text-2xl sm:text-3xl font-black text-primary mb-8 text-center leading-tight">
                            {currentQuestion.correctAnswer}
                          </p>
                          {currentQuestion.explanation && (
                            <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10 text-left">
                              <p className="text-xs uppercase tracking-widest text-primary/70 mb-3 font-bold">
                                Explanation
                              </p>
                              <p className="text-base text-foreground leading-relaxed">
                                {currentQuestion.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                    <div className="p-6 text-center border-t bg-muted/20">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Left = Learning • Right = Got It
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleUndo} 
            disabled={history.length === 0 || isSwiping}
            className="rounded-full h-12 w-12 shadow-md hover-elevate"
            data-testid="button-undo"
          >
            <Undo2 className="h-6 w-6" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
