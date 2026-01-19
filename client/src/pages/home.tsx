import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { 
  ArrowRight, ArrowUp, ArrowLeft, CheckCircle2, Upload, Brain, Zap, BookOpen, 
  Share2, RotateCcw, Sparkles, Play, Eye, Target, Users, Star,
  ChevronRight, ChevronLeft, Layers, GraduationCap, Trophy, Flame, MousePointer2, Check, MessageCircle
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
  const rotate = useTransform(x, [-100, 0, 100], [-8, 0, 8]);
  const leftOpacity = useTransform(x, [-50, -15, 0], [1, 0.3, 0]);
  const rightOpacity = useTransform(x, [0, 15, 50], [0, 0.3, 1]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 35;
    if (Math.abs(info.offset.x) > threshold) {
      await animate(x, info.offset.x > 0 ? 120 : -120, { duration: 0.2 });
      await animate(x, 0, { duration: 0.3 });
    } else {
      await animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  return (
    <motion.div
      className="absolute bottom-6 left-0 md:left-4 w-[150px] md:w-[165px] rounded-xl bg-card border border-border shadow-lg z-20 overflow-hidden"
      initial={{ opacity: 0, x: -30, rotate: -9 }}
      animate={{ opacity: 1, x: 0, rotate: 4 }}
      transition={{ delay: 0.7, duration: 0.6 }}
    >
      {/* Header */}
      <div className="px-3 pt-2.5 pb-1.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-primary" />
          <span className="text-[9px] font-semibold text-foreground">Study Mode</span>
        </div>
        <span className="text-[8px] text-muted-foreground">3/5</span>
      </div>
      
      {/* Draggable flashcard */}
      <div className="relative h-[90px] touch-none overflow-visible">
        <motion.div 
          className="absolute inset-0 flex flex-col cursor-grab active:cursor-grabbing"
          style={{ x, rotate }}
          drag="x"
          dragElastic={0.3}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 p-2.5 flex items-center justify-center bg-card">
            <p className="text-[10px] text-foreground font-medium text-center leading-snug">
              What is the powerhouse of the cell?
            </p>
          </div>
          
          {/* Green "KNOW" overlay */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-green-500 text-white pointer-events-none"
            style={{ opacity: rightOpacity }}
          >
            <Check className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] font-bold uppercase tracking-wide">Know</span>
          </motion.div>
          
          {/* Yellow "LEARNING" overlay */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-amber-500 text-white pointer-events-none"
            style={{ opacity: leftOpacity }}
          >
            <RotateCcw className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] font-bold uppercase tracking-wide">Learning</span>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Footer with progress */}
      <div className="px-2.5 py-2 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-[8px] text-muted-foreground mb-1">
          <span>Progress</span>
          <span className="text-green-600 dark:text-green-400 font-medium">2 known</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-2/5 bg-green-500 rounded-full" />
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
            className="absolute top-0 left-0 w-[190px] md:w-[210px] rounded-xl bg-card border border-border shadow-lg overflow-hidden"
            initial={{ opacity: 0, x: -30, rotateY: -15, rotateX: 10, rotate: -8 }}
            animate={{ opacity: 1, x: 0, rotateY: -10, rotateX: 5, rotate: -6 }}
            whileHover={{ rotateY: -5, rotateX: 0, translateZ: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="p-3">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">Quiz Settings</span>
              </div>
              
              {/* Settings */}
              <div className="space-y-2.5">
                <div>
                  <div className="text-[9px] text-muted-foreground mb-1 font-medium">Questions</div>
                  <div className="flex gap-1">
                    {[5, 10, 15].map((n, i) => (
                      <div key={n} className={`px-2 py-0.5 rounded-md text-[9px] font-medium border ${i === 1 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-transparent'}`}>
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-muted-foreground mb-1 font-medium">Difficulty</div>
                  <div className="flex gap-1">
                    {[
                      { label: 'Easy', color: 'emerald' },
                      { label: 'Medium', color: 'amber', active: true },
                      { label: 'Hard', color: 'rose' }
                    ].map((d) => (
                      <div key={d.label} className={`px-2 py-0.5 rounded-md text-[9px] font-medium border ${d.active ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' : 'bg-muted/50 text-muted-foreground border-transparent'}`}>
                        {d.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-1">
                  <div className="h-7 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-medium text-primary-foreground">Generate Quiz</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quiz Question Card (Front) */}
          <motion.div
            className="absolute top-4 right-0 w-[200px] md:w-[230px] rounded-xl bg-card border border-border shadow-lg overflow-hidden"
            initial={{ opacity: 0, x: 30, rotateY: 15, rotateX: -5, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotateY: 10, rotateX: -2, rotate: 3 }}
            whileHover={{ rotateY: 5, rotateX: 0, translateZ: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="p-3">
              {/* Question header */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-foreground">Question 3</span>
                  <span className="text-[9px] text-muted-foreground">of 10</span>
                </div>
                <div className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-muted text-muted-foreground">
                  Multiple Choice
                </div>
              </div>
              
              {/* Question text */}
              <div className="mb-3">
                <p className="text-[11px] font-medium text-foreground leading-relaxed">
                  What is the primary function of mitochondria in a cell?
                </p>
              </div>
              
              {/* Answer options */}
              <div className="space-y-1.5">
                {[
                  { letter: 'A', text: 'Energy production', correct: true },
                  { letter: 'B', text: 'Protein synthesis', correct: false },
                  { letter: 'C', text: 'Cell division', correct: false },
                  { letter: 'D', text: 'Waste removal', correct: false },
                ].map((opt, i) => (
                  <motion.div
                    key={i}
                    className={`p-2 rounded-md border text-[10px] flex items-center gap-2 ${
                      opt.correct 
                        ? 'border-green-500/40 bg-green-500/10' 
                        : 'border-border bg-muted/30'
                    }`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.08 }}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-semibold flex-shrink-0 ${
                      opt.correct 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {opt.letter}
                    </span>
                    <span className={`font-medium ${opt.correct ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>
                      {opt.text}
                    </span>
                    {opt.correct && <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto flex-shrink-0" />}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Study Mode Card */}
          <InteractiveFlashcard />

          {/* Subtle floating decorations */}
          <motion.div
            className="absolute -top-2 left-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3 text-primary/60" />
          </motion.div>
          
          <motion.div
            className="absolute top-1/2 -left-2 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            <CheckCircle2 className="w-2.5 h-2.5 text-green-500/60" />
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
              <CheckCircle2 className="w-12 h-12 text-green-500" />
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

function FeatureIllustration({ feature, color }: { feature: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    purple: "#a855f7",
    orange: "#f97316",
    rose: "#f43f5e",
    emerald: "#10b981",
    amber: "#f59e0b",
  };
  const c = colorMap[color] || "#3b82f6";
  
  if (feature === "Multi-Format Upload") {
    return (
      <svg viewBox="0 0 180 140" className="w-full h-full">
        <defs>
          <linearGradient id="uploadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c} stopOpacity="0.1"/>
            <stop offset="100%" stopColor={c} stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <rect x="15" y="10" width="150" height="95" rx="10" fill="url(#uploadGrad)" stroke={c} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8"/>
        <circle cx="90" cy="45" r="18" fill={c} opacity="0.12"/>
        <path d="M90 38 L90 52" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <path d="M84 44 L90 38 L96 44" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <text x="90" y="72" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.5" fontWeight="500">Drop file or click</text>
        <g transform="translate(30, 112)">
          <rect width="35" height="16" rx="8" fill={c} opacity="0.1"/>
          <text x="17.5" y="11" textAnchor="middle" fontSize="7" fill={c} fontWeight="600">PDF</text>
        </g>
        <g transform="translate(72, 112)">
          <rect width="35" height="16" rx="8" fill={c} opacity="0.1"/>
          <text x="17.5" y="11" textAnchor="middle" fontSize="7" fill={c} fontWeight="600">DOC</text>
        </g>
        <g transform="translate(114, 112)">
          <rect width="35" height="16" rx="8" fill={c} opacity="0.1"/>
          <text x="17.5" y="11" textAnchor="middle" fontSize="7" fill={c} fontWeight="600">IMG</text>
        </g>
      </svg>
    );
  }
  
  if (feature === "AI Quiz Generation") {
    return (
      <svg viewBox="0 0 180 140" className="w-full h-full">
        <rect x="15" y="8" width="150" height="124" rx="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
        <rect x="22" y="16" width="40" height="14" rx="7" fill={c}/>
        <text x="42" y="26" textAnchor="middle" fontSize="7" fill="white" fontWeight="600">Q3 / 10</text>
        <rect x="22" y="38" width="136" height="4" rx="2" fill="currentColor" opacity="0.08"/>
        <rect x="22" y="46" width="100" height="4" rx="2" fill="currentColor" opacity="0.08"/>
        <rect x="22" y="60" width="136" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.12"/>
        <circle cx="34" cy="74" r="5" fill="currentColor" opacity="0.08"/>
        <text x="34" y="77" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.4">A</text>
        <rect x="44" y="71" width="80" height="5" rx="2" fill="currentColor" opacity="0.08"/>
        <rect x="22" y="96" width="136" height="28" rx="6" fill={c} opacity="0.08" stroke={c} strokeWidth="1.5"/>
        <circle cx="34" cy="110" r="5" fill={c}/>
        <text x="34" y="113" textAnchor="middle" fontSize="6" fill="white" fontWeight="600">B</text>
        <rect x="44" y="107" width="90" height="5" rx="2" fill={c} opacity="0.2"/>
        <circle cx="146" cy="110" r="6" fill={c}/>
        <path d="M143 110 L145 112 L149 107" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  
  if (feature === "Study Mode") {
    return (
      <svg viewBox="0 0 180 140" className="w-full h-full">
        <rect x="38" y="15" width="104" height="110" rx="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" transform="rotate(-4 90 70)"/>
        <rect x="38" y="15" width="104" height="110" rx="8" fill="none" stroke={c} strokeWidth="1.5"/>
        <text x="90" y="35" textAnchor="middle" fontSize="7" fill={c} fontWeight="600" opacity="0.5" letterSpacing="1">QUESTION</text>
        <rect x="50" y="45" width="80" height="4" rx="2" fill="currentColor" opacity="0.1"/>
        <rect x="58" y="54" width="64" height="4" rx="2" fill="currentColor" opacity="0.08"/>
        <line x1="50" y1="72" x2="130" y2="72" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
        <text x="90" y="92" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.35">tap to flip</text>
        <circle cx="12" cy="70" r="12" fill="#ef4444" opacity="0.08" stroke="#ef4444" strokeWidth="1"/>
        <path d="M8 66 L16 74 M16 66 L8 74" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="12" y="95" textAnchor="middle" fontSize="6" fill="#ef4444" opacity="0.6">Still</text>
        <text x="12" y="102" textAnchor="middle" fontSize="6" fill="#ef4444" opacity="0.6">learning</text>
        <circle cx="168" cy="70" r="12" fill="#22c55e" opacity="0.08" stroke="#22c55e" strokeWidth="1"/>
        <path d="M163 70 L166 73 L173 66" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="168" y="95" textAnchor="middle" fontSize="6" fill="#22c55e" opacity="0.6">Know</text>
        <text x="168" y="102" textAnchor="middle" fontSize="6" fill="#22c55e" opacity="0.6">this</text>
      </svg>
    );
  }
  
  if (feature === "Spaced Repetition") {
    return (
      <svg viewBox="0 0 180 140" className="w-full h-full">
        <rect x="15" y="8" width="150" height="124" rx="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
        <rect x="24" y="18" width="132" height="6" rx="3" fill="currentColor" opacity="0.06"/>
        <rect x="24" y="18" width="88" height="6" rx="3" fill={c} opacity="0.8"/>
        <text x="90" y="38" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5">Revision Round 2 of 3</text>
        <g transform="translate(24, 50)">
          <rect width="60" height="40" rx="6" fill="#22c55e" opacity="0.06" stroke="#22c55e" strokeWidth="1"/>
          <circle cx="18" cy="20" r="7" fill="#22c55e"/>
          <path d="M14 20 L17 23 L22 17" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <text x="40" y="18" textAnchor="middle" fontSize="12" fill="#22c55e" fontWeight="700">4</text>
          <text x="40" y="28" textAnchor="middle" fontSize="6" fill="#22c55e" opacity="0.7">correct</text>
        </g>
        <g transform="translate(96, 50)">
          <rect width="60" height="40" rx="6" fill={c} opacity="0.06" stroke={c} strokeWidth="1"/>
          <circle cx="18" cy="20" r="7" fill={c}/>
          <path d="M14 17 L22 23 M22 17 L14 23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <text x="40" y="18" textAnchor="middle" fontSize="12" fill={c} fontWeight="700">2</text>
          <text x="40" y="28" textAnchor="middle" fontSize="6" fill={c} opacity="0.7">to retry</text>
        </g>
        <rect x="24" y="100" width="132" height="26" rx="6" fill={c}/>
        <text x="90" y="117" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">Retry Missed Questions</text>
      </svg>
    );
  }
  
  if (feature === "Community Sharing") {
    return (
      <svg viewBox="0 0 180 140" className="w-full h-full">
        <rect x="15" y="8" width="150" height="124" rx="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
        <text x="24" y="26" fontSize="9" fill="currentColor" fontWeight="600">Biology Quiz</text>
        <text x="24" y="38" fontSize="7" fill="currentColor" opacity="0.4">10 questions</text>
        <rect x="24" y="48" width="132" height="40" rx="6" fill="currentColor" opacity="0.04"/>
        <rect x="32" y="56" width="90" height="4" rx="2" fill="currentColor" opacity="0.08"/>
        <rect x="32" y="64" width="70" height="4" rx="2" fill="currentColor" opacity="0.06"/>
        <rect x="32" y="72" width="50" height="4" rx="2" fill="currentColor" opacity="0.04"/>
        <rect x="24" y="98" width="70" height="28" rx="6" fill={c}/>
        <path d="M44 109 L44 117 M44 109 L48 113 L44 117 M52 109 L52 117" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <text x="72" y="116" textAnchor="middle" fontSize="8" fill="white" fontWeight="500">Share</text>
        <rect x="102" y="98" width="54" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
        <text x="129" y="116" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.6">Copy link</text>
      </svg>
    );
  }
  
  if (feature === "Streak Tracking") {
    return (
      <svg viewBox="0 0 180 140" className="w-full h-full">
        <rect x="15" y="8" width="150" height="124" rx="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
        <circle cx="90" cy="50" r="28" fill={c} opacity="0.08" stroke={c} strokeWidth="1.5"/>
        <path d="M90 32 Q83 44 86 52 Q80 47 84 60 Q90 56 90 70 Q90 56 96 60 Q100 47 94 52 Q97 44 90 32" fill={c}/>
        <text x="90" y="95" textAnchor="middle" fontSize="22" fill="currentColor" fontWeight="700">7</text>
        <text x="90" y="108" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.45">day streak</text>
        <g transform="translate(27, 118)">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <g key={i} transform={`translate(${i * 18}, 0)`}>
              <circle cx="7" cy="7" r="6" fill={i < 5 ? c : "currentColor"} opacity={i < 5 ? 1 : 0.08}/>
              {i < 5 && <path d="M4 7 L6 9 L10 4" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round"/>}
            </g>
          ))}
        </g>
      </svg>
    );
  }
  
  if (feature === "Pip AI Assistant") {
    return (
      <svg viewBox="0 0 180 140" className="w-full h-full">
        <rect x="15" y="8" width="150" height="124" rx="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
        
        {/* Pip penguin - centered, matching CutePenguin component */}
        <g transform="translate(90, 70)">
          {/* Left flipper */}
          <ellipse cx="-26" cy="2" rx="8" ry="16" fill="#2d3436" transform="rotate(-25 -26 2)"/>
          {/* Right flipper */}
          <ellipse cx="26" cy="2" rx="8" ry="16" fill="#2d3436" transform="rotate(25 26 2)"/>
          {/* Main body - black outer */}
          <ellipse cx="0" cy="5" rx="24" ry="28" fill="#2d3436"/>
          {/* White belly */}
          <ellipse cx="0" cy="8" rx="18" ry="22" fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5"/>
          {/* Head - black */}
          <path d="M-20 -8 Q-20 -28 0 -28 Q20 -28 20 -8 Q20 0 0 0 Q-20 0 -20 -8" fill="#2d3436"/>
          {/* White face area */}
          <ellipse cx="0" cy="-10" rx="14" ry="12" fill="#ffffff"/>
          {/* Left eye white */}
          <ellipse cx="-7" cy="-12" rx="5" ry="6" fill="#ffffff"/>
          {/* Right eye white */}
          <ellipse cx="7" cy="-12" rx="5" ry="6" fill="#ffffff"/>
          {/* Left pupil */}
          <circle cx="-6" cy="-11" r="3" fill="#2d3436"/>
          {/* Right pupil */}
          <circle cx="6" cy="-11" r="3" fill="#2d3436"/>
          {/* Left eye highlight */}
          <circle cx="-4" cy="-13" r="1.2" fill="#ffffff"/>
          {/* Right eye highlight */}
          <circle cx="8" cy="-13" r="1.2" fill="#ffffff"/>
          {/* Orange beak */}
          <ellipse cx="0" cy="-3" rx="3" ry="2" fill="#f97316"/>
          {/* Feet */}
          <ellipse cx="-10" cy="32" rx="6" ry="3" fill="#f97316"/>
          <ellipse cx="10" cy="32" rx="6" ry="3" fill="#f97316"/>
        </g>
        
        {/* Chat bubble - positioned top right, with tail pointing to Pip */}
        <g transform="translate(118, 18)">
          <rect x="0" y="0" width="44" height="32" rx="6" fill={c} opacity="0.12" stroke={c} strokeWidth="1"/>
          <path d="M0 16 L-8 20 L0 24" fill={c} opacity="0.12"/>
          <rect x="6" y="8" width="32" height="3" rx="1.5" fill={c} opacity="0.5"/>
          <rect x="6" y="14" width="24" height="3" rx="1.5" fill={c} opacity="0.4"/>
          <rect x="6" y="20" width="28" height="3" rx="1.5" fill={c} opacity="0.3"/>
        </g>
        
        {/* Ask Pip button - centered below */}
        <g transform="translate(90, 118)">
          <rect x="-28" y="0" width="56" height="20" rx="6" fill={c}/>
          <text x="0" y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">Ask Pip</text>
        </g>
      </svg>
    );
  }
  
  return null;
}

function FeatureShowcase() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const features = [
    {
      icon: Upload,
      title: "Multi-Format Upload",
      description: "PDFs, images, Word, Excel supported.",
      color: "blue",
      details: "Upload any document format and our intelligent parser extracts the text content. For images and scanned documents, our OCR (Optical Character Recognition) technology accurately reads text from photos of textbooks, handwritten notes, and more.",
    },
    {
      icon: Brain,
      title: "AI Quiz Generation",
      description: "AI creates meaningful questions.",
      color: "purple",
      details: "Our AI analyzes your content to generate diverse question types: multiple choice, true/false, and short answer. Questions are designed to test comprehension, not just memorization, with adjustable difficulty levels.",
    },
    {
      icon: BookOpen,
      title: "Study Mode",
      description: "Flashcards with progress tracking.",
      color: "orange",
      details: "Flip through questions as flashcards. Mark each card as 'known' or 'still learning' to track your progress. Cards you're still learning will appear more frequently until you master them.",
    },
    {
      icon: RotateCcw,
      title: "Spaced Repetition",
      description: "Retry missed questions until mastered.",
      color: "rose",
      details: "Questions you answer incorrectly automatically appear in retry rounds. This spaced repetition approach ensures you keep practicing difficult concepts until they stick, maximizing long-term retention.",
    },
    {
      icon: Share2,
      title: "Community Sharing",
      description: "Share and discover public quizzes.",
      color: "emerald",
      details: "Share your quizzes with friends or make them public for others to use. Discover quizzes created by the community, sorted by subject and popularity. Collaborate and learn together.",
    },
    {
      icon: Flame,
      title: "Streak Tracking",
      description: "Build daily learning habits.",
      color: "amber",
      details: "Stay motivated with daily streak tracking. Set personal goals, receive friendly reminders, and watch your consistency grow. Building a study habit has never been more rewarding.",
    },
    {
      icon: MessageCircle,
      title: "Pip AI Assistant",
      description: "Your personal study companion.",
      color: "cyan",
      details: "Meet Pip, your friendly arctic study buddy! Pip understands your quiz context and helps explain difficult concepts, provides hints when you're stuck, and supports math formulas. Pip guides you to the answer without giving it away.",
    },
  ];

  const colorClasses: Record<string, { text: string; border: string; bg: string; glow: string; solidBg: string }> = {
    blue: { text: "text-blue-500", border: "border-blue-500/20", bg: "bg-blue-500/10", glow: "group-hover:shadow-blue-500/20", solidBg: "bg-blue-500" },
    purple: { text: "text-purple-500", border: "border-purple-500/20", bg: "bg-purple-500/10", glow: "group-hover:shadow-purple-500/20", solidBg: "bg-purple-500" },
    orange: { text: "text-orange-500", border: "border-orange-500/20", bg: "bg-orange-500/10", glow: "group-hover:shadow-orange-500/20", solidBg: "bg-orange-500" },
    rose: { text: "text-rose-500", border: "border-rose-500/20", bg: "bg-rose-500/10", glow: "group-hover:shadow-rose-500/20", solidBg: "bg-rose-500" },
    emerald: { text: "text-emerald-500", border: "border-emerald-500/20", bg: "bg-emerald-500/10", glow: "group-hover:shadow-emerald-500/20", solidBg: "bg-emerald-500" },
    amber: { text: "text-amber-500", border: "border-amber-500/20", bg: "bg-amber-500/10", glow: "group-hover:shadow-amber-500/20", solidBg: "bg-amber-500" },
    cyan: { text: "text-cyan-500", border: "border-cyan-500/20", bg: "bg-cyan-500/10", glow: "group-hover:shadow-cyan-500/20", solidBg: "bg-cyan-500" },
  };

  return (
    <motion.div className="relative" layout>
      <AnimatePresence mode="wait">
        {expandedIndex === null ? (
          <motion.div 
            key="grid"
            className="grid gap-4 sm:gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            layout
          >
            {features.map((feature, index) => {
              const colors = colorClasses[feature.color];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.06, type: "spring", stiffness: 100 }}
                  onClick={() => setExpandedIndex(index)}
                  className="flex"
                >
                  <Card className={`w-full group cursor-pointer transition-all duration-300 border ${colors.border} bg-card hover:shadow-xl ${colors.glow} hover:-translate-y-1`}>
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center border ${colors.border} shrink-0`}>
                          <feature.icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-full"
          >
            {(() => {
              const feature = features[expandedIndex];
              const colors = colorClasses[feature.color];
              return (
                <Card className={`w-full border-2 ${colors.border} bg-card shadow-2xl`}>
                  <CardContent className="p-8 relative overflow-hidden">
                    <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full ${colors.bg} blur-3xl opacity-50`} />
                    <div className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full ${colors.bg} blur-3xl opacity-30`} />
                    
                    <div className="relative grid md:grid-cols-2 gap-8 items-center">
                      <div className="order-2 md:order-1">
                        <motion.div 
                          className={`inline-flex w-16 h-16 rounded-2xl ${colors.bg} items-center justify-center mb-6 border ${colors.border}`}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        >
                          <feature.icon className={`w-8 h-8 ${colors.text}`} />
                        </motion.div>
                        
                        <motion.h3 
                          className="text-2xl md:text-3xl font-bold text-foreground mb-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          {feature.title}
                        </motion.h3>
                        
                        <motion.p 
                          className="text-base text-muted-foreground leading-relaxed mb-6"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {feature.details}
                        </motion.p>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                        >
                          <Button
                            variant="outline"
                            onClick={() => setExpandedIndex(null)}
                            className="gap-2"
                            data-testid="button-feature-back"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back to all features
                          </Button>
                        </motion.div>
                      </div>
                      
                      <motion.div 
                        className="order-1 md:order-2 flex items-center justify-center"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                      >
                        <div className={`w-full max-w-[320px] aspect-[4/3] rounded-2xl ${colors.bg} border ${colors.border} p-4 flex items-center justify-center`}>
                          <FeatureIllustration feature={feature.title} color={feature.color} />
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
                <span> Exam Prep Assistant</span>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                Turn exam materials into{" "}
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
                  className="gap-2 w-full sm:w-auto h-12 text-base"
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
      <section className="py-20 md:py-28 bg-muted/30 min-h-[800px] md:min-h-[650px]">
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
