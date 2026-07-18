import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Sparkles, FileText, ChevronDown, ChevronUp, Loader2, Import, FileQuestionIcon, ArrowRight, BookText, Gauge, CheckSquare, ToggleLeft, MessageSquare, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useQuiz } from "@/lib/quiz-context";
import { useUpload } from "@/lib/upload-context";
import { motion, AnimatePresence } from "framer-motion";
import { QuizGenerationDialog } from "@/components/quiz-generation-dialog";
import { useToast } from "@/hooks/use-toast";

type QuizMode = "generate" | "import";
const MAX_SOURCE_IMAGES = 5;

async function getResponseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return typeof data?.message === "string" && data.message.trim() ? data.message : fallback;
  } catch {
    return fallback;
  }
}

export function QuizGenerator() {
  const [, setLocation] = useLocation();
  const {
    extractedText, setExtractedText,
    sourceMaterial, setSourceMaterial,
    setCurrentQuiz,
    setIsLoading, isLoading,
    setLoadingMessage, loadingMessage,
    processingProgress, setProcessingProgress,
    currentGenerationStep, setCurrentGenerationStep
  } = useQuiz();
  const { clearJob } = useUpload();
  const { toast } = useToast();
  const [showFullText, setShowFullText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<QuizMode>("generate");

  const isOfficeWithImages = sourceMaterial?.isOfficeWithImages || false;
  const documentImages = sourceMaterial?.documentImages || [];
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [questionTypes, setQuestionTypes] = useState<Array<"multiple_choice" | "true_false" | "short_answer">>(["multiple_choice", "true_false"]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const showGenerationFailure = (title: string, error: unknown, fallback: string) => {
    const message = error instanceof Error && error.message.trim() ? error.message : fallback;
    setError(message);
    toast({
      title,
      description: message,
      variant: "destructive",
    });
  };

  const toggleQuestionType = (type: "multiple_choice" | "true_false" | "short_answer") => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  // Simulated progress for import mode only (no SSE).
  // Generate mode gets real progress from SSE events.
  useEffect(() => {
    if (!isLoading || mode !== "import") return;

    const steps = [
      { threshold: 10, step: "starting" },
      { threshold: 25, step: "scanning" },
      { threshold: 45, step: "parsing" },
      { threshold: 65, step: "identifying" },
      { threshold: 80, step: "validating" },
      { threshold: 90, step: "finalizing" },
    ];

    const totalDuration = 3000;
    const maxProgress = 90;
    const startTime = Date.now();
    let currentStepIndex = 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / totalDuration, 1);
      const eased = t * (2 - t);
      const progress = Math.min(eased * maxProgress, maxProgress);

      setProcessingProgress(progress);

      while (currentStepIndex < steps.length && progress >= steps[currentStepIndex].threshold) {
        const step = steps[currentStepIndex].step;
        setCurrentGenerationStep(step);
        setLoadingMessage(getStepMessage(step, true));
        currentStepIndex++;
      }

      if (progress >= maxProgress) clearInterval(interval);
    }, 50);

    timeoutsRef.current.push(interval as unknown as NodeJS.Timeout);

    return () => {
      clearInterval(interval);
      timeoutsRef.current.forEach(t => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, [isLoading, mode]);

  const getStepMessage = (step: string, isImportMode: boolean = false): string => {
    if (isImportMode) {
      const importMessages: Record<string, string> = {
        starting: "Starting quiz import...",
        scanning: "Scanning your document...",
        parsing: "Parsing questions and options...",
        identifying: "AI is identifying correct answers...",
        validating: "Validating parsed questions...",
        finalizing: "Finalizing your quiz...",
        saving: "Saving your quiz...",
        complete: "Quiz imported successfully!",
      };
      return importMessages[step] || "Processing...";
    }

    const messages: Record<string, string> = {
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
    return messages[step] || "Processing...";
  };

  const generateQuiz = async () => {
    if (!extractedText) return;

    const selectedImageCount = documentImages.length + (sourceMaterial.imageDataUrl ? 1 : 0);
    if (selectedImageCount > MAX_SOURCE_IMAGES) {
      const excessCount = selectedImageCount - MAX_SOURCE_IMAGES;
      setError(
        `You selected ${selectedImageCount} images. Remove ${excessCount} image${excessCount === 1 ? "" : "s"} before generating. A maximum of ${MAX_SOURCE_IMAGES} images is allowed.`,
      );
      return;
    }

    setError(null);
    setIsLoading(true);
    setProcessingProgress(0);
    setCurrentGenerationStep("reading");

    if (mode === "import") {
      setLoadingMessage("AI is parsing your questions and finding answers...");
      // Use non-streaming endpoint for import mode
      try {
        const sourceImageUrl = sourceMaterial.type === "image" ? sourceMaterial.imageDataUrl : null;
        const response = await fetch("/api/import-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractedText, sourceImageUrl, documentImages: documentImages.length > 0 ? documentImages : undefined }),
        });

        if (!response.ok) {
          throw new Error(await getResponseErrorMessage(response, "Failed to import quiz"));
        }

        const quiz = await response.json();

        // Show completion
        setProcessingProgress(100);
        setCurrentGenerationStep("complete");
        setLoadingMessage("Quiz imported successfully!");
        await new Promise(resolve => setTimeout(resolve, 500));

        setCurrentQuiz(quiz);
        clearJob();
        setExtractedText("");
        // Preserve documentImages for viewing in quiz player
        setSourceMaterial({
          type: sourceMaterial.type,
          text: null,
          imageDataUrl: sourceMaterial.imageDataUrl,
          isOfficeWithImages: sourceMaterial.isOfficeWithImages,
          documentImages: documentImages
        });
        await queryClient.resetQueries({ queryKey: ["/api/quizzes"] });
        setLocation("/history");
      } catch (err) {
        showGenerationFailure("Quiz import failed", err, "An error occurred while importing the quiz");
      } finally {
        setIsLoading(false);
        setLoadingMessage("");
        setProcessingProgress(0);
        setCurrentGenerationStep("");
      }
      return;
    }

    // Use streaming endpoint for generate mode
    try {
      const sourceImageUrl = sourceMaterial.type === "image" ? sourceMaterial.imageDataUrl : null;
      const isImageOnly = sourceMaterial.isImageOnly === true;
      const body = {
        text: extractedText,
        questionCount: Number(questionCount),
        questionTypes: questionTypes,
        difficulty,
        sourceImageUrl,
        documentImages: documentImages.length > 0 ? documentImages : undefined,
        isImageOnly,
      };

      const response = await fetch("/api/generate-quiz-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, "Failed to start quiz generation"));
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let generationCompleted = false;

      const handleSseLine = async (line: string) => {
        if (!line.startsWith("data: ")) return;

        let data: any;
        try {
          data = JSON.parse(line.slice(6));
        } catch (parseError) {
          console.warn("[SSE] Ignoring malformed event:", parseError);
          return;
        }

        console.log("[SSE] Received:", data);

        if (data.type === "progress") {
          console.log("[SSE] Progress update:", data.step, data.progress);
          setProcessingProgress(data.progress);
          setCurrentGenerationStep(data.step);
          setLoadingMessage(data.message);
        } else if (data.type === "complete") {
          generationCompleted = true;

          // Show final completion steps
          setProcessingProgress(98);
          setCurrentGenerationStep("saving");
          setLoadingMessage("Saving your quiz...");

          // Brief pause to show saving state
          await new Promise(resolve => setTimeout(resolve, 500));

          setProcessingProgress(100);
          setCurrentGenerationStep("complete");
          setLoadingMessage("Quiz created successfully!");

          // Another brief pause before redirect
          await new Promise(resolve => setTimeout(resolve, 800));

          setCurrentQuiz(data.quiz);
          clearJob();
          setExtractedText("");
          // Preserve documentImages for viewing in quiz player
          setSourceMaterial({
            type: sourceMaterial.type,
            text: null,
            imageDataUrl: sourceMaterial.imageDataUrl,
            isOfficeWithImages: sourceMaterial.isOfficeWithImages,
            documentImages: documentImages
          });
          await queryClient.resetQueries({ queryKey: ["/api/quizzes"] });
          setLocation("/history");
        } else if (data.type === "error") {
          const message = typeof data.message === "string" && data.message.trim()
            ? data.message
            : "Quiz generation failed";
          throw new Error(message);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          await handleSseLine(line);
        }
      }

      buffer += decoder.decode();
      if (buffer.trim()) {
        for (const line of buffer.split("\n")) {
          await handleSseLine(line);
        }
      }

      if (!generationCompleted) {
        throw new Error("Quiz generation stopped before completion. Please try again.");
      }
    } catch (err) {
      showGenerationFailure("Quiz generation failed", err, "An error occurred while generating the quiz");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setProcessingProgress(0);
      setCurrentGenerationStep("");
    }
  };

  const truncatedText = extractedText?.substring(0, 300) || "";
  const hasMoreText = (extractedText?.length || 0) > 300;

  // Check if we have images to display (from document images or single image upload)
  const singleImageUrl = sourceMaterial?.imageDataUrl;
  const allImages = [...(singleImageUrl ? [singleImageUrl] : []), ...documentImages];
  const hasVisualContent = allImages.length > 0;
  const [showTextInstead, setShowTextInstead] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const removeImage = (index: number, imageUrl: string) => {
    if (allImages.length === 1 && sourceMaterial.isImageOnly) {
      setError("Keep at least one image to generate a quiz from image-only material.");
      return;
    }

    const hasSingleImage = Boolean(singleImageUrl);
    const removingSingleImage = hasSingleImage && index === 0;
    const documentImageIndex = index - (hasSingleImage ? 1 : 0);
    const nextDocumentImages = removingSingleImage
      ? documentImages
      : documentImages.filter((_, currentIndex) => currentIndex !== documentImageIndex);
    const nextSingleImage = removingSingleImage ? null : sourceMaterial.imageDataUrl;
    const nextImageCount = nextDocumentImages.length + (nextSingleImage ? 1 : 0);

    setSourceMaterial({
      ...sourceMaterial,
      imageDataUrl: nextSingleImage,
      documentImages: nextDocumentImages,
      isOfficeWithImages: nextDocumentImages.length > 0,
      isImageOnly: sourceMaterial.isImageOnly && nextImageCount > 0,
    });

    if (expandedImage === imageUrl) {
      setExpandedImage(null);
    }

    if (nextImageCount <= MAX_SOURCE_IMAGES) {
      setError(null);
    } else {
      const excessCount = nextImageCount - MAX_SOURCE_IMAGES;
      setError(
        `Remove ${excessCount} more image${excessCount === 1 ? "" : "s"} before generating. A maximum of ${MAX_SOURCE_IMAGES} images is allowed.`,
      );
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedImage}
                alt="Expanded view"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setExpandedImage(null)}
                data-testid="button-close-expanded"
              >
                <ChevronUp className="h-4 w-4 rotate-45" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasVisualContent && !showTextInstead ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-cyan-200 dark:border-cyan-800/50 bg-cyan-50/50 dark:bg-cyan-950/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground mb-0.5">Your Study Material</h3>
                  <p className="text-sm text-muted-foreground">
                    {allImages.length} image{allImages.length !== 1 ? 's' : ''} ready for AI analysis
                  </p>
                </div>
              </div>

              {/* Image Grid Gallery */}
              <div className="bg-background/40 dark:bg-background/20 rounded-2xl p-3 border border-border/50 backdrop-blur-sm shadow-inner">
                <div className={`grid gap-2.5 ${allImages.length === 1 ? "grid-cols-1" :
                  allImages.length === 2 ? "grid-cols-2" :
                    "grid-cols-3 sm:grid-cols-4"
                  }`}>
                  {allImages.map((img, index) => (
                    <motion.div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border/50 shadow-sm cursor-pointer group"
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setExpandedImage(img)}
                    >
                      <img
                        src={img}
                        alt={`Document page ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 bg-white/90 dark:bg-black/80 rounded-full p-2.5 shadow-xl">
                          <FileQuestionIcon className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="absolute right-2 top-2 z-50 inline-flex h-9 items-center gap-1.5 rounded-full border border-white bg-red-500 p-2.5 text-xs font-black text-white shadow-xl transition-transform hover:scale-105 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeImage(index, img);
                        }}
                        aria-label={`Remove image ${index + 1}`}
                        data-testid={`button-remove-source-image-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Toggle to show text */}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground mb-0.5">Your Study Material</h3>
                  <p className="text-sm text-muted-foreground">
                    {extractedText?.length.toLocaleString()} characters ready for quiz generation
                  </p>
                </div>
              </div>
              <div className="bg-background/40 dark:bg-background/20 rounded-2xl p-4 border border-border/50 backdrop-blur-sm shadow-inner max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                <p className={`text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap ${!showFullText ? "line-clamp-4" : ""}`}>
                  {showFullText ? extractedText : truncatedText}
                  {!showFullText && hasMoreText && "..."}
                </p>
                {hasMoreText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-8 gap-2 rounded-lg bg-background/50 border border-border/50 text-xs font-bold uppercase tracking-wider hover:bg-background transition-colors"
                    onClick={() => setShowFullText(!showFullText)}
                    data-testid="button-toggle-text"
                  >
                    {showFullText ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Expand Full Text
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Card
            className={`group relative overflow-hidden cursor-pointer border-2 transition-all duration-500 hover:shadow-2xl ${mode === "generate"
              ? "border-violet-500 bg-violet-500/[0.03] shadow-violet-500/10"
              : "border-border/50 bg-background/50 hover:border-violet-300"
              }`}
            onClick={() => setMode("generate")}
            data-testid="mode-generate"
          >
            {/* Active Highlight */}
            {mode === "generate" && (
              <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500" />
            )}

            <CardContent className="p-6 flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 ${mode === "generate" ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-black text-xl tracking-tight mb-0.5 ${mode === "generate" ? "text-violet-600 dark:text-violet-400" : "text-foreground"}`}>
                  Smart Practice
                </h3>
                <p className="text-sm font-medium text-muted-foreground leading-snug">
                  Prepetual creates original questions based on your specific notes.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${mode === "generate" ? "border-violet-500 bg-violet-500" : "border-muted-foreground/30"
                  }`}>
                  {mode === "generate" && <div className="w-2.5 h-2.5 rounded-full bg-white animate-in zoom-in duration-300" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
        >
          <Card
            className={`group relative overflow-hidden cursor-pointer border-2 transition-all duration-500 hover:shadow-2xl ${mode === "import"
              ? "border-amber-500 bg-amber-500/[0.03] shadow-amber-500/10"
              : "border-border/50 bg-background/50 hover:border-amber-300"
              }`}
            onClick={() => setMode("import")}
            data-testid="mode-import"
          >
            {/* Active Highlight */}
            {mode === "import" && (
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
            )}

            <CardContent className="p-6 flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 ${mode === "import" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                <Import className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-black text-xl tracking-tight mb-0.5 ${mode === "import" ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                  Import Questions
                </h3>
                <p className="text-sm font-medium text-muted-foreground leading-snug">
                  Already have an exam? Prepetual can scan it and find the answers.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${mode === "import" ? "border-amber-500 bg-amber-500" : "border-muted-foreground/30"
                  }`}>
                  {mode === "import" && <div className="w-2.5 h-2.5 rounded-full bg-white animate-in zoom-in duration-300" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {mode === "generate" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <Card className="border-2 border-muted">
            <CardHeader className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-black">Quiz Options</CardTitle>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Control the number of questions, difficulty, and quiz format before generating.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Number of Questions</Label>
                  <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {questionCount}
                  </span>
                </div>
                <Slider
                  value={[questionCount]}
                  onValueChange={([value]) => setQuestionCount(value)}
                  min={3}
                  max={20}
                  step={1}
                  className="w-full"
                  data-testid="slider-question-count"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>3</span>
                  <span>20</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Difficulty Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["easy", "medium", "hard"] as Array<"easy" | "medium" | "hard">).map((level) => (
                    <Button
                      key={level}
                      variant={difficulty === level ? "default" : "outline"}
                      className={`capitalize ${difficulty === level ? "toggle-elevated" : ""}`}
                      onClick={() => setDifficulty(level)}
                      data-testid={`button-difficulty-${level}`}
                    >
                      <Gauge className="h-4 w-4 mr-2" />
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Question Types</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    className={`flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all ${questionTypes.includes("multiple_choice") ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
                    onClick={() => toggleQuestionType("multiple_choice")}
                    data-testid="option-multiple-choice"
                  >
                    <Checkbox
                      checked={questionTypes.includes("multiple_choice")}
                      onCheckedChange={() => toggleQuestionType("multiple_choice")}
                      className="pointer-events-none"
                    />
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-semibold">Multiple Choice</div>
                        <p className="text-xs text-muted-foreground">4 options per question</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all ${questionTypes.includes("true_false") ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
                    onClick={() => toggleQuestionType("true_false")}
                    data-testid="option-true-false"
                  >
                    <Checkbox
                      checked={questionTypes.includes("true_false")}
                      onCheckedChange={() => toggleQuestionType("true_false")}
                      className="pointer-events-none"
                    />
                    <div className="flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4 text-quiz-purple" />
                      <div>
                        <div className="font-semibold">True / False</div>
                        <p className="text-xs text-muted-foreground">Binary judgment questions</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all ${questionTypes.includes("short_answer") ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
                    onClick={() => toggleQuestionType("short_answer")}
                    data-testid="option-short-answer"
                  >
                    <Checkbox
                      checked={questionTypes.includes("short_answer")}
                      onCheckedChange={() => toggleQuestionType("short_answer")}
                      className="pointer-events-none"
                    />
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-quiz-orange" />
                      <div>
                        <div className="font-semibold">Short Answer</div>
                        <p className="text-xs text-muted-foreground">Open-ended recall questions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg"
              >
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={generateQuiz}
            disabled={isLoading}
            size="xl"
            className="w-full gap-3 h-16 text-xl font-black rounded-2xl  shadow-primary/200  transition-all group overflow-hidden relative"
            data-testid="button-generate-quiz"
          >
            Generate Quiz
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      )}

      {mode === "import" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden border-2 border-amber-500/20">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Import className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-2xl tracking-tight text-foreground">Smart Import</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Already have a test? Prepetual will scan it, recognize the questions, and verify the correct answers for you.
                  </p>
                </div>
              </div>

              <div className="bg-amber-500/5 rounded-2xl p-6 border border-amber-500/10">
                <p className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-4 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
                  Perfect For
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-bold text-foreground/80">Multiple Choice</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-bold text-foreground/80">Quiz Papers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-bold text-foreground/80">Worksheets</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg"
              >
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={generateQuiz}
            disabled={isLoading}
            size="xl"
            className="w-full gap-3 h-16 text-xl font-black rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all bg-amber-500 hover:bg-amber-600 group"
            data-testid="button-import-quiz"
          >
            <Import className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
            Import Quiz
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      )}

      <QuizGenerationDialog
        isOpen={isLoading}
        progress={processingProgress}
        currentStep={currentGenerationStep}
        message={loadingMessage}
        mode={mode}
      />
    </div>
  );
}
