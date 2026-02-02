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
  const { extractedText, setExtractedText, setSourceMaterial, isLoading, sourceMaterial } = useQuiz();
  const { activeJobs, isAnyProcessing, isAllCompleted, getCombinedText, getCombinedDocumentImages, hasOfficeWithImages, hasImageOnlyUploads } = useUpload();
  const redirectedRef = useRef(false);

  const isProcessing = isAnyProcessing();
  // For image-only uploads, there's no text, so check for imageDataUrl too
  const completedJobs = activeJobs.filter(job => job.status === "completed" && (job.text || job.isImageOnly || job.imageDataUrl));
  const hasCompletedJobs = completedJobs.length > 0;

  // Capture completed job data into quiz context if not already set
  useEffect(() => {
    const allCompleted = isAllCompleted();
    const hasImages = hasOfficeWithImages();
    const isImageOnlyMode = hasImageOnlyUploads();
    const combinedImages = getCombinedDocumentImages();
    
    // For image-only uploads (PNG/JPG), set source material with images only (no text)
    if (allCompleted && hasCompletedJobs && isImageOnlyMode && !sourceMaterial.isImageOnly) {
      setExtractedText("[Images uploaded - AI will analyze visually]");
      setSourceMaterial({
        type: "image",
        text: null,
        imageDataUrl: null,
        isOfficeWithImages: true,
        documentImages: combinedImages,
        isImageOnly: true,
      });
    } 
    // For documents with text
    else if (allCompleted && hasCompletedJobs && !extractedText && !isImageOnlyMode) {
      const combinedText = getCombinedText();
      
      setExtractedText(combinedText);
      setSourceMaterial({
        type: "document",
        text: combinedText,
        imageDataUrl: null,
        isOfficeWithImages: hasImages,
        documentImages: combinedImages,
        isImageOnly: false,
      });
    }
  }, [isAllCompleted, hasCompletedJobs, extractedText, getCombinedText, getCombinedDocumentImages, hasOfficeWithImages, hasImageOnlyUploads, setExtractedText, setSourceMaterial, sourceMaterial.isImageOnly]);

  useEffect(() => {
    // Only redirect to create if no extracted text AND no active jobs AND not generating quiz
    if (!extractedText && !isProcessing && !hasCompletedJobs && !isLoading && !redirectedRef.current) {
      redirectedRef.current = true;
      setLocation("/create");
    }
    // Reset ref when there is content or processing or completed jobs
    if (extractedText || isProcessing || hasCompletedJobs || isLoading) {
      redirectedRef.current = false;
    }
  }, [extractedText, isProcessing, hasCompletedJobs, isLoading, setLocation]);

  if (!extractedText && !isProcessing && !hasCompletedJobs && !isLoading) {
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
