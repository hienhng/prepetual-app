import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { 
  ArrowRight, ArrowUp, CheckCircle2, Upload, Brain, Zap, BookOpen, 
  Share2, RotateCcw, Sparkles, Play, Eye, Target, Users, Star,
  ChevronRight, ChevronLeft, Layers, GraduationCap, Trophy, Flame, MousePointer2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useAuthDialog } from "@/lib/auth-context";
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, animate, PanInfo } from "framer-motion";
import { Footer } from "@/components/footer";

function InteractiveFlashcard() {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-100, 0, 100], [-12, 0, 12]);
  const leftOpacity = useTransform(x, [-60, -20, 0], [1, 0.3, 0]);
  const rightOpacity = useTransform(x, [0, 20, 60], [0, 0.3, 1]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 40;
    if (Math.abs(info.offset.x) > threshold) {
      await animate(x, info.offset.x > 0 ? 150 : -150, { duration: 0.2 });
      await animate(x, 0, { duration: 0.3 });
    } else {
      await animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  return (
    <motion.div
      className="absolute bottom-4 -left-4 md:left-0 w-[160px] md:w-[180px] rounded-xl bg-card border shadow-xl z-20"
      initial={{ opacity: 0, x: -30, rotate: -9 }}
      animate={{ opacity: 1, x: 0, rotate: 3 }}
      transition={{ delay: 0.7, duration: 0.6 }}
    >
      {/* Draggable flashcard - works like real study page */}
      <div className="relative h-[130px] touch-none overflow-visible">
        <motion.div 
          className="absolute inset-0 flex flex-col cursor-grab active:cursor-grabbing"
          style={{ x, rotate }}
          drag="x"
          dragElastic={0.3}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          {/* Card content */}
          <div className="flex-1 p-3 flex flex-col bg-card rounded-xl overflow-hidden">
            <div className="text-center mb-1">
              <span className="text-[7px] uppercase tracking-widest text-muted-foreground font-bold">Question</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[10px] text-foreground font-semibold text-center leading-tight px-1">
                What is the powerhouse of the cell?
              </p>
            </div>
          </div>
          
          <div className="p-2 text-center border-t bg-muted/20">
            <p className="text-[7px] font-medium text-muted-foreground">
              Swipe to interact
            </p>
          </div>
          
          {/* Green "KNOW" overlay */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-green-500 text-white rounded-xl pointer-events-none overflow-hidden"
            style={{ opacity: rightOpacity }}
          >
            <Check className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Know</span>
          </motion.div>
          
          {/* Yellow "STILL LEARNING" overlay */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-500 text-white rounded-xl pointer-events-none overflow-hidden"
            style={{ opacity: leftOpacity }}
          >
            <RotateCcw className="w-6 h-6 mb-1" />
            <span className="text-[8px] font-bold uppercase tracking-wider text-center px-2">Still Learning</span>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Progress bar */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between text-[7px] text-muted-foreground mb-1">
          <span>Card 3 of 5</span>
          <span className="text-green-600">2 known</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-3/5 bg-primary rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}

function HeroIllustration() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] perspective-1000">
      {/* Background glow */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-[3rem] blur-3xl"
        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      
      {/* Decorative SVG circles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
        <motion.circle
          cx="250" cy="250" r="200"
          fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.1"
          strokeWidth="1" strokeDasharray="8 8"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
        <motion.circle
          cx="250" cy="250" r="160"
          fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.15"
          strokeWidth="1" strokeDasharray="4 6"
          initial={{ rotate: 0 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-[380px] md:max-w-[450px] h-[320px] md:h-[380px] perspective-1000">
          
          {/* Generation Board Card (Back) */}
          <motion.div
            className="absolute top-0 left-0 w-[200px] md:w-[220px] rounded-xl bg-card border shadow-xl"
            initial={{ opacity: 0, x: -30, rotateY: -15, rotateX: 10, rotate: -8 }}
            animate={{ opacity: 1, x: 0, rotateY: -10, rotateX: 5, rotate: -6 }}
            whileHover={{ rotateY: -5, rotateX: 0, translateZ: 20 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground">Generate Quiz</span>
              </div>
              
              {/* Settings mockup */}
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">Questions</div>
                  <div className="flex gap-1">
                    {[5, 10, 15].map((n, i) => (
                      <div key={n} className={`px-2 py-1 rounded text-[10px] font-medium ${i === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">Difficulty</div>
                  <div className="flex gap-1">
                    {['Easy', 'Medium', 'Hard'].map((d, i) => (
                      <div key={d} className={`px-2 py-1 rounded text-[10px] font-medium ${i === 1 ? 'bg-amber-500/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
                <motion.div 
                  className="mt-3 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-[11px] font-semibold text-primary-foreground">Generate</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Quiz Question Card (Front) */}
          <motion.div
            className="absolute top-4 right-0 w-[220px] md:w-[250px] rounded-xl bg-card border-2 border-primary/20 shadow-2xl"
            initial={{ opacity: 0, x: 30, rotateY: 15, rotateX: -5, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotateY: 10, rotateX: -2, rotate: 3 }}
            whileHover={{ rotateY: 5, rotateX: 0, translateZ: 30 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="p-4">
              {/* Question header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    3
                  </div>
                  <span className="text-[10px] text-muted-foreground">of 10</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Target className="w-3 h-3" />
                  <span>Multiple Choice</span>
                </div>
              </div>
              
              {/* Question text */}
              <div className="mb-4 p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  What is the primary function of mitochondria in a cell?
                </p>
              </div>
              
              {/* Answer options */}
              <div className="space-y-2">
                {[
                  { text: 'Energy production', correct: true },
                  { text: 'Protein synthesis', correct: false },
                  { text: 'Cell division', correct: false },
                  { text: 'Waste removal', correct: false },
                ].map((opt, i) => (
                  <motion.div
                    key={i}
                    className={`p-2.5 rounded-lg border text-[11px] font-medium flex items-center gap-2 ${
                      opt.correct 
                        ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400' 
                        : 'border-border bg-background text-foreground hover:border-primary/30'
                    }`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    {opt.correct && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                    <span>{opt.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Study Mode Card (Left side, lower) - Interactive like real study.tsx */}
          <InteractiveFlashcard />

          {/* Floating sparkle decorations */}
          <motion.div
            className="absolute -top-4 left-1/2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
            animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
          
          <motion.div
            className="absolute top-1/2 -left-4 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            <CheckCircle2 className="w-3 h-3 text-green-500" />
          </motion.div>
          
          <motion.div
            className="absolute top-1/3 -right-2 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            <Star className="w-3 h-3 text-amber-500" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function HowItWorksGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const stages = [
    { 
      icon: Upload, 
      label: "Upload", 
      desc: "Drop your study materials - PDFs, images, Word docs, or PowerPoint files", 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      content: (
        <div className="text-center w-full">
          <motion.div 
            className="w-28 h-28 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-2 border-dashed border-blue-500/40 flex items-center justify-center relative overflow-hidden"
            whileHover={{ scale: 1.05, borderStyle: "solid" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="absolute inset-0 bg-blue-500/5"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Upload className="w-12 h-12 text-blue-500" />
            </motion.div>
          </motion.div>
          <p className="text-base font-semibold text-foreground mb-3">Drop your study materials</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['PDF', 'Images', 'Word', 'PPT'].map((f, idx) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Badge variant="secondary" className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {f}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    { 
      icon: Eye, 
      label: "Extract", 
      desc: "Our AI reads and analyzes your content instantly with precision", 
      color: "text-amber-500", 
      bg: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      content: (
        <div className="w-full max-w-sm mx-auto">
          <div className="space-y-3 mb-5">
            {[100, 85, 60].map((width, i) => (
              <motion.div 
                key={i} 
                className="h-3 bg-gradient-to-r from-amber-500/30 via-amber-500/20 to-transparent rounded-full overflow-hidden"
                style={{ width: `${width}%` }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500/60 to-amber-500/30 rounded-full"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              </motion.div>
            ))}
          </div>
          <motion.div 
            className="flex items-center justify-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Eye className="w-5 h-5 text-amber-500" />
            </motion.div>
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Analyzing your content...</span>
          </motion.div>
        </div>
      )
    },
    { 
      icon: Brain, 
      label: "Generate", 
      desc: "AI transforms your text into personalized quiz questions", 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      content: (
        <div className="w-full max-w-sm mx-auto space-y-3">
          {[
            { type: 'Multiple Choice', q: 'What is the main concept discussed?', color: 'purple' },
            { type: 'True/False', q: 'This statement accurately reflects...', color: 'violet' },
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 text-left"
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: i * 0.2, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.02, borderColor: "rgba(168, 85, 247, 0.4)" }}
            >
              <Badge variant="outline" className="mb-2 text-purple-500 border-purple-500/30 text-xs bg-purple-500/10">
                {item.type}
              </Badge>
              <p className="text-sm font-medium text-foreground">{item.q}</p>
            </motion.div>
          ))}
          <motion.div 
            className="flex items-center justify-center gap-2 pt-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Brain className="w-4 h-4 text-purple-500" />
            </motion.div>
            <span className="text-sm text-purple-500">Generating more...</span>
          </motion.div>
        </div>
      )
    },
    { 
      icon: GraduationCap, 
      label: "Learn", 
      desc: "Master your subjects with interactive quizzes and flashcards", 
      color: "text-green-500", 
      bg: "bg-green-500/10",
      borderColor: "border-green-500/30",
      content: (
        <div className="text-center w-full">
          <motion.div 
            className="w-28 h-28 mx-auto mb-5 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-green-500/30"
              animate={{ scale: [1, 1.1, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-12 h-12 text-green-500" />
            </motion.div>
          </motion.div>
          <p className="text-base font-semibold text-foreground mb-4">Ready to learn!</p>
          <div className="flex justify-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 px-4 py-1.5 cursor-pointer">
                <Play className="w-3.5 h-3.5 mr-1.5" /> Take Quiz
              </Badge>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-4 py-1.5 cursor-pointer">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Study
              </Badge>
            </motion.div>
          </div>
        </div>
      )
    },
  ];

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const width = containerRef.current.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setActiveStep(index);
  };

  const goToStep = (index: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ left: index * containerRef.current.offsetWidth, behavior: 'smooth' });
  };

  const goNext = () => {
    if (activeStep < stages.length - 1) {
      goToStep(activeStep + 1);
    }
  };

  const goPrev = () => {
    if (activeStep > 0) {
      goToStep(activeStep - 1);
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden z-20">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
          initial={{ width: "25%" }}
          animate={{ width: `${((activeStep + 1) / stages.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>

      {/* Navigation arrows */}
      <AnimatePresence>
        {activeStep > 0 && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isHovered ? 1 : 0.5, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            className="absolute left-2 top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            aria-label="Previous step"
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {activeStep < stages.length - 1 && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isHovered ? 1 : 0.5, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goNext}
            className="absolute right-2 top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            aria-label="Next step"
            data-testid="button-carousel-next"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-6 pb-8 pt-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {stages.map((stage, i) => {
          const isActive = activeStep === i;
          
          return (
            <div key={stage.label} className="min-w-full snap-center px-4">
              <motion.div
                className="relative h-full"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              >
                <Card className={`relative border-2 ${isActive ? stage.borderColor : 'border-transparent'} bg-card overflow-hidden h-full min-h-[420px] transition-all duration-500 group shadow-xl`}>
                  {/* Gradient background overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stage.bg} to-transparent opacity-30 pointer-events-none`} />
                  
                  {/* Animated corner glow */}
                  <motion.div
                    className={`absolute -top-24 -right-24 w-48 h-48 rounded-full ${stage.bg} blur-3xl`}
                    animate={{ 
                      scale: isActive ? [1, 1.3, 1] : 1,
                      opacity: isActive ? [0.3, 0.5, 0.3] : 0.2
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  {/* Floating decorative elements */}
                  <motion.div
                    className={`absolute top-12 right-12 w-2 h-2 rounded-full ${stage.bg}`}
                    animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div
                    className={`absolute bottom-24 left-12 w-1.5 h-1.5 rounded-full ${stage.bg}`}
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  />
                  
                  <CardContent className="relative p-8 md:p-10 flex flex-col items-center justify-center text-center h-full z-10">
                    {/* Step indicator with icon */}
                    <motion.div
                      className="relative mb-8"
                      animate={isActive ? { y: [0, -6, 0] } : {}}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {/* Glow ring */}
                      <motion.div
                        className={`absolute inset-0 rounded-2xl ${stage.bg} blur-xl`}
                        animate={isActive ? { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className={`relative w-20 h-20 rounded-2xl ${stage.bg} flex items-center justify-center border-2 ${stage.borderColor} shadow-lg`}>
                        <stage.icon className={`w-10 h-10 ${stage.color}`} />
                      </div>
                      {/* Step number badge */}
                      <motion.div 
                        className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border-2 ${stage.borderColor} flex items-center justify-center text-sm font-bold shadow-lg ${stage.color}`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {i + 1}
                      </motion.div>
                    </motion.div>
                    
                    {/* Title and description */}
                    <div className="mb-8">
                      <motion.h3 
                        className={`text-2xl font-bold mb-3 ${stage.color}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {stage.label}
                      </motion.h3>
                      <p className="text-muted-foreground max-w-md text-sm md:text-base leading-relaxed">{stage.desc}</p>
                    </div>
                    
                    {/* Content area */}
                    <div className="flex-1 flex items-center justify-center w-full">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={stage.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="w-full"
                        >
                          {stage.content}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Step indicators */}
      <div className="flex justify-center items-center gap-3 mt-4">
        {stages.map((stage, i) => (
          <button
            key={i}
            onClick={() => goToStep(i)}
            className={`group relative flex items-center gap-2 transition-all duration-300 ${
              activeStep === i ? 'scale-100' : 'scale-90 opacity-70 hover:opacity-100'
            }`}
            aria-label={`Go to step ${i + 1}: ${stage.label}`}
            data-testid={`button-step-indicator-${i}`}
          >
            <motion.div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                activeStep === i 
                  ? `${stage.bg} ${stage.borderColor} border-2 shadow-lg` 
                  : 'bg-muted border border-transparent'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <stage.icon className={`w-5 h-5 ${activeStep === i ? stage.color : 'text-muted-foreground'}`} />
            </motion.div>
            {activeStep === i && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className={`text-sm font-medium ${stage.color} hidden sm:block`}
              >
                {stage.label}
              </motion.span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function FeatureShowcase() {
  const features = [
    {
      icon: Upload,
      title: "Multi-Format Upload",
      description: "PDFs, images, Word, PowerPoint, Excel. Our OCR handles photos of textbooks too.",
      color: "blue",
    },
    {
      icon: Brain,
      title: "AI Quiz Generation",
      description: "Intelligent AI creates meaningful questions that test real understanding.",
      color: "purple",
    },
    {
      icon: BookOpen,
      title: "Study Mode",
      description: "Swipe-based flashcards with 'known' and 'learning' progress tracking.",
      color: "orange",
    },
    {
      icon: RotateCcw,
      title: "Spaced Repetition",
      description: "Missed questions come back in retry rounds until you master them.",
      color: "rose",
    },
    {
      icon: Share2,
      title: "Community Sharing",
      description: "Share quizzes, browse public ones, vote and comment.",
      color: "emerald",
    },
    {
      icon: Flame,
      title: "Streak Tracking",
      description: "Build daily learning habits with streak goals and reminders.",
      color: "amber",
    },
  ];

  const colorClasses: Record<string, { text: string; border: string; bg: string; glow: string }> = {
    blue: { text: "text-blue-500", border: "border-blue-500/20", bg: "bg-blue-500/10", glow: "group-hover:shadow-blue-500/20" },
    purple: { text: "text-purple-500", border: "border-purple-500/20", bg: "bg-purple-500/10", glow: "group-hover:shadow-purple-500/20" },
    orange: { text: "text-orange-500", border: "border-orange-500/20", bg: "bg-orange-500/10", glow: "group-hover:shadow-orange-500/20" },
    rose: { text: "text-rose-500", border: "border-rose-500/20", bg: "bg-rose-500/10", glow: "group-hover:shadow-rose-500/20" },
    emerald: { text: "text-emerald-500", border: "border-emerald-500/20", bg: "bg-emerald-500/10", glow: "group-hover:shadow-emerald-500/20" },
    amber: { text: "text-amber-500", border: "border-amber-500/20", bg: "bg-amber-500/10", glow: "group-hover:shadow-amber-500/20" },
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map((feature, index) => {
        const colors = colorClasses[feature.color];
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
          >
            <Card className={`h-full group cursor-default transition-all duration-300 border ${colors.border} bg-card hover:shadow-xl ${colors.glow} hover:-translate-y-1`}>
              <CardContent className="p-6 relative overflow-hidden">
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${colors.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <motion.div 
                  className={`relative w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-5 border ${colors.border}`}
                  whileHover={{ scale: 1.1, rotate: 8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <feature.icon className={`w-7 h-7 ${colors.text}`} />
                </motion.div>
                <h3 className="relative text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function AnimatedCounter({ value, duration = 2 }: { value: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  useEffect(() => {
    if (!isInView) return;
    
    if (value === "∞" || value === "100%") {
      setDisplayValue(value);
      return;
    }
    
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    const suffix = value.replace(/[0-9]/g, '');
    
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(numericValue * easeOutQuart);
      setDisplayValue(current + suffix);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);
  
  return <div ref={ref}>{displayValue}</div>;
}

function StatsSection() {
  const stats = [
    { value: "100%", label: "Free Forever", icon: Star, color: "from-amber-500 to-orange-500" },
    { value: "10+", label: "Languages", icon: Users, color: "from-blue-500 to-cyan-500" },
    { value: "∞", label: "Unlimited Quizzes", icon: Layers, color: "from-purple-500 to-pink-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 md:gap-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
          className="group text-center relative"
        >
          <motion.div 
            className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-4"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300`} />
            <div className="relative w-full h-full rounded-2xl bg-card border border-border/50 flex items-center justify-center shadow-lg group-hover:border-primary/30 transition-colors duration-300">
              <stat.icon className="w-7 h-7 md:w-9 md:h-9 text-primary" />
            </div>
          </motion.div>
          <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
            <AnimatedCounter value={stat.value} />
          </div>
          <div className="text-sm md:text-base text-muted-foreground font-medium">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText } = useQuiz();
  const { isAuthenticated, isLoading } = useAuth();
  const { openLoginDialog, openSignUpDialog } = useAuthDialog();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    setExtractedText("");
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTextExtracted = (text: string, isOfficeWithImages?: boolean, documentImages?: string[]) => {
    setExtractedText(text);
  };

  const handleContinueToGenerate = () => {
    if (isAuthenticated) {
      setLocation("/generate");
    } else {
      openLoginDialog();
    }
  };

  const handleGetStarted = () => {
    openSignUpDialog();
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[80px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="h-4 w-4" />
                <span>AI-Powered Study Assistant</span>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                Turn notes into{" "}
                <motion.span 
                  className="relative cursor-default inline-block"
                  whileHover="hovered"
                  initial="initial"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-amber-500">
                    quizzes
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-amber-500 rounded-full origin-left"
                    variants={{
                      initial: { scaleX: 0, opacity: 0 },
                      hovered: { scaleX: 1, opacity: 1 }
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30,
                      restDelta: 0.001
                    }}
                  />
                </motion.span>
                <br />
                <span className="text-muted-foreground text-3xl sm:text-4xl lg:text-5xl">in seconds</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-8">
                Upload any study material and let AI create personalized practice quizzes. Study smarter, not harder.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="gap-2 px-8 text-base h-12 w-full sm:w-auto shadow-lg shadow-primary/20"
                  data-testid="button-hero-get-started"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="gap-2 w-full sm:w-auto h-12"
                  data-testid="button-hero-learn-more"
                >
                  See How It Works
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                {[
                  { icon: CheckCircle2, text: "Free forever" },
                  { icon: CheckCircle2, text: "No credit card" },
                  { icon: CheckCircle2, text: "PDF & Images" },
                ].map((item, i) => (
                  <motion.div 
                    key={item.text}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <item.icon className="h-4 w-4 text-green-500" />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="order-1 lg:order-2"
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <StatsSection />
        </div>
      </section>
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <motion.div 
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Badge variant="outline" className="mb-4 px-4 py-1.5 text-primary border-primary/30 bg-primary/5">
                How It Works
              </Badge>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              From Documents to Mastery
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to transform any study material into an interactive learning experience.
            </p>
          </motion.div>
          
          <HowItWorksGallery />
        </div>
      </section>
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Badge variant="outline" className="mb-4 px-4 py-1.5 text-primary border-primary/30 bg-primary/5">
                Features
              </Badge>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need to Learn Smarter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to make studying more effective and enjoyable.
            </p>
          </motion.div>
          
          <div className="max-w-5xl mx-auto">
            <FeatureShowcase />
          </div>
        </div>
      </section>
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 sm:px-6 max-w-4xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Badge variant="outline" className="mb-4 px-4 py-1.5 text-primary border-primary/30 bg-primary/5">
                Try It Now
              </Badge>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Upload Your First Document
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how easy it is. Drop a file and watch the magic happen.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative shadow-2xl border-primary/20 overflow-hidden bg-card/95 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                <CardContent className="p-8 relative">
                  <FileUpload onTextExtracted={handleTextExtracted} />
                  
                  {extractedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Button
                        size="lg"
                        onClick={handleContinueToGenerate}
                        className="w-full gap-2 h-12 shadow-lg shadow-primary/20"
                        data-testid="button-continue-generate"
                      >
                        Continue to Generate Quiz
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            className="absolute top-10 left-10 w-2 h-2 rounded-full bg-primary/40"
            animate={{ y: [0, -20, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-1/3 right-20 w-3 h-3 rounded-full bg-primary/30"
            animate={{ y: [0, 15, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />
          <motion.div 
            className="absolute bottom-20 left-1/4 w-2 h-2 rounded-full bg-primary/30"
            animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-primary/40"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 2 }}
          />
        </div>
        <div className="container relative mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-3xl bg-primary/20 blur-2xl" />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shadow-xl">
                  <GraduationCap className="w-12 h-12 text-primary" />
                </div>
              </motion.div>
            </motion.div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Ready to Study Smarter?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
              Join students who are transforming their study materials into effective, personalized quizzes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="gap-2 px-10 h-14 w-full sm:w-auto text-base shadow-xl shadow-primary/30"
                  data-testid="button-cta-get-started"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
              <Link href="/about">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 w-full sm:w-auto h-14 px-8 text-base"
                    data-testid="button-learn-more"
                  >
                    Learn More
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-transform"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ y: -2 }}
            data-testid="button-scroll-to-top"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
