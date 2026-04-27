import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Sparkles, FileText, ChevronDown, ChevronUp, Loader2, CheckSquare, ToggleLeft, MessageSquare, Gauge, Import, FileQuestionIcon, Settings2, ArrowRight, Cpu } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useQuiz } from "@/lib/quiz-context";
import { useUpload } from "@/lib/upload-context";
import { motion, AnimatePresence } from "framer-motion";
import { QuizGenerationDialog } from "@/components/quiz-generation-dialog";
import type { QuestionType, DifficultyLevel } from "@shared/schema";

type QuizMode = "generate" | "import";

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
  const [showFullText, setShowFullText] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["multiple_choice", "true_false"]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<QuizMode>("generate");

  const isOfficeWithImages = sourceMaterial?.isOfficeWithImages || false;
  const documentImages = sourceMaterial?.documentImages || [];
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

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

  const toggleQuestionType = (type: QuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const generateQuiz = async () => {
    if (!extractedText) return;

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
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to import quiz");
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
        setError(err instanceof Error ? err.message : "An error occurred while importing the quiz");
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
        questionCount,
        questionTypes,
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
        throw new Error("Failed to start quiz generation");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("[SSE] Received:", data);

              if (data.type === "progress") {
                console.log("[SSE] Progress update:", data.step, data.progress);
                setProcessingProgress(data.progress);
                setCurrentGenerationStep(data.step);
                setLoadingMessage(data.message);
              } else if (data.type === "complete") {
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
                throw new Error(data.message);
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while generating the quiz");
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
  const allImages = singleImageUrl ? [singleImageUrl] : documentImages;
  const hasVisualContent = allImages.length > 0;
  const [showTextInstead, setShowTextInstead] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

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
                  <Sparkles className="w-6 h-6 text-white" />
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
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-3 text-center">
                  Click to inspect pages
                </p>
              </div>

              {/* Toggle to show text */}
              {extractedText && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 gap-1"
                  onClick={() => setShowTextInstead(true)}
                  data-testid="button-show-text"
                >
                  <FileText className="h-4 w-4" />
                  View extracted text
                </Button>
              )}
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

              {/* Toggle back to images */}
              {hasVisualContent && showTextInstead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 gap-1"
                  onClick={() => setShowTextInstead(false)}
                  data-testid="button-show-images"
                >
                  <Sparkles className="h-4 w-4" />
                  View images
                </Button>
              )}
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
            <CardContent className="p-5 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
                    <Settings2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Number of Questions</h3>
                    <p className="text-xs text-muted-foreground">Choose between 3-20 questions</p>
                  </div>
                  <span className="ml-auto text-xl font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-4 py-1.5 rounded-full">
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
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md">
                    <Gauge className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Difficulty Level</h3>
                    <p className="text-xs text-muted-foreground">How challenging should the quiz be?</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { level: "easy" as DifficultyLevel, color: "green", label: "Easy" },
                    { level: "medium" as DifficultyLevel, color: "amber", label: "Medium" },
                    { level: "hard" as DifficultyLevel, color: "red", label: "Hard" }
                  ]).map(({ level, color, label }) => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-lg border-2 font-medium transition-all ${difficulty === level
                        ? color === "green"
                          ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
                          : color === "amber"
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                            : "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
                        : "border-muted hover:border-muted-foreground/30 text-muted-foreground"
                        }`}
                      onClick={() => setDifficulty(level)}
                      data-testid={`button-difficulty-${level}`}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shadow-md">
                    <CheckSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Question Types</h3>
                    <p className="text-xs text-muted-foreground">Select one or more types</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {([
                    { type: "multiple_choice" as QuestionType, icon: CheckSquare, label: "Multiple Choice", desc: "A, B, C or D", color: "blue" },
                    { type: "true_false" as QuestionType, icon: ToggleLeft, label: "True / False", desc: "Right or Wrong", color: "violet" },
                    { type: "short_answer" as QuestionType, icon: MessageSquare, label: "Short Answer", desc: "Write it out", color: "orange" }
                  ]).map(({ type, icon: Icon, label, desc, color }) => (
                    <motion.div
                      key={type}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex flex-col gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${questionTypes.includes(type)
                        ? color === "blue"
                          ? "border-blue-500 bg-blue-500/[0.03] shadow-lg shadow-blue-500/5"
                          : color === "violet"
                            ? "border-violet-500 bg-violet-500/[0.03] shadow-lg shadow-violet-500/5"
                            : "border-orange-500 bg-orange-500/[0.03] shadow-lg shadow-orange-500/5"
                        : "border-border/50 bg-background/50 hover:border-muted-foreground/30"
                        }`}
                      onClick={() => toggleQuestionType(type)}
                      data-testid={`option-${type.replace("_", "-")}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${color === "blue" ? "bg-blue-500" : color === "violet" ? "bg-violet-500" : "bg-orange-500"
                          }`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <Checkbox
                          checked={questionTypes.includes(type)}
                          onCheckedChange={() => toggleQuestionType(type)}
                          className={`pointer-events-none rounded-full ${questionTypes.includes(type) ? "border-transparent bg-foreground" : "border-border"
                            }`}
                        />
                      </div>
                      <div>
                        <p className={`font-black text-sm tracking-tight ${questionTypes.includes(type) ? "text-foreground" : "text-muted-foreground"}`}>
                          {label}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                          {desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
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
            disabled={isLoading || questionTypes.length === 0}
            size="xl"
            className="w-full gap-3 h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all group overflow-hidden relative"
            data-testid="button-generate-quiz"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out opacity-20" />
            <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
            Prepare Practice Quiz
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
            Import Practice Quiz
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
