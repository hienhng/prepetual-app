import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Image, Sparkles, ArrowRight,
  CheckCircle2, Loader2, X, Wand2,
  Type, Youtube, Link, AlertCircle, FileUp, FilePlusIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/file-upload";
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

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

type SourceInputType = "upload" | "manual" | "youtube" | null;
type ActiveModal = "upload" | "manual" | "youtube" | null;

export default function Create() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText, sourceMaterial, setSourceMaterial, isLoading } = useQuiz();
  const { t } = useLanguage();
  const { activeJobs, clearJobs } = useUpload();
  const [isReady, setIsReady] = useState(false);
  const redirectedRef = useRef(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [sourceInputType, setSourceInputType] = useState<SourceInputType>(null);
  const [manualText, setManualText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading && !redirectedRef.current) {
      redirectedRef.current = true;
      setLocation("/generate");
    }
    if (!isLoading) {
      redirectedRef.current = false;
    }
  }, [isLoading, setLocation]);

  useEffect(() => {
    // Check if ready: either has extracted text OR is image-only mode
    if ((extractedText && extractedText.length > 0) || sourceMaterial.isImageOnly) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [extractedText, sourceMaterial.isImageOnly]);

  const handleTextExtracted = (text: string, hasImages?: boolean, documentImages?: string[]) => {
    setExtractedText(text);
    setSourceInputType("upload");
    setActiveModal(null);

    // Always set source material with images if available
    setSourceMaterial({
      type: "document",
      text: text,
      imageDataUrl: null,
      isOfficeWithImages: hasImages && documentImages && documentImages.length > 0,
      documentImages: documentImages || [],
    });
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

  const getSourceLabel = () => {
    if (sourceInputType === "youtube") return t('create.youtubeVideo');
    if (sourceInputType === "manual") return t('create.pastedText');
    return sourceMaterial?.type === "image" ? t('create.image') : t('create.document');
  };

  const inputOptions = [
    {
      id: "upload",
      title: t('create.uploadDocs'),
      description: t('create.uploadDocsDesc'),
      icon: FileUp,
      gradient: "from-blue-600 to-indigo-700",
      bgLight: "bg-blue-50/50 dark:bg-blue-950/20",
      iconBg: "bg-blue-600",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      formats: [t('create.formats.docs'), t('create.formats.photos')],
    },
    {
      id: "manual",
      title: t('create.pasteNotes'),
      description: t('create.pasteNotesDesc'),
      icon: Type,
      gradient: "from-violet-600 to-purple-700",
      bgLight: "bg-violet-50/50 dark:bg-violet-950/20",
      iconBg: "bg-violet-600",
      badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      formats: [t('create.formats.handwritten'), t('create.formats.summaries')],
    },
    {
      id: "youtube",
      title: t('create.learnYoutube'),
      description: t('create.learnYoutubeDesc'),
      icon: Youtube,
      gradient: "from-red-600 to-rose-700",
      bgLight: "bg-red-50/50 dark:bg-red-950/20",
      iconBg: "bg-red-600",
      badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      formats: [t('create.formats.lectures'), t('create.formats.explainers')],
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-1/2 -right-24 w-[30rem] h-[30rem] bg-violet-500/5 rounded-full blur-[150px]"
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="text-center space-y-4 pb-4">
            <div className="relative inline-flex mb-2">
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/20">
                <FilePlusIcon className="w-8 h-8 text-primary-foreground stroke-[2.5]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              {t('create.title')}
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto">
              {t('create.subtitle')}
            </p>
          </motion.div>

          {!isReady && (
            <div className="space-y-4">
              {inputOptions.map((option) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative group"
                >
                  {/* Glow effect on hover */}
                  <div className={`absolute -inset-0.5 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-r ${option.gradient}`} />

                  <Card
                    className={`relative cursor-pointer overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-background group-hover:border-primary/30 group-hover:shadow-xl shadow-primary/5`}
                    onClick={() => setActiveModal(option.id as ActiveModal)}
                    data-testid={`card-${option.id}`}
                  >
                    <CardContent className="p-6 flex items-center gap-6 relative">
                      {/* Mesh pattern overlay */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '16px 16px' }} />

                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 flex-shrink-0`}>
                        <option.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 z-10">
                        <h3 className="font-black text-xl text-foreground mb-1 tracking-tight">
                          {option.title}
                        </h3>
                        <p className="text-muted-foreground font-medium mb-3">
                          {option.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {option.formats.map((format) => (
                            <Badge
                              key={format}
                              variant="secondary"
                              className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 ${option.badgeClass}`}
                            >
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0 z-10">
                        <div className="w-12 h-12 rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-foreground tracking-tight">{t('create.materialReady')}</h3>
                          <p className="text-muted-foreground font-medium">
                            {sourceMaterial.isImageOnly
                              ? t('create.pagesAdded', { count: sourceMaterial.documentImages?.length || 0 })
                              : t('create.wordsAdded', { count: getWordCount(extractedText || ""), source: getSourceLabel() })
                            }
                          </p>
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
                            <AlertDialogTitle className="text-2xl font-black tracking-tight">{t('create.removeMaterial')}</AlertDialogTitle>
                            <AlertDialogDescription className="text-base font-medium">
                              {t('create.removeMaterialDesc')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl font-bold">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearText} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold">
                              {t('create.confirmRemoval')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {(sourceMaterial?.isOfficeWithImages || sourceMaterial?.isImageOnly) && sourceMaterial?.documentImages && sourceMaterial.documentImages.length > 0 ? (
                      <div className="p-4 rounded-2xl bg-background/50 border border-border/50 backdrop-blur-sm shadow-inner group/images">
                        <div className="flex items-center gap-2 mb-3">
                          <Image className="w-4 h-4 text-emerald-500" />
                          <p className="text-sm font-bold text-foreground">
                            {t('create.visualAssetsFound')}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sourceMaterial.documentImages.slice(0, 5).map((img, index) => (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.05, y: -2 }}
                              className="w-14 h-14 rounded-xl overflow-hidden border-2 border-background shadow-md"
                            >
                              <img
                                src={img}
                                alt={`Asset ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </motion.div>
                          ))}
                          {sourceMaterial.documentImages.length > 5 && (
                            <div className="w-14 h-14 rounded-xl border-2 border-dashed border-muted flex items-center justify-center bg-muted/30">
                              <span className="text-xs text-muted-foreground font-black">
                                +{sourceMaterial.documentImages.length - 5}
                              </span>
                            </div>
                          )}
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
                        {sourceInputType === "youtube" ? (
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
                    className="w-full sm:min-w-[280px] h-16 gap-3 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all group"
                    data-testid="button-continue-generate"
                  >
                    <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    {t('create.generateQuestions')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <Dialog open={activeModal === "upload"} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent className="max-w-2xl rounded-3xl border-border/50 backdrop-blur-xl p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-8 pb-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4 text-3xl font-black tracking-tight">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FileUp className="w-8 h-8 text-white" />
                  </div>
                  {t('create.addStudyMaterials')}
                </DialogTitle>
              </DialogHeader>
            </div>
            <div className="p-8 pt-4">
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

        <Dialog open={activeModal === "manual"} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent className="max-w-2xl rounded-3xl border-border/50 backdrop-blur-xl p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-8 pb-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4 text-3xl font-black tracking-tight">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
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
                  className="w-full sm:w-auto gap-3 border-violet-700 rounded-xl font-black shadow-xl shadow-violet-500/10 hover:shadow-violet-500/20 transition-all bg-gradient-to-r from-violet-600 to-purple-600"
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
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
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
                  className="w-full h-14 gap-3 rounded-xl font-black text-lg shadow-xl shadow-red-500/10 hover:shadow-red-500/20 transition-all bg-gradient-to-r from-red-600 to-rose-600"
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
