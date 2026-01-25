import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import logoImage from "@assets/image-removebg-preview_(2)_1769320540513.png";

const STEP_MESSAGES: Record<string, string> = {
  starting: "Starting quiz generation...",
  reading: "Reading your study material...",
  analyzing: "Analyzing content structure...",
  preparing: "Preparing quiz generation...",
  generating: "AI is generating questions...",
  processing: "Processing AI response...",
  validating: "Validating generated questions...",
  finalizing: "Finalizing your quiz...",
  saving: "Saving your quiz...",
  complete: "Quiz created successfully!",
};

function AnimatedLogo() {
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute inset-4 rounded-full bg-yellow-400/10 blur-lg"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
      
      <motion.div
        className="relative w-full h-full"
        animate={{
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
          <defs>
            <mask id="logoMask">
              <image 
                href={logoImage} 
                x="0" 
                y="0" 
                width="100" 
                height="100" 
                preserveAspectRatio="xMidYMid meet"
              />
            </mask>
            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="30%" stopColor="white" stopOpacity="0.6" />
              <stop offset="50%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <image 
            href={logoImage} 
            x="0" 
            y="0" 
            width="100" 
            height="100" 
            preserveAspectRatio="xMidYMid meet"
            filter="url(#glow)"
          />
          
          <g mask="url(#logoMask)">
            <motion.rect
              y="0"
              width="35"
              height="100"
              fill="url(#trailGradient)"
              initial={{ x: -45 }}
              animate={{ x: 145 }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}

const STUDY_TIPS = [
  "Break your study sessions into 25-minute chunks with short breaks in between.",
  "Teaching someone else what you've learned is one of the best ways to retain information.",
  "Get enough sleep! Your brain consolidates memories while you rest.",
  "Use active recall instead of just re-reading notes. Quiz yourself frequently!",
  "Connect new information to things you already know to create stronger memories.",
  "Study in different locations to help your brain form more associations.",
  "Handwriting notes can improve retention compared to typing them.",
  "Stay hydrated! Even mild dehydration can impair cognitive function.",
  "Review material right before sleep for better memory consolidation.",
  "Use mnemonics and memory palaces for memorizing lists and sequences.",
  "Exercise regularly - it increases blood flow to the brain and improves focus.",
  "Eliminate distractions during study time. Put your phone in another room!",
  "Use the Feynman Technique: explain concepts in simple terms as if teaching a child.",
  "Space out your studying over time instead of cramming all at once.",
  "Test yourself on material before you think you're ready - it strengthens recall.",
];

interface QuizGenerationDialogProps {
  isOpen: boolean;
  progress: number;
  currentStep: string;
  message: string;
  mode: "generate" | "import";
}

export function QuizGenerationDialog({ 
  isOpen, 
  progress, 
  currentStep, 
  message,
  mode 
}: QuizGenerationDialogProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentTipIndex(Math.floor(Math.random() * STUDY_TIPS.length));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % STUDY_TIPS.length);
        setTipVisible(true);
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const stepMessage = STEP_MESSAGES[currentStep] || message || "Processing...";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <div className="fixed inset-0 bg-background/90 backdrop-blur-lg" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            <div className="bg-card border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-8 text-center">
                <div className="mb-8 flex justify-center">
                  <AnimatedLogo />
                </div>

                <h2 className="text-xl font-semibold text-foreground mb-6">
                  {mode === "import" ? "Importing Your Quiz" : "Generating Your Quiz"}
                </h2>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 [&>div]:transition-all [&>div]:duration-100 [&>div]:ease-out" />
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-muted-foreground mt-3"
                  >
                    {stepMessage}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="bg-muted/50 border-t px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-h-[3rem]">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Study Tip</p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentTipIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: tipVisible ? 1 : 0, y: tipVisible ? 0 : -10 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm text-foreground leading-relaxed"
                      >
                        {STUDY_TIPS[currentTipIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
