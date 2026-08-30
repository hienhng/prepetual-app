import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  FileText, Image, Sparkles, ArrowRight,
  CheckCircle2, Loader2, X, Wand2,
  Type, Youtube, Link, AlertCircle, FileUp, Zap, Layers, Eye, Trash2, SendHorizontal,
  Gauge, CheckSquare, ToggleLeft, MessageSquare, Import
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/file-upload";
import { QuizGenerator } from "@/components/quiz-generator";
import { composeSourceMaterialText, useQuiz, type SourceMaterial } from "@/lib/quiz-context";
import { useUpload } from "@/lib/upload-context";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

function getRandomPromptIndex(total: number, currentIndex: number = -1) {
  if (total <= 1) return 0;
  if (currentIndex < 0 || currentIndex >= total) return Math.floor(Math.random() * total);

  const candidate = Math.floor(Math.random() * (total - 1));
  return candidate >= currentIndex ? candidate + 1 : candidate;
}

type ActiveModal = "upload" | "manual" | "youtube" | null;
const RESET_CREATE_SESSION_KEY = "reset_create_session_after_generation";

export default function Create() {
  const [, setLocation] = useLocation();
  const {
    extractedText, setExtractedText,
    sourceMaterial, setSourceMaterial,
    resetQuiz,
    setIsLoading, isLoading,
    setLoadingMessage,
    setProcessingProgress,
    setCurrentGenerationStep
  } = useQuiz();
  const { toast } = useToast();
  const { t, tArray, language } = useLanguage();
  const { activeJobs, clearJobs } = useUpload();
  const examplePrompts = tArray('create.examplePrompts');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [showUploadCloseWarning, setShowUploadCloseWarning] = useState(false);
  const [quizPrompt, setQuizPrompt] = useState(sourceMaterial.prompt || (sourceMaterial.type === "prompt" ? extractedText || "" : ""));
  const [animatedPrompt, setAnimatedPrompt] = useState("");
  const [examplePromptIndex, setExamplePromptIndex] = useState(() => getRandomPromptIndex(examplePrompts.length));
  const [isDeletingExample, setIsDeletingExample] = useState(false);
  const [manualText, setManualText] = useState(sourceMaterial.manualText || "");
  const [youtubeUrl, setYoutubeUrl] = useState(sourceMaterial.youtubeUrl || "");
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const resetOnMountRef = useRef(
    typeof window !== "undefined" && sessionStorage.getItem(RESET_CREATE_SESSION_KEY) === "1",
  );
  // Track if a modal was opened from within the side panel (prevents disruptive panel toggle)
  const [modalFromPanel, setModalFromPanel] = useState(false);

  // Quiz Configuration Settings State
  const [quizMode, setQuizMode] = useState<"generate" | "import">("generate");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionTypes, setQuestionTypes] = useState<Array<"multiple_choice" | "true_false" | "short_answer">>(["multiple_choice", "true_false"]);

  useEffect(() => {
    if (!resetOnMountRef.current) return;
    resetOnMountRef.current = false;
    sessionStorage.removeItem(RESET_CREATE_SESSION_KEY);
    resetQuiz();
    void clearJobs();
    setQuizPrompt("");
    setManualText("");
    setYoutubeUrl("");
    setYoutubeError(null);
    setIsSourcesPanelOpen(false);
    setIsSettingsPanelOpen(false);
  }, []);

  const samplePrompt = t('create.samplePrompt');
  const materialText = composeSourceMaterialText(sourceMaterial);
  const hasUploadedSource = Boolean(sourceMaterial.uploadedText?.trim() || sourceMaterial.documentImages?.length || sourceMaterial.imageDataUrl);
  const hasManualSource = Boolean(sourceMaterial.manualText?.trim());
  const hasYoutubeSource = Boolean(sourceMaterial.youtubeTranscript?.trim());
  const hasPromptSource = Boolean(sourceMaterial.prompt?.trim());
  const hasInvalidPromptDraft = quizPrompt.trim().length > 0 && quizPrompt.trim().length < 3;

  const totalSourcesCount = [hasUploadedSource, hasManualSource, hasYoutubeSource, hasPromptSource].filter(Boolean).length;
  const isReady = totalSourcesCount > 0 && !resetOnMountRef.current;

  const toggleQuestionType = (type: "multiple_choice" | "true_false" | "short_answer") => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  useEffect(() => {
    setAnimatedPrompt("");
    setIsDeletingExample(false);
    setExamplePromptIndex(getRandomPromptIndex(examplePrompts.length));
  }, [language]);

  useEffect(() => {
    if (quizPrompt || examplePrompts.length === 0) return;

    const currentIndex = examplePromptIndex % examplePrompts.length;
    const targetPrompt = examplePrompts[currentIndex];

    if (typeof window.matchMedia === "function" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (animatedPrompt !== targetPrompt) setAnimatedPrompt(targetPrompt);
      return;
    }

    let delay = 0;
    let nextStep: () => void;

    if (!isDeletingExample && animatedPrompt.length < targetPrompt.length) {
      delay = 35 + Math.random() * 35;
      nextStep = () => setAnimatedPrompt(targetPrompt.slice(0, animatedPrompt.length + 1));
    } else if (!isDeletingExample) {
      delay = 1800;
      nextStep = () => setIsDeletingExample(true);
    } else if (animatedPrompt.length > 0) {
      delay = 18 + Math.random() * 14;
      nextStep = () => setAnimatedPrompt((current) => current.slice(0, -1));
    } else {
      delay = 350;
      nextStep = () => {
        setExamplePromptIndex(getRandomPromptIndex(examplePrompts.length, currentIndex));
        setIsDeletingExample(false);
      };
    }

    const timeoutId = window.setTimeout(nextStep, delay);
    return () => window.clearTimeout(timeoutId);
  }, [animatedPrompt, examplePromptIndex, examplePrompts, isDeletingExample, quizPrompt]);

  useEffect(() => {
    if (isReady) return;
    setIsSourcesPanelOpen(false);
    setIsSettingsPanelOpen(false);
  }, [isReady]);

  const getEditableSourceMaterial = (): SourceMaterial => {
    return sourceMaterial;
  };

  const syncSources = (nextMaterial: SourceMaterial) => {
    const sourceForComposition = { ...nextMaterial, text: null };
    const combinedMaterialText = composeSourceMaterialText(sourceForComposition);
    const prompt = nextMaterial.prompt?.trim() || "";
    const hasImages = Boolean(nextMaterial.documentImages?.length || nextMaterial.imageDataUrl);
    const type = hasImages
      ? (combinedMaterialText ? "document" : "image")
      : combinedMaterialText
        ? "document"
        : prompt
          ? "prompt"
          : null;
    const normalized: SourceMaterial = {
      ...sourceForComposition,
      type,
      text: combinedMaterialText || prompt || null,
      isImageOnly: hasImages && !combinedMaterialText,
      autoGenerate: false,
    };

    setSourceMaterial(normalized);
    setExtractedText(normalized.text || "");
  };

  const openSourceModal = (modal: ActiveModal) => {
    setIsSourcesPanelOpen(false);
    setModalFromPanel(false);
    setActiveModal(modal);
  };

  // Called from within the panel's quick-add buttons — keep panel open after upload
  const openSourceModalFromPanel = (modal: ActiveModal) => {
    setModalFromPanel(true);
    setActiveModal(modal);
    // Don't close the panel — modal will layer on top
  };

  const handleTextExtracted = (text: string, hasImages?: boolean, documentImages?: string[], isImageOnly?: boolean) => {
    const sourceText = isImageOnly && !text
      ? "[Images uploaded - AI will analyze visually]"
      : text;

    const wasFromPanel = modalFromPanel;
    setModalFromPanel(false);
    setActiveModal(null);
    syncSources({
      ...getEditableSourceMaterial(),
      uploadedText: isImageOnly ? null : sourceText,
      imageDataUrl: null,
      isOfficeWithImages: hasImages && documentImages && documentImages.length > 0,
      documentImages: documentImages || [],
    });
    // Only auto-open the panel if this was a fresh upload (not triggered from within the panel)
    if (!wasFromPanel) {
      setIsSourcesPanelOpen(true);
    }
  };

  const handleUploadDialogOpenChange = (open: boolean) => {
    if (open) {
      clearJobs(); // clear stale completed jobs so FileUpload mounts cleanly
      setActiveModal("upload");
      return;
    }

    setActiveModal(null);
  };

  const handleManualTextSubmit = () => {
    if (manualText.trim().length < 50) {
      return;
    }
    const wasFromPanel = modalFromPanel;
    setModalFromPanel(false);
    setActiveModal(null);
    syncSources({
      ...getEditableSourceMaterial(),
      manualText: manualText.trim(),
    });
    if (!wasFromPanel) {
      setIsSourcesPanelOpen(true);
    }
  };

  const handlePromptSubmit = () => {
    const prompt = quizPrompt.trim();
    if (prompt.length < 3 || prompt.length > 1000) return;

    syncSources({
      ...getEditableSourceMaterial(),
      prompt,
    });
    setIsSourcesPanelOpen(true);
  };

  const handlePromptKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handlePromptSubmit();
    }
  };

  const handleSamplePrompt = () => {
    if (examplePrompts.length === 0) {
      setQuizPrompt(samplePrompt);
      return;
    }

    const currentIndex = examplePromptIndex % examplePrompts.length;
    const nextIndex = getRandomPromptIndex(examplePrompts.length, currentIndex);
    setExamplePromptIndex(nextIndex);
    setQuizPrompt(examplePrompts[nextIndex]);
  };

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      setYoutubeError(t('create.youtubeLink'));
      return;
    }

    setIsLoadingYoutube(true);
    setYoutubeError(null);

    try {
      const response = await fetch("/api/youtube-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        setYoutubeError(t('results.reviewFailed'));
        return;
      }

      if (!response.ok) {
        setYoutubeError(data.message || "Failed to fetch video transcript");
        return;
      }

      setActiveModal(null);
      syncSources({
        ...getEditableSourceMaterial(),
        youtubeTranscript: data.text,
        youtubeUrl: youtubeUrl.trim(),
      });
      setIsSourcesPanelOpen(true);
    } catch {
      setYoutubeError(t('results.reviewFailed'));
    } finally {
      setIsLoadingYoutube(false);
    }
  };

  const handleContinueToGenerate = () => {
    if (hasInvalidPromptDraft) return;
    if (quizPrompt.trim()) {
      syncSources({
        ...getEditableSourceMaterial(),
        prompt: quizPrompt.trim(),
      });
      setIsSourcesPanelOpen(true);
      return;
    }
    if (isReady) setIsSourcesPanelOpen(true);
  };

  const handleStartGeneration = async () => {
    const sourcePrompt = sourceMaterial.prompt?.trim() || "";
    const materialText = composeSourceMaterialText(sourceMaterial);
    const documentImages = sourceMaterial?.documentImages || [];
    const hasSourceImages = documentImages.length > 0 || Boolean(sourceMaterial.imageDataUrl);

    if (!isReady || (!materialText && !sourcePrompt && !hasSourceImages)) {
      toast({
        title: "No source material",
        description: "Please add study materials or a prompt before generating a quiz.",
        variant: "destructive",
      });
      return;
    }

    setIsSourcesPanelOpen(false);
    setIsLoading(true);
    setProcessingProgress(0);
    setCurrentGenerationStep("reading");

    if (quizMode === "import") {
      setLoadingMessage("AI is parsing your questions and finding answers...");
      try {
        const sourceImageUrl = sourceMaterial.type === "image" ? sourceMaterial.imageDataUrl : null;
        const response = await fetch("/api/import-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: materialText,
            sourceImageUrl,
            documentImages: documentImages.length > 0 ? documentImages : undefined
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || "Failed to import quiz");
        }

        await response.json();
        setProcessingProgress(100);
        setCurrentGenerationStep("complete");
        setLoadingMessage("Quiz imported successfully!");
        await new Promise(r => setTimeout(r, 500));

        sessionStorage.setItem(RESET_CREATE_SESSION_KEY, "1");
        await clearJobs();
        resetQuiz();
        await queryClient.resetQueries({ queryKey: ["/api/quizzes"] });
        setLocation("/history");
      } catch (err) {
        toast({
          title: "Quiz import failed",
          description: err instanceof Error ? err.message : "Failed to import quiz",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setLoadingMessage("");
        setProcessingProgress(0);
        setCurrentGenerationStep("");
      }
      return;
    }

    try {
      const sourceImageUrl = sourceMaterial.type === "image" ? sourceMaterial.imageDataUrl : null;
      const isImageOnly = !materialText && hasSourceImages;
      const body = {
        materialText: materialText || undefined,
        prompt: sourcePrompt || undefined,
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
        throw new Error("Failed to start quiz generation");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to read response");

      const decoder = new TextDecoder();
      let buffer = "";
      let generationCompleted = false;

      const handleSseLine = async (line: string) => {
        if (!line.startsWith("data: ")) return;
        let data: any;
        try { data = JSON.parse(line.slice(6)); } catch { return; }

        if (data.type === "progress") {
          setProcessingProgress(data.progress);
          setCurrentGenerationStep(data.step);
          setLoadingMessage(data.message);
        } else if (data.type === "complete") {
          generationCompleted = true;
          setProcessingProgress(98);
          setCurrentGenerationStep("saving");
          setLoadingMessage("Saving your quiz...");
          await new Promise(r => setTimeout(r, 500));

          setProcessingProgress(100);
          setCurrentGenerationStep("complete");
          setLoadingMessage("Quiz created successfully!");
          await new Promise(r => setTimeout(r, 800));

          sessionStorage.setItem(RESET_CREATE_SESSION_KEY, "1");
          await clearJobs();
          resetQuiz();
          await queryClient.resetQueries({ queryKey: ["/api/quizzes"] });
          setLocation("/history");
        } else if (data.type === "error") {
          throw new Error(data.message || "Quiz generation failed");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) { await handleSseLine(line); }
      }

      buffer += decoder.decode();
      if (buffer.trim()) {
        for (const line of buffer.split("\n")) { await handleSseLine(line); }
      }

      if (!generationCompleted) {
        throw new Error("Quiz generation stopped before completion.");
      }
    } catch (err) {
      toast({
        title: "Quiz generation failed",
        description: err instanceof Error ? err.message : "Error generating quiz",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setProcessingProgress(0);
      setCurrentGenerationStep("");
    }
  };

  const handleClearText = () => {
    setExtractedText("");
    setSourceMaterial({ type: null, text: null, imageDataUrl: null, isOfficeWithImages: false, documentImages: [], uploadedText: null, manualText: null, youtubeTranscript: null, youtubeUrl: null, prompt: null });
    clearJobs();
    setQuizPrompt("");
    setManualText("");
    setYoutubeUrl("");
    setYoutubeError(null);
    setIsSourcesPanelOpen(false);
  };

  const handleRemoveSource = (source: "upload" | "manual" | "youtube" | "prompt") => {
    const next = { ...getEditableSourceMaterial() };
    if (source === "upload") {
      next.uploadedText = null;
      next.imageDataUrl = null;
      next.documentImages = [];
      next.isOfficeWithImages = false;
      clearJobs();
    } else if (source === "manual") {
      next.manualText = null;
      setManualText("");
    } else if (source === "youtube") {
      next.youtubeTranscript = null;
      next.youtubeUrl = null;
      setYoutubeUrl("");
      setYoutubeError(null);
    } else {
      next.prompt = null;
      setQuizPrompt("");
    }
    syncSources(next);
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const getPreviewText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const inputOptions = [
    {
      id: "upload" as const,
      title: t('create.uploadDocs'),
      description: t('create.uploadDocsDesc'),
      icon: FileUp,
      gradient: "from-blue-600 to-indigo-700",
      iconBg: "bg-blue-600",
      border: "border-blue-500/30 hover:border-blue-500/70 dark:border-blue-400/25 dark:hover:border-blue-400/60",
      surface: "bg-blue-500/[0.13]",
      shadow: "shadow-[0_7px_0_-2px_rgba(37,99,235,0.22),0_22px_45px_-24px_rgba(37,99,235,0.65)] hover:shadow-[0_9px_0_-2px_rgba(37,99,235,0.3),0_28px_55px_-24px_rgba(37,99,235,0.75)]",
      iconShadow: "shadow-[0_8px_20px_-8px_rgba(37,99,235,0.9)] ring-blue-400/30",
      accent: "bg-blue-400",
      isActive: hasUploadedSource,
    },
    {
      id: "manual" as const,
      title: t('create.pasteNotes'),
      description: t('create.pasteNotesDesc'),
      icon: Type,
      gradient: "from-violet-600 to-purple-700",
      iconBg: "bg-violet-600",
      border: "border-violet-500/30 hover:border-violet-500/70 dark:border-violet-400/25 dark:hover:border-violet-400/60",
      surface: "bg-gradient-to-br from-violet-500/[0.13] via-card/95 to-purple-500/[0.06]",
      shadow: "shadow-[0_7px_0_-2px_rgba(124,58,237,0.22),0_22px_45px_-24px_rgba(124,58,237,0.65)] hover:shadow-[0_9px_0_-2px_rgba(124,58,237,0.3),0_28px_55px_-24px_rgba(124,58,237,0.75)]",
      iconShadow: "shadow-[0_8px_20px_-8px_rgba(124,58,237,0.9)] ring-violet-400/30",
      accent: "bg-violet-400",
      isActive: hasManualSource,
    },
    {
      id: "youtube" as const,
      title: t('create.learnYoutube'),
      description: t('create.learnYoutubeDesc'),
      icon: Youtube,
      gradient: "from-red-600 to-rose-700",
      iconBg: "bg-red-600",
      border: "border-rose-500/30 hover:border-rose-500/70 dark:border-rose-400/25 dark:hover:border-rose-400/60",
      surface: "bg-gradient-to-br from-red-500/[0.12] via-card/95 to-rose-500/[0.06]",
      shadow: "shadow-[0_7px_0_-2px_rgba(225,29,72,0.22),0_22px_45px_-24px_rgba(225,29,72,0.65)] hover:shadow-[0_9px_0_-2px_rgba(225,29,72,0.3),0_28px_55px_-24px_rgba(225,29,72,0.75)]",
      iconShadow: "shadow-[0_8px_20px_-8px_rgba(225,29,72,0.9)] ring-rose-400/30",
      accent: "bg-rose-400",
      isActive: hasYoutubeSource,
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-1/2 -right-24 w-[30rem] h-[30rem] bg-violet-500/5 rounded-full blur-[120px]"
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
      </div>

      {/* Floating Right-Edge Side Indicator Tab */}
      {isReady && !isSourcesPanelOpen && (
        <motion.button
          type="button"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: -8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSourcesPanelOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2.5 rounded-l-3xl border-l-2 border-y border-primary-500/50 bg-background/95 p-3 pr-2.5 shadow-primary backdrop-blur-xl transition-all hover:bg-primary-500/10 dark:bg-card/95"
          title="Open Added Materials Panel"
          data-testid="button-floating-sources-indicator"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white/80 shadow-md shadow-primary/30">
            <Layers className="h-5 w-5" />
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[11px] font-black text-background ring-2 ring-background">
              {totalSourcesCount}
            </span>
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-black tracking-tight text-foreground">Added <br></br> Materials</span>
          </div>
        </motion.button>
      )}

      <div className="container mx-auto px-4 py-10 md:py-16 max-w-5xl relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="text-center space-y-3 pb-2">
            <h1 className="font-brand text-4xl font-black tracking-tight text-foreground md:text-6xl">
              {t('create.title')}
            </h1>
            <p className="mx-auto max-w-xl text-base font-medium text-muted-foreground md:text-lg">
              {t('create.aiSubtitle')}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <div className="relative rounded-[2rem] border border-border/70 bg-background/90 p-2 shadow-[0_24px_80px_-35px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-shadow focus-within:shadow-[0_24px_90px_-30px_hsl(var(--primary)/0.32)]">
              <div className="rounded-[1.45rem] border border-border/50 bg-background/95 p-4 md:p-5">
                <Textarea
                  autoFocus
                  aria-label={t('create.createFromPrompt')}
                  placeholder={animatedPrompt}
                  value={quizPrompt}
                  onChange={(event) => setQuizPrompt(event.target.value.slice(0, 1000))}
                  onKeyDown={handlePromptKeyDown}
                  className="min-h-[132px] resize-none appearance-none border-none bg-transparent px-1 py-1 text-lg font-medium leading-relaxed shadow-none outline-none ring-0 ring-offset-0 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-xl"
                  data-testid="textarea-quiz-prompt"
                />

                <div className="mt-3 flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleSamplePrompt}
                    className="group flex min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                    data-testid="button-sample-prompt"
                  >
                    <Zap className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:-rotate-6" />
                    <span className="truncate">{t('create.trySamplePrompt')}</span>
                  </button>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-xs font-bold tabular-nums text-muted-foreground/70">{quizPrompt.length}/1000</span>
                    <Button
                      onClick={handlePromptSubmit}
                      disabled={quizPrompt.trim().length < 3}
                      className="h-11 gap-2 rounded-full px-4 font-black"
                      data-testid="button-submit-quiz-prompt"
                    >
                      <SendHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('create.orAddMaterial')}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Input Options Grid triggers original Dialog Modals cleanly */}
            <div className="grid gap-5 md:grid-cols-3">
              {inputOptions.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  whileHover={{ y: -5 }}
                  whileTap={{ y: 2, scale: 0.99 }}
                  onClick={() => openSourceModal(option.id)}
                  className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-300 ${option.border} ${option.surface} ${option.shadow}`}
                  data-testid={`card-${option.id}`}
                >
                  <div className={`absolute inset-x-5 top-0 h-1 rounded-b-full bg-gradient-to-r ${option.gradient} opacity-80 transition-all duration-300 group-hover:inset-x-3 group-hover:opacity-100`} />
                  <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full ${option.accent} opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.16]`} />
                  <div className="mb-5 flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${option.iconBg} ring-4 ${option.iconShadow} transition-transform duration-300 group-hover:rotate-[-3deg] group-hover:scale-105`}>
                      <option.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      {option.isActive && (
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full border border-current/10 bg-background/50 text-muted-foreground transition-all group-hover:translate-x-1 ${option.gradient}`}>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                  <h2 className="text-base font-black tracking-tight text-foreground">{option.title}</h2>
                  <p className="mt-1 min-h-10 text-sm font-medium leading-5 text-muted-foreground">{option.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

        </motion.div>

        {/* Original Upload Dialog Modal */}
        <Dialog open={activeModal === "upload"} onOpenChange={handleUploadDialogOpenChange}>
          <DialogContent className="max-h-[90svh] max-w-2xl flex flex-col rounded-3xl border-border/50 backdrop-blur-xl p-0 overflow-hidden">
            <div className="shrink-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-8 pb-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4 text-3xl font-black tracking-tight">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FileUp className="w-8 h-8 text-white" />
                  </div>
                  {t('create.addStudyMaterials')}
                </DialogTitle>
              </DialogHeader>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-8 pt-4">
              <FileUpload onTextExtracted={handleTextExtracted} />
              <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold">PDF</Badge>
                  <Badge variant="outline" className="text-[10px] font-bold">DOCX</Badge>
                  <Badge variant="outline" className="text-[10px] font-bold">IMAGES</Badge>
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {t('create.fileSizeLimit')}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Original Manual Notes Dialog Modal */}
        <Dialog open={activeModal === "manual"} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent className="max-w-2xl rounded-3xl border-border/50 backdrop-blur-xl p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-8 pb-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4 text-3xl font-black tracking-tight">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Type className="w-8 h-8 text-white" />
                  </div>
                  {t('create.pasteNotes')}
                </DialogTitle>
              </DialogHeader>
            </div>
            <div className="p-8 pt-4 space-y-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                <Textarea
                  placeholder={t('create.pastePlaceholder')}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="relative min-h-[300px] resize-none text-lg font-medium bg-background/50 border-border/50 rounded-xl focus:ring-violet-500/20 focus:border-violet-500/50"
                  data-testid="textarea-manual-text"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-xl border border-border/50">
                  <FileText className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    {t('create.wordsCount', { count: getWordCount(manualText) })}
                  </span>
                </div>
                <Button
                  size="lg"
                  onClick={handleManualTextSubmit}
                  disabled={manualText.trim().length < 50}
                  className="w-full sm:w-auto gap-3 border-violet-700 rounded-xl font-black shadow-violet-500/70 transition-all bg-gradient-to-r from-violet-600 to-purple-600"
                  data-testid="button-submit-manual-text"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {t('create.readyToQuiz')}
                </Button>
              </div>

              {manualText.length > 0 && manualText.trim().length < 50 && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"
                  data-testid="text-manual-validation"
                >
                  <AlertCircle className="h-4 w-4" />
                  {t('create.validationError')}
                </motion.p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Original YouTube Dialog Modal */}
        <Dialog open={activeModal === "youtube"} onOpenChange={(open) => {
          if (!open) {
            setActiveModal(null);
            setYoutubeError(null);
          }
        }}>
          <DialogContent className="max-w-xl rounded-3xl border-border/50 backdrop-blur-xl p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-red-500/10 to-rose-500/5 p-8 pb-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4 text-3xl font-black tracking-tight">
                  <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <Youtube className="w-8 h-8 text-white" />
                  </div>
                  {t('create.learnYoutube')}
                </DialogTitle>
              </DialogHeader>
            </div>
            <div className="p-8 pt-4 space-y-8">
              <p className="text-lg font-medium text-muted-foreground leading-relaxed">
                {t('create.youtubeLink')}
              </p>

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                  <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                  <Input
                    placeholder={t('create.youtubePlaceholder')}
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      setYoutubeError(null);
                    }}
                    className="relative pl-12 h-14 text-lg font-medium bg-background/50 border-border/50 rounded-xl focus:ring-red-500/20 focus:border-red-500/50"
                    data-testid="input-youtube-url"
                  />
                </div>

                <Button
                  size="lg"
                  onClick={() => handleYoutubeSubmit()}
                  disabled={isLoadingYoutube || !youtubeUrl.trim()}
                  className="w-full h-14 gap-3 border-red-800 border-2 rounded-xl font-black text-lg shadow-red-500/70 transition-all bg-gradient-to-r from-red-600 to-rose-600"
                  data-testid="button-fetch-youtube"
                >
                  {isLoadingYoutube ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      {t('create.learningFromVideo')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6" />
                      {t('create.prepareQuiz')}
                    </>
                  )}
                </Button>
              </div>

              {youtubeError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                  data-testid="text-youtube-error"
                >
                  <p className="text-sm font-bold text-destructive flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {youtubeError}
                  </p>
                </motion.div>
              )}

              <div className="pt-6 border-t border-border/50 flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {t('create.compatibility')}
                </p>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/20" />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Right-Side Overlapping Panel (`Sheet`) with QUIZ CONFIGURATION SETTINGS */}
        <Sheet open={isSourcesPanelOpen && isReady} onOpenChange={(open) => setIsSourcesPanelOpen(open && isReady)}>
          <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full bg-background/95 backdrop-blur-2xl border-l border-border/60 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-6 pb-4 border-b border-border/50 bg-muted/20">
              <SheetHeader>
                <SheetTitle className="text-2xl font-black tracking-tight flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    Quiz Configuration
                  </div>
                </SheetTitle>
                <SheetDescription className="text-sm font-medium text-muted-foreground">
                  Configure practice options and review added materials.
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 1. Added Materials List */}
              <div className="space-y-3">
                {!isReady ? (
                  <div className="py-6 text-center space-y-2 rounded-2xl border border-dashed border-border/60 bg-muted/20">
                    <p className="text-sm font-medium text-muted-foreground">No materials added yet.</p>
                    <p className="text-xs text-muted-foreground/70">Upload a doc, paste text notes, or enter a prompt.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Documents - Display as separate cards */}
                    {hasUploadedSource && (
                      <div className="space-y-2">
                        {activeJobs.length > 0 ? (
                          activeJobs.map((job) => (
                            <div key={job.jobId} className="p-3 rounded-xl bg-background/80 border border-border/60 shadow-sm flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                                  <FileText className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-foreground truncate">{job.fileName}</p>
                                  <p className="text-[10px] font-medium text-muted-foreground">Uploaded document</p>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveSource("upload")}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 rounded-xl bg-background/80 border border-border/60 shadow-sm flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                                <FileText className="h-4.5 w-4.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground truncate">{t('create.document')}</p>
                                <p className="text-[10px] font-medium text-muted-foreground">Uploaded document</p>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveSource("upload")}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pasted Text */}
                    {hasManualSource && (
                      <div className="p-3 rounded-xl bg-background/80 border border-border/60 shadow-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                            <Type className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate">Pasted text</p>
                            <p className="text-[10px] text-muted-foreground truncate italic">
                              "{getPreviewText(sourceMaterial.manualText || "", 40)}"
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveSource("manual")}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    {/* YouTube */}
                    {hasYoutubeSource && (
                      <div className="p-3 rounded-xl bg-background/80 border border-border/60 shadow-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                            <Youtube className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate">YouTube video link</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {sourceMaterial.youtubeUrl}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveSource("youtube")}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    {/* Prompt */}
                    {hasPromptSource && (
                      <div className="p-3 rounded-xl bg-background/80 border border-border/60 shadow-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-600">
                            <Wand2 className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate">Prompt</p>
                            <p className="text-[10px] text-muted-foreground truncate italic">
                              "{getPreviewText(sourceMaterial.prompt || quizPrompt || "", 40)}"
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveSource("prompt")}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-6 pt-4 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setIsSourcesPanelOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!isReady) return;
                  setIsSourcesPanelOpen(false);
                  setIsSettingsPanelOpen(true);
                }}
                disabled={!isReady}
                className="gap-2 rounded-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/50 h-11 px-5"
              >
                <ArrowRight className="h-4 w-4" />
                Proceed
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Settings Panel - Quiz Configuration */}
        <Sheet open={isSettingsPanelOpen && isReady} onOpenChange={(open) => setIsSettingsPanelOpen(open && isReady)}>
          <SheetContent className="flex flex-col overflow-hidden !max-w-none w-1/3" side="right">
            <SheetHeader>
              <SheetTitle className="text-2xl font-black">Quiz Settings</SheetTitle>
              <SheetDescription>Configure your quiz generation preferences</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4 px-2">
              {/* Practice Mode Options */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Practice Mode</span>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setQuizMode("generate")}
                    className={`cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${quizMode === "generate" ? "border-violet-500 bg-violet-500/10 shadow-sm" : "border-border/60 bg-background/50 hover:border-violet-300"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded-lg ${quizMode === "generate" ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-foreground">Smart Practice</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">AI creates original quiz questions from materials.</p>
                  </div>

                  {!hasPromptSource && (
                    <div
                      onClick={() => setQuizMode("import")}
                      className={`cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${quizMode === "import" ? "border-amber-500 bg-amber-500/10 shadow-sm" : "border-border/60 bg-background/50 hover:border-amber-300"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded-lg ${quizMode === "import" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                          <Import className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-foreground">Import Exam</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">Scan existing exam & identify correct answers.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quiz Options - Only show in Smart Practice mode */}
              {quizMode === "generate" && (
                <div className="space-y-5 rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quiz Options</span>
                  </div>

                  {/* Number of Questions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground">Number of Questions</Label>
                      <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full tabular-nums">
                        {questionCount}
                      </span>
                    </div>
                    <Slider
                      value={[questionCount]}
                      onValueChange={([val]) => setQuestionCount(val)}
                      min={3}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                      <span>3</span>
                      <span>20</span>
                    </div>
                  </div>

                  {/* Difficulty Level */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Difficulty Level</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["easy", "medium", "hard"] as const).map((lvl) => (
                        <Button
                          key={lvl}
                          size="sm"
                          type="button"
                          variant={difficulty === lvl ? "default" : "outline"}
                          onClick={() => setDifficulty(lvl)}
                          className="capitalize font-bold text-xs h-9 rounded-xl gap-1"
                        >
                          <Gauge className="w-3.5 h-3.5" />
                          {lvl}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Question Types */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Question Formats</Label>
                    <div className="space-y-2">
                      <div
                        onClick={() => toggleQuestionType("multiple_choice")}
                        className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${questionTypes.includes("multiple_choice") ? "border-primary bg-primary/5" : "border-border/50 hover:border-muted-foreground/30"}`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={questionTypes.includes("multiple_choice")} className="pointer-events-none" />
                          <CheckSquare className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold">Multiple Choice</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">4 options</span>
                      </div>

                      <div
                        onClick={() => toggleQuestionType("true_false")}
                        className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${questionTypes.includes("true_false") ? "border-primary bg-primary/5" : "border-border/50 hover:border-muted-foreground/30"}`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={questionTypes.includes("true_false")} className="pointer-events-none" />
                          <ToggleLeft className="w-4 h-4 text-violet-500" />
                          <span className="text-xs font-bold">True / False</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">Binary</span>
                      </div>

                      <div
                        onClick={() => toggleQuestionType("short_answer")}
                        className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${questionTypes.includes("short_answer") ? "border-primary bg-primary/5" : "border-border/50 hover:border-muted-foreground/30"}`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={questionTypes.includes("short_answer")} className="pointer-events-none" />
                          <MessageSquare className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold">Short Answer</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">Open recall</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Exam Info - Only show in Import mode */}
              {quizMode === "import" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Import className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-foreground">How Import Mode Works</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Upload or paste an existing exam or quiz document. Our AI will parse the questions and automatically identify the correct answers from your materials.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/50 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-foreground">Supported Formats:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        PDF documents
                      </li>
                      <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Word documents (.docx, .doc)
                      </li>
                      <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        PowerPoint presentations (.pptx, .ppt)
                      </li>
                      <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Images (JPG, PNG)
                      </li>
                      <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Text notes
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-6 pt-4 border-t border-border/50 bg-transparent flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSettingsPanelOpen(false);
                  setIsSourcesPanelOpen(true);
                }}
                className="rounded-xl font-bold"
              >
                Back to Materials
              </Button>
              <Button
                onClick={handleStartGeneration}
                disabled={!isReady}
                className="gap-2 rounded-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-5"
              >
                Start Generating Quiz
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Upload Close Warning Dialog */}
        <AlertDialog open={showUploadCloseWarning} onOpenChange={setShowUploadCloseWarning}>
          <AlertDialogContent className="rounded-2xl border-border/50 backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black tracking-tight">Close upload?</AlertDialogTitle>
              <AlertDialogDescription className="text-base font-medium">
                Your uploaded files are still in the list. Closing this dialog may disrupt their upload progress.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl font-bold">Keep uploading</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowUploadCloseWarning(false);
                  setActiveModal(null);
                }}
                className="rounded-xl font-bold"
              >
                Close dialog
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Headless Quiz Generator for SSE Progress Dialog Overlay */}
        <QuizGenerator headless={true} />
      </div>
    </div>
  );
}
