import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, BookOpen, Brain, Settings2, Wand2, Sparkles, Save, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CutePenguin } from "@/components/quiz-chatbot";

interface ProgressStep {
  id: string;
  label: string;
  icon: typeof BookOpen;
}

const PROGRESS_STEPS: ProgressStep[] = [
  { id: "starting", label: "Starting", icon: Sparkles },
  { id: "reading", label: "Reading material", icon: BookOpen },
  { id: "analyzing", label: "Analyzing content", icon: Brain },
  { id: "preparing", label: "Preparing generation", icon: Settings2 },
  { id: "generating", label: "Generating questions", icon: Wand2 },
  { id: "processing", label: "Processing response", icon: Sparkles },
  { id: "validating", label: "Validating questions", icon: CheckCircle },
  { id: "finalizing", label: "Finalizing quiz", icon: CheckCircle },
  { id: "saving", label: "Saving quiz", icon: Save },
  { id: "complete", label: "Complete", icon: CheckCircle },
];

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-lg mx-4"
          >
            <div className="bg-card border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-8 text-center">
                <motion.div 
                  className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CutePenguin size={64} emotion="thinking" />
                </motion.div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {mode === "import" ? "Importing Quiz" : "Generating Quiz"}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {message || "Please wait while we prepare your quiz..."}
                </p>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Progress</span>
                    <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {mode === "generate" && (
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {PROGRESS_STEPS.slice(0, 8).map((step) => {
                      const stepIndex = PROGRESS_STEPS.findIndex(s => s.id === step.id);
                      const currentIndex = PROGRESS_STEPS.findIndex(s => s.id === currentStep);
                      const isCompleted = stepIndex < currentIndex;
                      const isCurrent = step.id === currentStep;
                      const StepIcon = step.icon;
                      
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0.5 }}
                          animate={{ 
                            opacity: isCompleted || isCurrent ? 1 : 0.4,
                            scale: isCurrent ? 1.02 : 1,
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-lg text-xs transition-colors ${
                            isCurrent ? "bg-primary/15 text-primary border border-primary/30" : 
                            isCompleted ? "bg-primary/5 text-primary/80" : "text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                          ) : (
                            <StepIcon className="h-4 w-4 shrink-0" />
                          )}
                          <span className="truncate font-medium">{step.label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
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
    </AnimatePresence>
  );
}
