import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, FileText, ChevronDown, ChevronUp, Loader2, CheckSquare, ToggleLeft, MessageSquare, Gauge, Import, FileQuestionIcon, Settings2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useQuiz } from "@/lib/quiz-context";
import { motion, AnimatePresence } from "framer-motion";
import type { QuestionType, DifficultyLevel } from "@shared/schema";

type QuizMode = "generate" | "import";

export function QuizGenerator() {
  const [, setLocation] = useLocation();
  const { extractedText, setCurrentQuiz, setIsLoading, isLoading, setLoadingMessage, loadingMessage } = useQuiz();
  const [showFullText, setShowFullText] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["multiple_choice", "true_false"]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<QuizMode>("generate");

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
    
    if (mode === "import") {
      setLoadingMessage("AI is parsing your questions and finding answers...");
    } else {
      setLoadingMessage("AI is analyzing your content...");
    }

    try {
      const endpoint = mode === "import" ? "/api/import-quiz" : "/api/generate-quiz";
      const body = mode === "import" 
        ? { text: extractedText }
        : { text: extractedText, questionCount, questionTypes, difficulty };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process quiz");
      }

      const quiz = await response.json();
      setCurrentQuiz(quiz);
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setLocation("/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while processing the quiz");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const truncatedText = extractedText?.substring(0, 300) || "";
  const hasMoreText = (extractedText?.length || 0) > 300;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
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
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {loadingMessage || "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Quiz
                </>
              )}
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
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {loadingMessage || "Importing..."}
                  </>
                ) : (
                  <>
                    <Import className="h-5 w-5 mr-2" />
                    Import Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
