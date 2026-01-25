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
    if (isLoading && mode === "generate") {
      const questionMultiplier = questionCount / 10;
      const difficultyMultiplier = difficulty === "easy" ? 0.7 : difficulty === "medium" ? 1.0 : 1.4;
      const totalMultiplier = Math.max(0.5, questionMultiplier * difficultyMultiplier);
      
      // Total duration for the animation (will cap at 90%)
      const totalDuration = 15000 * totalMultiplier;
      const updateInterval = 50; // Update every 50ms for smooth animation
      const maxProgress = 90;
      
      // Step thresholds for messages
      const steps = [
        { threshold: 5, step: "starting" },
        { threshold: 15, step: "reading" },
        { threshold: 30, step: "analyzing" },
        { threshold: 45, step: "preparing" },
        { threshold: 60, step: "generating" },
        { threshold: 75, step: "processing" },
        { threshold: 85, step: "validating" },
        { threshold: 90, step: "finalizing" },
      ];

      let startTime = Date.now();
      let currentStepIndex = 0;

      // Clear any existing intervals
      timeoutsRef.current.forEach(t => clearTimeout(t));
      timeoutsRef.current = [];

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        // Use easeOutQuad for natural deceleration as it approaches max
        const linearProgress = Math.min(elapsed / totalDuration, 1);
        const easedProgress = linearProgress * (2 - linearProgress); // easeOutQuad
        const progress = Math.min(easedProgress * maxProgress, maxProgress);
        
        setProcessingProgress(progress);
        
        // Update step message when crossing thresholds
        while (currentStepIndex < steps.length && progress >= steps[currentStepIndex].threshold) {
          const step = steps[currentStepIndex].step;
          setCurrentGenerationStep(step);
          setLoadingMessage(getStepMessage(step));
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

  const getStepMessage = (step: string): string => {
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
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Visual Document Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background rounded-md p-4 border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Office Document with Visual Content</p>
                    <p className="text-sm text-muted-foreground">
                      {documentImages.length} image{documentImages.length !== 1 ? 's' : ''} and graphics detected
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {documentImages.slice(0, 4).map((img, index) => (
                    <div key={index} className="w-16 h-16 rounded-md overflow-hidden border border-muted bg-muted">
                      <img 
                        src={img} 
                        alt={`Document image ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {documentImages.length > 4 && (
                    <div className="w-16 h-16 rounded-md border border-muted bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-medium">+{documentImages.length - 4}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  AI will analyze both text and visual content (charts, diagrams, images) to generate comprehensive quiz questions.
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Extracted Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-md p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {showFullText ? extractedText : truncatedText}
                  {!showFullText && hasMoreText && "..."}
                </p>
                {hasMoreText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 gap-1"
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
              <p className="text-xs text-muted-foreground mt-2">
                {extractedText?.length.toLocaleString()} characters extracted
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileQuestionIcon className="h-5 w-5 text-quiz-purple" />
              Quiz Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-md border-2 cursor-pointer transition-all text-center
                  ${mode === "generate" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-muted-foreground/30"
                  }
                `}
                onClick={() => setMode("generate")}
                data-testid="mode-generate"
              >
                <Sparkles className="h-6 w-6 text-quiz-purple" />
                <div>
                  <p className="text-lg font-medium">Generate New Quiz</p>
                  <p className="text-sm text-muted-foreground">Create new questions from your study material</p>
                </div>
              </div>

              <div
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-md border-2 cursor-pointer transition-all text-center
                  ${mode === "import" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-muted-foreground/30"
                  }
                `}
                onClick={() => setMode("import")}
                data-testid="mode-import"
              >
                <Import className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-lg font-medium">Import Existing Quiz</p>
                  <p className="text-sm text-muted-foreground">Parse questions from an exam or worksheet</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {mode === "generate" && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-quiz-purple" />
              Quiz Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                {(["easy", "medium", "hard"] as DifficultyLevel[]).map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? "default" : "outline"}
                    className={`capitalize toggle-elevate ${difficulty === level ? "toggle-elevated" : ""}`}
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
                  className={`
                    flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all
                    ${questionTypes.includes("multiple_choice") 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-muted-foreground/30"
                    }
                  `}
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
                    <span className="text-sm font-medium">Multiple Choice</span>
                  </div>
                </div>

                <div
                  className={`
                    flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all
                    ${questionTypes.includes("true_false") 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-muted-foreground/30"
                    }
                  `}
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
                    <span className="text-sm font-medium">True/False</span>
                  </div>
                </div>

                <div
                  className={`
                    flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all
                    ${questionTypes.includes("short_answer") 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-muted-foreground/30"
                    }
                  `}
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
                    <span className="text-sm font-medium">Short Answer</span>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-destructive/10 border border-destructive/30 rounded-md"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={generateQuiz}
              disabled={isLoading || (mode === "generate" && questionTypes.length === 0)}
              className="w-full py-6 text-lg font-semibold"
              data-testid="button-generate-quiz"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Quiz
            </Button>
          </CardContent>
        </Card>
      </motion.div>
      )}

      {mode === "import" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Import className="h-5 w-5 text-primary" />
                Import Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The AI will scan your document to find existing questions and answer options.
                It will use its knowledge to identify the correct answer for each question.
              </p>
              
              <div className="bg-muted/50 rounded-md p-4">
                <p className="text-xs text-muted-foreground">
                  Works best with:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Multiple choice exams and worksheets</li>
                  <li>Quiz papers with labeled options (A, B, C, D)</li>
                  <li>Practice tests and assessment materials</li>
                </ul>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-destructive/10 border border-destructive/30 rounded-md"
                  >
                    <p className="text-sm text-destructive">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={generateQuiz}
                disabled={isLoading}
                className="w-full py-6 text-lg font-semibold"
                data-testid="button-import-quiz"
              >
                <Import className="h-5 w-5 mr-2" />
                Import Quiz
              </Button>
            </CardContent>
          </Card>
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
