import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, FileText, Image, Sparkles, ArrowRight, 
  CheckCircle2, Loader2, X, FileUp, Wand2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "@/components/file-upload";
import { useQuiz } from "@/lib/quiz-context";
import { useUpload } from "@/lib/upload-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function Create() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText, sourceMaterial, setSourceMaterial, isLoading } = useQuiz();
  const { activeJob, clearJob } = useUpload();
  const [isReady, setIsReady] = useState(false);
  const redirectedRef = useRef(false);

  // Only redirect to generate page if quiz generation is actively happening (not during upload)
  useEffect(() => {
    if (isLoading && !redirectedRef.current) {
      redirectedRef.current = true;
      setLocation("/generate");
    }
    // Reset ref when not loading
    if (!isLoading) {
      redirectedRef.current = false;
    }
  }, [isLoading, setLocation]);

  useEffect(() => {
    if (extractedText && extractedText.length > 0) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [extractedText]);

  const handleTextExtracted = (text: string, isOfficeWithImages?: boolean, documentImages?: string[]) => {
    setExtractedText(text);
    if (isOfficeWithImages && documentImages && documentImages.length > 0) {
      setSourceMaterial({
        type: "document",
        text: text,
        imageDataUrl: null,
        isOfficeWithImages: true,
        documentImages: documentImages,
      });
    } else if (text) {
      setSourceMaterial({
        type: "document",
        text: text,
        imageDataUrl: null,
        isOfficeWithImages: false,
        documentImages: [],
      });
    }
  };

  const handleContinueToGenerate = () => {
    setLocation("/generate");
  };

  const handleClearText = () => {
    setExtractedText("");  
    setSourceMaterial({ type: null, text: null, imageDataUrl: null, isOfficeWithImages: false, documentImages: [] });
    clearJob();
    setIsReady(false);
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const getPreviewText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Create a New Quiz
          </h1>
          <p className="text-muted-foreground">
            Upload your study materials and let AI generate personalized questions
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            {!isReady ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <FileUpload onTextExtracted={handleTextExtracted} />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-visible border-green-500/30 bg-green-500/5">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Success Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Content Extracted</h3>
                            <p className="text-sm text-muted-foreground">
                              {getWordCount(extractedText || "")} words extracted from your {sourceMaterial?.type === "image" ? "image" : "document"}
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              data-testid="button-clear-text"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the extracted content and you will need to upload it again to generate a quiz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleClearText} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive/30">
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Preview */}
                      {sourceMaterial?.isOfficeWithImages && sourceMaterial?.documentImages && sourceMaterial.documentImages.length > 0 ? (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <p className="text-sm font-medium text-foreground">
                              Document with visual content detected
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {sourceMaterial.documentImages.slice(0, 4).map((img, index) => (
                              <div key={index} className="w-14 h-14 rounded-md overflow-hidden border border-muted bg-muted">
                                <img 
                                  src={img} 
                                  alt={`Document image ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {sourceMaterial.documentImages.length > 4 && (
                              <div className="w-14 h-14 rounded-md border border-muted bg-muted flex items-center justify-center">
                                <span className="text-xs text-muted-foreground font-medium">+{sourceMaterial.documentImages.length - 4}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            AI will analyze charts, diagrams, and images along with text content
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-background border">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {getPreviewText(extractedText || "", 300)}
                          </p>
                        </div>
                      )}

                      {/* File Type Badge */}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          {sourceMaterial?.type === "image" ? (
                            <>
                              <Image className="w-3 h-3" />
                              Image
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              Document
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/10">
                          Ready to generate
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Continue Button */}
        <AnimatePresence>
          {isReady && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <Button
                size="lg"
                onClick={handleContinueToGenerate}
                className="w-full sm:w-auto gap-2 min-w-[200px]"
                data-testid="button-continue-generate"
              >
                <Wand2 className="w-5 h-5" />
                Generate Quiz
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You'll be able to customize question types, difficulty, and more
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips Section */}
        {!isReady && (
          <motion.div variants={itemVariants}>
            <Card className="overflow-visible bg-muted/30 border-muted">
              <CardContent className="p-5">
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Tips for best results
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Use clear, readable documents or images for better text extraction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>More content means more diverse quiz questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Global language support for various regions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Supported Formats */}
        {!isReady && (
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>PDF (slides, notes)</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center gap-1.5">
                <Image className="w-4 h-4" />
                <span>PNG, JPG (phone photos)</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
