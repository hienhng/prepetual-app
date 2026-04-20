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

function PremiumProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative pt-2 pb-6">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50"
        >
          Engine Status
        </motion.span>
        <motion.div 
          key={Math.round(progress)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1.5"
        >
          <span className="text-lg font-black text-primary tabular-nums tracking-tighter">
            {Math.round(progress)}
          </span>
          <span className="text-[10px] font-bold text-primary/40 mt-1">%</span>
        </motion.div>
      </div>
      
      <div className="relative h-2 w-full bg-primary/5 rounded-full overflow-hidden border border-white/[0.03]">
        {/* Background shimmer */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent w-1/2"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Active progress bar */}
        <motion.div 
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            boxShadow: `0 0 20px hsl(var(--primary) / 0.4), inset 0 1px 1px rgba(255,255,255,0.3)`
          }}
        >
          {/* Animated gradient strip */}
          <div className="absolute inset-0 bg-[length:20px_20px] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] animate-[shine_1s_linear_infinite]" />
        </motion.div>
        
        {/* Leading edge glow */}
        <motion.div 
          className="absolute inset-y-0 w-8 blur-md bg-white/40"
          initial={{ left: "0%" }}
          animate={{ left: `calc(${progress}% - 16px)` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Particle spark at tip */}
        <motion.div 
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-white rounded-full shadow-[0_0_15px_#fff] z-10"
          initial={{ left: "0%" }}
          animate={{ left: `calc(${progress}% - 3px)` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      {/* Decorative dots below */}
      <div className="flex justify-between mt-3 px-0.5 opacity-20">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className={`w-1 h-1 rounded-full transition-colors duration-500 ${
              (i + 1) * 10 <= progress ? 'bg-primary' : 'bg-white/20'
            }`} 
          />
        ))}
      </div>
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
            className="relative z-10 w-full max-w-sm mx-4"
          >
            <div className="relative bg-black/40 border border-white/5 rounded-[2.5rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl">
              {/* Animated orbital glow */}
              <motion.div 
                className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full"
                animate={{
                  x: [0, 100, 0],
                  y: [0, 50, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full"
                animate={{
                  x: [0, -80, 0],
                  y: [0, -40, 0],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />

              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
              
              <div className="p-8 pt-10 text-center relative z-10">
                <div className="mb-8 flex justify-center">
                  <AnimatedLogo />
                </div>

                <h2 className="text-xl font-bold tracking-tight text-white mb-2 font-brand uppercase tracking-widest text-[14px]">
                  {mode === "import" ? "Perfecting Your Quiz" : "Crafting Your Quiz"}
                </h2>

                <PremiumProgressBar progress={progress} />

                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-[11px] font-bold text-primary/60 tracking-[0.15em] uppercase min-h-[1.25rem]"
                  >
                    {stepMessage}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="px-8 pb-8 pt-0 relative z-10 flex flex-col items-center">
                <div className="w-full h-px bg-white/5 mb-6" />
                <div className="flex items-start gap-4 px-4">
                  <div className="mt-0.5 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Lightbulb className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 text-left min-h-[3.5rem] flex items-center">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentTipIndex}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: tipVisible ? 1 : 0, x: tipVisible ? 0 : -10 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.5 }}
                        className="text-[11px] text-white/40 leading-relaxed italic font-medium"
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
