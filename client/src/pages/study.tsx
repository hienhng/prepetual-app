import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useTransform, useAnimationControls, PanInfo, animate } from "framer-motion";
import { BookOpen, RotateCcw, Check, Home, Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";
import { useQuiz } from "@/lib/quiz-context";
import { useLanguage } from "@/lib/language-context";
import type { Question } from "@shared/schema";

export default function StudyPage() {
  const { currentQuiz } = useQuiz();
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [studyingCards, setStudyingCards] = useState<Set<number>>(new Set());
  const [isSwiping, setIsSwiping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [history, setHistory] = useState<{ index: number; action: "known" | "learning" }[]>([]);

  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const leftOpacity = useTransform(x, [-120, -40, 0], [1, 0, 0]);
  const rightOpacity = useTransform(x, [0, 40, 120], [0, 0, 1]);
  const borderColor = useTransform(
    x,
    [-150, 0, 150],
    ["rgba(234, 179, 8, 0.5)", "rgba(0, 0, 0, 0)", "rgba(34, 197, 94, 0.5)"]
  );

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
      <div className="container mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
          <h2 className="text-2xl font-bold mb-3">{t('study.noQuizSelected')}</h2>
          <p className="text-muted-foreground mb-8 max-w-xs mx-auto">{t('study.noQuizSelectedDesc')}</p>
          <Link href="/history">
            <Button size="lg" className="rounded-xl px-8" data-testid="button-go-history">
              {t('study.goToHistory')}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice": return t('quizGenerator.multipleChoice');
      case "true_false": return t('quizGenerator.trueFalse');
      case "short_answer": return t('quizGenerator.shortAnswer');
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
    await Promise.all([
      animate(x, direction * 600, { type: "spring", stiffness: 260, damping: 20 }),
      controls.start({
        rotate: direction * 20,
        opacity: 0,
        transition: { duration: 0.3 }
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
      transition: { type: "spring", stiffness: 300, damping: 25 }
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
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FACC15", "#4ADE80", "#3B82F6"],
      });
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
    const offsetThreshold = 100;
    const velocityThreshold = 500;
    
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
      <div className="container mx-auto px-4 py-8 max-w-2xl min-h-[90vh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full text-center"
        >
          <div className="mb-8">
            <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">{t('study.sessionComplete')}</h1>
            <p className="text-muted-foreground text-lg">{t('study.sessionCompleteDesc', { title: currentQuiz.title })}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <Card className="bg-green-500/5 border-green-500/10 rounded-3xl p-8">
              <p className="text-5xl font-black text-green-600 mb-2">{knownCards.size}</p>
              <p className="text-sm font-bold uppercase tracking-widest text-green-600/60">{t('study.mastered')}</p>
            </Card>
            <Card className="bg-yellow-500/5 border-yellow-500/10 rounded-3xl p-8">
              <p className="text-5xl font-black text-yellow-600 mb-2">{studyingCards.size}</p>
              <p className="text-sm font-bold uppercase tracking-widest text-yellow-600/60">{t('study.learning')}</p>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button 
              size="lg"
              variant="outline" 
              onClick={handleReset} 
              className="flex-1 font-bold h-14 rounded-2xl border-2"
              data-testid="button-study-again"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              {t('study.retakeCards')}
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button 
                size="lg"
                className="w-full font-bold h-14 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                data-testid="button-finish-study"
              >
                <Home className="h-5 w-5 mr-2" />
                {t('common.backToDashboard')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight leading-none">{currentQuiz.title}</h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-3 w-3" />
            {t('study.flashcardSession')}
          </p>
        </div>
        <Link href="/dashboard">
          <Button size="icon" variant="ghost" className="rounded-full h-10 w-10">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="mb-10 space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            {t('study.progress', { current: currentIndex + 1, total: questions.length })}
          </span>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-muted-foreground">{knownCards.size}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-xs font-bold text-muted-foreground">{studyingCards.size}</span>
            </div>
          </div>
        </div>
        <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />
        </div>
      </div>

      <div className="relative flex-1 min-h-[500px] mb-8 group perspective-1000">
        <motion.div
          key={currentIndex}
          animate={controls}
          drag="x"
          dragElastic={0.2}
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{ x, rotate }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
          data-testid="flashcard-container"
        >
          <div className="h-full relative select-none" onClick={handleFlip}>
            {/* Subtle Badge Overlays */}
            <motion.div 
              style={{ opacity: rightOpacity }}
              className="absolute top-6 right-6 z-30 px-6 py-3 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-500/20 rotate-12 pointer-events-none"
            >
              {t('study.mastered')}
            </motion.div>

            <motion.div 
              style={{ opacity: leftOpacity }}
              className="absolute top-6 left-6 z-30 px-6 py-3 bg-yellow-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-yellow-500/20 -rotate-12 pointer-events-none"
            >
              {t('study.learning')}
            </motion.div>

            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              style={{ transformStyle: "preserve-3d" }}
              className="h-full w-full relative"
            >
              {/* Front Side */}
              <Card className="absolute inset-0 backface-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-primary/5 rounded-[2rem] overflow-hidden bg-card">
                <motion.div 
                  style={{ border: `3px solid ${borderColor}` }}
                  className="absolute inset-0 rounded-[2rem] pointer-events-none transition-colors"
                />
                <div className="h-full flex flex-col">
                  <div className="p-8 pb-0 flex items-center justify-center">
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold uppercase tracking-wider text-[10px] px-3">
                      {getQuestionTypeLabel(currentQuestion.type)}
                    </Badge>
                  </div>
                  <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-4">{t('study.question')}</span>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                      {currentQuestion.question}
                    </h2>
                    
                    {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                      <div className="mt-8 grid grid-cols-1 gap-2 opacity-60">
                        {currentQuestion.options.slice(0, 4).map((opt, i) => (
                          <div key={i} className="px-4 py-2 bg-muted/30 rounded-xl text-xs font-medium text-left truncate border border-border/50">
                             <span className="mr-2 text-primary/50 font-black">{String.fromCharCode(65 + i)}</span> {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-8 text-center bg-muted/30 border-t border-border/50">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {t('study.tapToReveal')}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Back Side */}
              <Card 
                className="absolute inset-0 backface-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-primary/10 rounded-[2rem] overflow-hidden bg-card"
                style={{ transform: "rotateY(180deg)" }}
              >
                <div className="h-full flex flex-col">
                  <div className="p-8 pb-0 flex items-center justify-center">
                    <Badge className="bg-green-500 text-white border-none font-bold uppercase tracking-wider text-[10px] px-3">
                      {t('study.correctAnswer')}
                    </Badge>
                  </div>
                  <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 text-center overflow-y-auto">
                    <h2 className="text-3xl sm:text-4xl font-black text-primary tracking-tight leading-none mb-6">
                      {currentQuestion.correctAnswer}
                    </h2>
                    {currentQuestion.explanation && (
                      <div className="mt-4 p-5 bg-primary/5 rounded-2xl border border-primary/10 text-left">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2 block">{t('study.explanation')}</span>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-8 text-center bg-primary/5 border-t border-primary/10">
                    <p className="text-xs font-black uppercase tracking-widest text-primary/50">
                      {t('study.swipeToGrade')}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="mt-auto pb-6 space-y-6">
        <div className="flex items-center justify-center gap-4">
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => handleSwipeAction(-1, "learning")}
            className="h-16 flex-1 rounded-2xl border-2 border-yellow-500/20 hover:bg-yellow-500/5 hover:border-yellow-500/40 text-yellow-600 font-bold gap-2 group transition-all"
            disabled={isSwiping}
          >
            <RotateCcw className="h-5 w-5 group-hover:rotate-[-45deg] transition-transform" />
            {t('study.learning')}
          </Button>
          
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleUndo} 
            disabled={history.length === 0 || isSwiping}
            className="rounded-full h-14 w-14 border-2 shrink-0 shadow-sm"
          >
            <Undo2 className="h-6 w-6" />
          </Button>

          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => handleSwipeAction(1, "known")}
            className="h-16 flex-1 rounded-2xl border-2 border-green-500/20 hover:bg-green-500/5 hover:border-green-500/40 text-green-600 font-bold gap-2 group transition-all"
            disabled={isSwiping}
          >
            {t('study.mastered')}
            <Check className="h-5 w-5 group-hover:scale-125 transition-transform" />
          </Button>
        </div>
        
        <p className="text-[10px] font-bold text-center text-muted-foreground/40 uppercase tracking-[0.3em]">
          {t('study.navigationTip')}
        </p>
      </div>
    </div>
  );
}
