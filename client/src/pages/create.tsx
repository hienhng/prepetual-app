import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  FileText, Image, Sparkles, ArrowRight,
  CheckCircle2, Loader2, X, Wand2,
  Type, Youtube, Link, AlertCircle, FileUp, Lightbulb, SendHorizonal, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/file-upload";
import { QuizGenerator } from "@/components/quiz-generator";
import { useQuiz } from "@/lib/quiz-context";
import { useUpload } from "@/lib/upload-context";
import { useLanguage } from "@/lib/language-context";
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

type SourceInputType = "prompt" | "upload" | "manual" | "youtube" | null;
type ActiveModal = "upload" | "manual" | "youtube" | null;

export default function Create() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText, sourceMaterial, setSourceMaterial, isLoading } = useQuiz();
  const { t, tArray, language } = useLanguage();
  const { activeJobs, clearJobs } = useUpload();
  const examplePrompts = tArray('create.examplePrompts');
  const [isReady, setIsReady] = useState(false);
  const redirectedRef = useRef(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [showUploadCloseWarning, setShowUploadCloseWarning] = useState(false);
  const [sourceInputType, setSourceInputType] = useState<SourceInputType>(null);
  const [quizPrompt, setQuizPrompt] = useState("");
  const [animatedPrompt, setAnimatedPrompt] = useState("");
  const [examplePromptIndex, setExamplePromptIndex] = useState(() => getRandomPromptIndex(examplePrompts.length));
  const [isDeletingExample, setIsDeletingExample] = useState(false);
  const [manualText, setManualText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const isPromptSource = sourceInputType === "prompt" || sourceMaterial.type === "prompt";
  const samplePrompt = t('create.samplePrompt');

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
    if (isLoading && !isPromptSource && !redirectedRef.current) {
      redirectedRef.current = true;
      setLocation("/generate");
    }
    if (!isLoading) {
      redirectedRef.current = false;
    }
  }, [isLoading, isPromptSource, setLocation]);

  useEffect(() => {
    // Check if ready: either has extracted text OR is image-only mode
    if ((extractedText && extractedText.length > 0) || sourceMaterial.isImageOnly) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [extractedText, sourceMaterial.isImageOnly]);

  const handleTextExtracted = (text: string, hasImages?: boolean, documentImages?: string[], isImageOnly?: boolean) => {
    const sourceText = isImageOnly && !text
      ? "[Images uploaded - AI will analyze visually]"
      : text;

    setExtractedText(sourceText);
    setSourceInputType("upload");
    setActiveModal(null);

    // Always set source material with images if available
    setSourceMaterial({
      type: isImageOnly ? "image" : "document",
      text: isImageOnly ? null : text,
      imageDataUrl: null,
      isOfficeWithImages: hasImages && documentImages && documentImages.length > 0,
      documentImages: documentImages || [],
      isImageOnly: isImageOnly || false,
    });
  };

  const handleUploadDialogOpenChange = (open: boolean) => {
    if (open) {
      setActiveModal("upload");
      return;
    }

    if (activeJobs.length > 0) {
      setShowUploadCloseWarning(true);
      return;
    }

    setActiveModal(null);
  };

  const handleManualTextSubmit = () => {
    if (manualText.trim().length < 50) {
      return;
    }
    setExtractedText(manualText.trim());
    setSourceInputType("manual");
    setActiveModal(null);
    setSourceMaterial({
      type: "document",
      text: manualText.trim(),
      imageDataUrl: null,
      isOfficeWithImages: false,
      documentImages: [],
    });
  };

  const handlePromptSubmit = () => {
    const prompt = quizPrompt.trim();
    if (prompt.length < 3 || prompt.length > 1000) return;

    setExtractedText(prompt);
    setSourceInputType("prompt");
    setActiveModal(null);
    setSourceMaterial({
      type: "prompt",
      text: prompt,
      imageDataUrl: null,
      isOfficeWithImages: false,
      documentImages: [],
      isImageOnly: false,
      autoGenerate: true,
    });
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
      setYoutubeError(t('create.youtubeLink')); // Enter a link
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

      setExtractedText(data.text);
      setSourceInputType("youtube");
      setActiveModal(null);
      setSourceMaterial({
        type: "document",
        text: data.text,
        imageDataUrl: null,
        isOfficeWithImages: false,
        documentImages: [],
      });
    } catch (error) {
      setYoutubeError(t('results.reviewFailed'));
    } finally {
      setIsLoadingYoutube(false);
    }
  };

  const handleContinueToGenerate = () => {
    setLocation("/generate");
  };

  const handleClearText = () => {
    setExtractedText("");
    setSourceMaterial({ type: null, text: null, imageDataUrl: null, isOfficeWithImages: false, documentImages: [] });
    clearJobs();
    setIsReady(false);
    setQuizPrompt("");
    setManualText("");
    setYoutubeUrl("");
    setYoutubeError(null);
    setSourceInputType(null);
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
      id: "upload",
      title: t('create.uploadDocs'),
      description: t('create.uploadDocsDesc'),
      icon: FileUp,
      gradient: "from-blue-600 to-indigo-700",
      iconBg: "bg-blue-600",
      border: "border-blue-500/30 hover:border-blue-500/70 dark:border-blue-400/25 dark:hover:border-blue-400/60",
      surface: "bg-blue-500/[0.13]",
      shadow: "shadow-[0_7px_0_-2px_rgba(37,99,235,0.22),0_22px_45px_-24px_rgba(37,99,235,0.65)] hover:shadow-[0_9px_0_-2px_rgba(37,99,235,0.3),0_28px_55px_-24px_rgba(37,99,235,0.75)]",
      iconShadow: "shadow-[0_8px_20px_-8px_rgba(37,99,235,0.9)] ring-blue-400/30",
      badge: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      accent: "bg-blue-400",
      formats: [t('create.formats.docs'), t('create.formats.photos')],
    },
    {
      id: "manual",
      title: t('create.pasteNotes'),
      description: t('create.pasteNotesDesc'),
      icon: Type,
      gradient: "from-violet-600 to-purple-700",
      iconBg: "bg-violet-600",
      border: "border-violet-500/30 hover:border-violet-500/70 dark:border-violet-400/25 dark:hover:border-violet-400/60",
      surface: "bg-gradient-to-br from-violet-500/[0.13] via-card/95 to-purple-500/[0.06]",
      shadow: "shadow-[0_7px_0_-2px_rgba(124,58,237,0.22),0_22px_45px_-24px_rgba(124,58,237,0.65)] hover:shadow-[0_9px_0_-2px_rgba(124,58,237,0.3),0_28px_55px_-24px_rgba(124,58,237,0.75)]",
      iconShadow: "shadow-[0_8px_20px_-8px_rgba(124,58,237,0.9)] ring-violet-400/30",
      badge: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      accent: "bg-violet-400",
      formats: [t('create.formats.handwritten'), t('create.formats.summaries')],
    },
    {
      id: "youtube",
      title: t('create.learnYoutube'),
      description: t('create.learnYoutubeDesc'),
      icon: Youtube,
      gradient: "from-red-600 to-rose-700",
      iconBg: "bg-red-600",
      border: "border-rose-500/30 hover:border-rose-500/70 dark:border-rose-400/25 dark:hover:border-rose-400/60",
      surface: "bg-gradient-to-br from-red-500/[0.12] via-card/95 to-rose-500/[0.06]",
      shadow: "shadow-[0_7px_0_-2px_rgba(225,29,72,0.22),0_22px_45px_-24px_rgba(225,29,72,0.65)] hover:shadow-[0_9px_0_-2px_rgba(225,29,72,0.3),0_28px_55px_-24px_rgba(225,29,72,0.75)]",
      iconShadow: "shadow-[0_8px_20px_-8px_rgba(225,29,72,0.9)] ring-rose-400/30",
      badge: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      accent: "bg-rose-400",
      formats: [t('create.formats.lectures'), t('create.formats.explainers')],
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {isPromptSource && <QuizGenerator headless />}

      {/* Dynamic Background Elements */}
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

          {!isReady && (
            <motion.div variants={itemVariants} className="space-y-5">
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
                        <SendHorizonal className="h-4 w-4" />
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

              <div className="grid gap-5 md:grid-cols-3">
                {inputOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    type="button"
                    whileHover={{ y: -5 }}
                    whileTap={{ y: 2, scale: 0.99 }}
                    onClick={() => setActiveModal(option.id as ActiveModal)}
                    className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-300 ${option.border} ${option.surface} ${option.shadow}`}
                    data-testid={`card-${option.id}`}
                  >
                    <div className={`absolute inset-x-5 top-0 h-1 rounded-b-full bg-gradient-to-r ${option.gradient} opacity-80 transition-all duration-300 group-hover:inset-x-3 group-hover:opacity-100`} />
                    <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full ${option.accent} opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.16]`} />
                    <div className="mb-5 flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${option.iconBg} ring-4 ${option.iconShadow} transition-transform duration-300 group-hover:rotate-[-3deg] group-hover:scale-105`}>
                        <option.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full border border-current/10 bg-background/50 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:bg ${option.gradient}`}>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                    <h2 className="text-base font-black tracking-tight text-foreground">{option.title}</h2>
                    <p className="mt-1 min-h-10 text-sm font-medium leading-5 text-muted-foreground">{option.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {isReady && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-md shadow-xl">
                <CardContent className="p-6 relative">
                  {/* Mesh pattern overlay */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)`, backgroundSize: '16px 16px' }} />

                  <div className="space-y-5 relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-foreground tracking-tight">
                            {isPromptSource ? t('create.promptReady') : t('create.materialReady')}
                          </h3>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive group/close"
                            data-testid="button-clear-text"
                          >
                            <X className="w-5 h-5 transition-transform group-hover/close:rotate-90" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border-border/50 backdrop-blur-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black tracking-tight">
                              {isPromptSource ? t('create.removePrompt') : t('create.removeMaterial')}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base font-medium">
                              {isPromptSource ? t('create.removePromptDesc') : t('create.removeMaterialDesc')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl font-bold">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearText} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold border-[0_4px_0_0_#fcaca5] shadow-[0_4px_0_0_#e85d5d]">
                              {t('create.confirmRemoval')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {(sourceMaterial?.isOfficeWithImages || sourceMaterial?.isImageOnly) && sourceMaterial?.documentImages && sourceMaterial.documentImages.length > 0 ? (
                      <div className="p-4 rounded-2xl bg-background/50 border border-border/50 backdrop-blur-sm shadow-inner group/images">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Image className="w-4 h-4 text-emerald-500" />
                            <p className="text-sm font-bold text-foreground">
                              {t('create.visualAssetsFound')} ({sourceMaterial.documentImages.length})
                            </p>
                          </div>
                          
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sourceMaterial.documentImages.map((img, index) => (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.05, y: -2 }}
                              className="relative w-20 h-20 rounded-xl border-2 border-background shadow-md"
                            >
                              <img
                                src={img}
                                alt={`Asset ${index + 1}`}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-background/50 border border-border/50 backdrop-blur-sm shadow-inner overflow-hidden">
                        <div className="flex items-center gap-2 mb-2 opacity-60">
                          <FileText className="w-4 h-4" />
                          <p className="text-xs font-bold uppercase tracking-wider">{t('create.preview')}</p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium italic line-clamp-3">
                          "{getPreviewText(extractedText || "", 250)}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2" data-testid="badges-source-info">
                      <Badge variant="secondary" className="gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black tracking-wide uppercase text-[10px] px-3 py-1" data-testid="badge-source-type">
                        {isPromptSource ? (
                          <><Wand2 className="w-3.5 h-3.5" />{t('create.prompt')}</>
                        ) : sourceInputType === "youtube" ? (
                          <><Youtube className="w-3.5 h-3.5" />{t('create.youtubeVideo')}</>
                        ) : sourceInputType === "manual" ? (
                          <><Type className="w-3.5 h-3.5" />{t('create.pastedText')}</>
                        ) : sourceMaterial?.type === "image" ? (
                          <><Image className="w-3.5 h-3.5" />{t('create.image')}</>
                        ) : (
                          <><FileText className="w-3.5 h-3.5" />{t('create.document')}</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col items-center gap-4 pt-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="xl"
                    onClick={handleContinueToGenerate}
                    className="w-full sm:min-w-[280px] h-16 gap-3 rounded-2xl font-black text-xl shadow-primary/120 transition-all group"
                    data-testid="button-continue-generate"
                  >
                    
                    {t('create.generateQuestions')}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>

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
      </div>
    </div>
  );
}
