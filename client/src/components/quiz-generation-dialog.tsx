import { useLanguage } from "@/lib/language-context";
import { localizeProgressMessage } from "@/lib/localized-progress";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import logoImage from "@assets/image-removebg-preview_(2)_1769320540513.png";

function AnimatedLogo() {
  const { t } = useLanguage();
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
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
        <img
          src={logoImage}
          alt={t("common.footer")}
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </motion.div>
    </div>
  );
}

interface QuizGenerationDialogProps {
  isOpen: boolean;
  progress: number;
  currentStep: string;
  message: string;
  notice?: string;
  mode: "generate" | "import";
}

export function QuizGenerationDialog({
  isOpen,
  progress,
  currentStep,
  message,
  notice,
  mode,
}: QuizGenerationDialogProps) {
  const { t, tArray } = useLanguage();
  const studyTips = tArray('quizGeneration.studyTips');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const [estimatedProgress, setEstimatedProgress] = useState(0);

  // Imports do not stream progress. Keep their estimate local so it cannot
  // overwrite server updates or the completed state in the quiz context.
  useEffect(() => {
    setEstimatedProgress(0);
    if (!isOpen || mode !== "import") return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setEstimatedProgress(90 * (1 - Math.exp(-(Date.now() - startTime) / 12000)));
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen, mode]);

  useEffect(() => {
    if (isOpen) {
      setCurrentTipIndex(Math.floor(Math.random() * studyTips.length));
    }
  }, [isOpen, studyTips.length]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % studyTips.length);
        setTipVisible(true);
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, [isOpen, studyTips.length]);

  if (!isOpen) return null;

  const stepMessage = localizeProgressMessage(message, t, mode === 'import' ? 'quizGeneration.importingQuestions' : ['starting', 'reading', 'analyzing', 'preparing', 'generating', 'processing', 'validating', 'finalizing', 'saving', 'complete'].includes(currentStep) ? `quizGeneration.${currentStep}` : 'quizGeneration.default');
  const safeProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
  const roundedProgress = Math.round(Math.max(safeProgress, mode === "import" ? estimatedProgress : 0));

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <div className="fixed inset-0 bg-background/85 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-sm mx-4"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-8 text-center">
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                  <AnimatedLogo />
                </div>

                {/* Title */}
                <h2 className="text-sm font-semibold text-foreground mb-5 tracking-wide">
                  {mode === "import" ? t("quizGeneration.importing") : t("quizGeneration.creating")}
                </h2>

                {/* Percentage */}
                <p className="text-2xl font-bold text-foreground tabular-nums mb-4">
                  {roundedProgress}%
                </p>

                {/* Progress Bar */}
                <div
                  role="progressbar"
                  aria-label={mode === "import" ? t("quizGeneration.importProgress") : t("quizGeneration.generationProgress")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={roundedProgress}
                  aria-valuetext={`${roundedProgress}%: ${stepMessage}`}
                  className="w-full bg-border/60 rounded-full h-2 mb-4 overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${roundedProgress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>

                <p role="status" className="text-xs text-muted-foreground min-h-[1rem]">
                  {stepMessage}
                </p>

                {notice && (
                  <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                    {localizeProgressMessage(notice, t, 'quizGeneration.validating')}
                  </p>
                )}
              </div>

              {/* Study Tips */}
              <div className="px-8 pb-8">
                <div className="w-full h-px bg-border mb-5" />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Lightbulb className="w-3.5 h-3.5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 text-left min-h-[3rem] flex items-center">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentTipIndex}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: tipVisible ? 1 : 0, x: tipVisible ? 0 : -10 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.5 }}
                        className="text-xs text-muted-foreground leading-relaxed italic"
                      >
                        {studyTips[currentTipIndex]}
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
