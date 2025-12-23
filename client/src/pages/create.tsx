import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, FileText, Image, Sparkles, ArrowRight, 
  CheckCircle2, Loader2, X, FileUp, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "@/components/file-upload";
import { useQuiz } from "@/lib/quiz-context";

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
  const { extractedText, setExtractedText, sourceMaterial } = useQuiz();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setExtractedText("");
    setIsReady(false);
  }, []);

  useEffect(() => {
    if (extractedText && extractedText.length > 0) {
      setIsReady(true);
    }
  }, [extractedText]);

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
  };

  const handleContinueToGenerate = () => {
    setLocation("/generate");
  };

  const handleClearText = () => {
    setExtractedText("");
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
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleClearText}
                          data-testid="button-clear-text"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Preview */}
                      <div className="p-4 rounded-lg bg-background border">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {getPreviewText(extractedText || "", 300)}
                        </p>
                      </div>

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
                    <span>Works with both English and Vietnamese content</span>
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
                <span>PDF</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center gap-1.5">
                <Image className="w-4 h-4" />
                <span>PNG, JPG</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
