import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Sparkles, FileText, ChevronDown, ChevronUp, Loader2, CheckSquare, ToggleLeft, MessageSquare, Gauge, Import, FileQuestionIcon, Settings2 } from "lucide-react";
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

  // Smooth progress animation with step messages
  useEffect(() => {
    if (isLoading) {
      // Different settings for generate vs import mode
      const isImportMode = mode === "import";
      
      let totalDuration: number;
      let steps: { threshold: number; step: string }[];
      
      if (isImportMode) {
        // Import mode - typically faster, simpler steps
        totalDuration = 12000;
        steps = [
          { threshold: 5, step: "starting" },
          { threshold: 15, step: "scanning" },
          { threshold: 35, step: "parsing" },
          { threshold: 55, step: "identifying" },
          { threshold: 75, step: "validating" },
          { threshold: 90, step: "finalizing" },
        ];
      } else {
        // Generate mode - variable based on settings
        const questionMultiplier = questionCount / 10;
        const difficultyMultiplier = difficulty === "easy" ? 0.7 : difficulty === "medium" ? 1.0 : 1.4;
        const totalMultiplier = Math.max(0.5, questionMultiplier * difficultyMultiplier);
        totalDuration = 15000 * totalMultiplier;
        steps = [
          { threshold: 5, step: "starting" },
          { threshold: 15, step: "reading" },
          { threshold: 30, step: "analyzing" },
          { threshold: 45, step: "preparing" },
          { threshold: 60, step: "generating" },
          { threshold: 75, step: "processing" },
          { threshold: 85, step: "validating" },
          { threshold: 90, step: "finalizing" },
        ];
      }
      
      const updateInterval = 50;
      const maxProgress = 90;

      let startTime = Date.now();
      let currentStepIndex = 0;

      // Clear any existing intervals
      timeoutsRef.current.forEach(t => clearTimeout(t));
      timeoutsRef.current = [];

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const linearProgress = Math.min(elapsed / totalDuration, 1);
        const easedProgress = linearProgress * (2 - linearProgress);
        const progress = Math.min(easedProgress * maxProgress, maxProgress);
        
        setProcessingProgress(progress);
        
        while (currentStepIndex < steps.length && progress >= steps[currentStepIndex].threshold) {
          const step = steps[currentStepIndex].step;
          setCurrentGenerationStep(step);
          setLoadingMessage(getStepMessage(step, isImportMode));
          currentStepIndex++;
        }
        
        if (progress >= maxProgress) {
          clearInterval(interval);
        }
      }, updateInterval);

      timeoutsRef.current.push(interval as unknown as NodeJS.Timeout);

      return () => {
        clearInterval(interval);
        timeoutsRef.current.forEach(t => clearTimeout(t));
        timeoutsRef.current = [];
      };
    }
  }, [isLoading, mode, questionCount, difficulty]);

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
          body: JSON.stringify({ text: extractedText, sourceImageUrl, documentImages: isOfficeWithImages ? documentImages : undefined }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to import quiz");
        }

        const quiz = await response.json();
        setCurrentQuiz(quiz);
        clearJob();
        setExtractedText("");
        setSourceMaterial({ type: null, text: null, imageDataUrl: null, isOfficeWithImages: false, documentImages: [] });
        queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
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
      const body = { 
        text: extractedText, 
        questionCount, 
        questionTypes, 
        difficulty, 
        sourceImageUrl, 
        documentImages: isOfficeWithImages ? documentImages : undefined 
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
                setSourceMaterial({ type: null, text: null, imageDataUrl: null, isOfficeWithImages: false, documentImages: [] });
                queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {isOfficeWithImages ? (
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
                  <h3 className="font-semibold text-lg text-foreground mb-0.5">Visual Document</h3>
                  <p className="text-sm text-muted-foreground">
                    {documentImages.length} image{documentImages.length !== 1 ? 's' : ''} detected for AI analysis
                  </p>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-background/60 rounded-lg p-4 border">
                <div className="flex flex-wrap gap-2 mb-3">
                  {documentImages.slice(0, 4).map((img, index) => (
                    <div key={index} className="w-14 h-14 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                      <img 
                        src={img} 
                        alt={`Document image ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {documentImages.length > 4 && (
                    <div className="w-14 h-14 rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/50">
                      <span className="text-xs text-muted-foreground font-medium">+{documentImages.length - 4}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  AI will analyze text and visual content to generate comprehensive questions
                </p>
              </div>
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
              <div className="bg-white/60 dark:bg-background/60 rounded-lg p-4 border max-h-[300px] overflow-y-auto">
                <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${!showFullText ? "line-clamp-4" : ""}`}>
                  {showFullText ? extractedText : truncatedText}
                  {!showFullText && hasMoreText && "..."}
                </p>
                {hasMoreText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 gap-1 -ml-2"
                    onClick={() => setShowFullText(!showFullText)}
                    data-testid="button-toggle-text"
                  >
                    {showFullText ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show full text
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
            className={`cursor-pointer overflow-visible border-2 transition-all duration-200 hover:shadow-lg ${
              mode === "generate" 
                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                : "border-muted bg-muted/20 hover:border-violet-300"
            }`}
            onClick={() => setMode("generate")}
            data-testid="mode-generate"
          >
            <CardContent className="p-5 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  Generate New Quiz
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI creates new questions from your study material
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  mode === "generate" ? "border-violet-500 bg-violet-500" : "border-muted-foreground/30"
                }`}>
                  {mode === "generate" && <div className="w-2 h-2 rounded-full bg-white" />}
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
            className={`cursor-pointer overflow-visible border-2 transition-all duration-200 hover:shadow-lg ${
              mode === "import" 
                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" 
                : "border-muted bg-muted/20 hover:border-amber-300"
            }`}
            onClick={() => setMode("import")}
            data-testid="mode-import"
          >
            <CardContent className="p-5 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <Import className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  Import Existing Quiz
                </h3>
                <p className="text-sm text-muted-foreground">
                  Parse questions from an exam or worksheet
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  mode === "import" ? "border-amber-500 bg-amber-500" : "border-muted-foreground/30"
                }`}>
                  {mode === "import" && <div className="w-2 h-2 rounded-full bg-white" />}
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
                      className={`p-3 rounded-lg border-2 font-medium transition-all ${
                        difficulty === level 
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
                    { type: "multiple_choice" as QuestionType, icon: CheckSquare, label: "Multiple Choice", desc: "Pick the correct answer", color: "blue" },
                    { type: "true_false" as QuestionType, icon: ToggleLeft, label: "True/False", desc: "Decide if statements are correct", color: "violet" },
                    { type: "short_answer" as QuestionType, icon: MessageSquare, label: "Short Answer", desc: "Write brief responses", color: "orange" }
                  ]).map(({ type, icon: Icon, label, desc, color }) => (
                    <motion.div
                      key={type}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        questionTypes.includes(type)
                          ? color === "blue"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                            : color === "violet"
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                            : "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                      onClick={() => toggleQuestionType(type)}
                      data-testid={`option-${type.replace("_", "-")}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                        color === "blue" ? "bg-blue-500" : color === "violet" ? "bg-violet-500" : "bg-orange-500"
                      }`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Checkbox
                        checked={questionTypes.includes(type)}
                        onCheckedChange={() => toggleQuestionType(type)}
                        className="pointer-events-none"
                      />
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
            size="lg"
            className="w-full gap-2 h-14 text-lg font-semibold"
            data-testid="button-generate-quiz"
          >
            <Sparkles className="h-5 w-5" />
            Generate Quiz
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
          <Card className="border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Import className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">How Import Works</h3>
                  <p className="text-sm text-muted-foreground">
                    AI scans your document to find existing questions and uses its knowledge to identify the correct answers.
                  </p>
                </div>
              </div>
              
              <div className="bg-white/60 dark:bg-background/60 rounded-lg p-4 border">
                <p className="text-sm font-medium text-foreground mb-2">Works best with:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    Multiple choice exams
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    Quiz papers (A, B, C, D)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    Practice tests
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
            size="lg"
            className="w-full gap-2 h-14 text-lg font-semibold bg-amber-500 hover:bg-amber-600"
            data-testid="button-import-quiz"
          >
            <Import className="h-5 w-5" />
            Import Quiz
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
