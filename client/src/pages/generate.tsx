import { useLocation } from "wouter";
import { ArrowLeft, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizGenerator } from "@/components/quiz-generator";
import { useQuiz } from "@/lib/quiz-context";
import { useUpload } from "@/lib/upload-context";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function Generate() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText, setSourceMaterial, isLoading } = useQuiz();
  const { activeJob } = useUpload();
  const redirectedRef = useRef(false);

  const isProcessing = activeJob?.status === "pending" || activeJob?.status === "processing";
  const hasCompletedJob = activeJob?.status === "completed" && activeJob?.text;

  // Capture completed job data into quiz context if not already set
  useEffect(() => {
    if (hasCompletedJob && !extractedText) {
      setExtractedText(activeJob.text || "");
      if (activeJob.isOfficeWithImages && activeJob.documentImages && activeJob.documentImages.length > 0) {
        setSourceMaterial({
          type: "document",
          text: activeJob.text || "",
          imageDataUrl: null,
          isOfficeWithImages: true,
          documentImages: activeJob.documentImages,
        });
      } else {
        setSourceMaterial({
          type: "document",
          text: activeJob.text || "",
          imageDataUrl: null,
          isOfficeWithImages: false,
          documentImages: [],
        });
      }
    }
  }, [hasCompletedJob, extractedText, activeJob, setExtractedText, setSourceMaterial]);

  useEffect(() => {
    // Only redirect to create if no extracted text AND no active job (processing OR completed with text) AND not generating quiz
    if (!extractedText && !isProcessing && !hasCompletedJob && !isLoading && !redirectedRef.current) {
      redirectedRef.current = true;
      setLocation("/create");
    }
    // Reset ref when there is content or processing or completed job
    if (extractedText || isProcessing || hasCompletedJob || isLoading) {
      redirectedRef.current = false;
    }
  }, [extractedText, isProcessing, hasCompletedJob, isLoading, setLocation]);

  if (!extractedText && !isProcessing && !hasCompletedJob && !isLoading) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-5"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/create")}
            className="gap-2 -ml-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 mb-1">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Configure Your Quiz
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choose your quiz settings and let AI do the rest
          </p>
        </motion.div>

        <QuizGenerator />
      </motion.div>
    </div>
  );
}
