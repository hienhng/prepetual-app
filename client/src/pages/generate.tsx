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
    // Only redirect to create if no content AND no active jobs AND not generating quiz
    const hasContent = extractedText || sourceMaterial.isImageOnly;
    if (!hasContent && !isProcessing && !hasCompletedJobs && !isLoading && !redirectedRef.current) {
      redirectedRef.current = true;
      setLocation("/create");
    }
    // Reset ref when there is content or processing or completed jobs
    if (hasContent || isProcessing || hasCompletedJobs || isLoading) {
      redirectedRef.current = false;
    }
  }, [extractedText, sourceMaterial.isImageOnly, isProcessing, hasCompletedJobs, isLoading, setLocation]);

  const hasContent = extractedText || sourceMaterial.isImageOnly;
  if (!hasContent && !isProcessing && !hasCompletedJobs && !isLoading) {
    return null;
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-primary/5 rounded-full blur-[140px]"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[28rem] h-[28rem] bg-violet-500/5 rounded-full blur-[130px]"
          animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/create")}
                className="gap-2 px-4 h-10 rounded-xl hover:bg-background/80 hover:shadow-sm border border-transparent hover:border-border/50 text-muted-foreground hover:text-foreground transition-all"
                data-testid="button-back-home"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-full border border-border/50 shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Material Processed & Ready
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="relative inline-flex mb-2 group">
              <div className="absolute -inset-2 bg-violet-500/20 rounded-2xl blur-xl transition-all duration-500 group-hover:bg-violet-500/30" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
                <Wand2 className="w-8 h-8 text-white stroke-[2.5]" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              Customize Your <span className="text-primary">Practice</span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto">
              Set your preferences and let Prepetual build the perfect quiz for you.
            </p>
          </motion.div>

          <QuizGenerator />
        </motion.div>
      </div>
    </div>
  );
}
