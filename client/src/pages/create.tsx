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
    if (extractedText && extractedText.length > 0) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [extractedText]);

  const handleTextExtracted = (text: string, isOfficeWithImages?: boolean, documentImages?: string[], croppedIllustrations?: { id: string; description: string; type: string; imageDataUrl: string }[]) => {
    setExtractedText(text);
    setSourceInputType("upload");
    setActiveModal(null);
    if (isOfficeWithImages && documentImages && documentImages.length > 0) {
      setSourceMaterial({
        type: "document",
        text: text,
        imageDataUrl: null,
        isOfficeWithImages: true,
        documentImages: documentImages,
        croppedIllustrations: croppedIllustrations || [],
      });
    } else if (text) {
      setSourceMaterial({
        type: "document",
        text: text,
        imageDataUrl: null,
        isOfficeWithImages: false,
        documentImages: [],
        croppedIllustrations: croppedIllustrations || [],
      });
    }
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
      setYoutubeError("Please enter a YouTube URL");
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
        setYoutubeError("Server error. Please try again.");
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
      setYoutubeError("Network error. Please try again.");
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
    if (sourceInputType === "youtube") return "YouTube video";
    if (sourceInputType === "manual") return "pasted text";
    return sourceMaterial?.type === "image" ? "image" : "document";
  };

  const inputOptions = [
    {
      id: "upload",
      title: "Upload File",
      description: "PDF, Word, PowerPoint, or images",
      icon: FileUp,
      gradient: "from-blue-500 to-cyan-500",
      bgLight: "bg-blue-50 dark:bg-blue-950/30",
      iconBg: "bg-blue-500",
      badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      formats: ["PDF", "DOCX", "PPTX", "PNG", "JPG"],
    },
    {
      id: "manual",
      title: "Paste Text",
      description: "Copy and paste your study notes",
      icon: Type,
      gradient: "from-violet-500 to-purple-500",
      bgLight: "bg-violet-50 dark:bg-violet-950/30",
      iconBg: "bg-violet-500",
      badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800",
      formats: ["Notes", "Articles", "Textbooks"],
    },
    {
      id: "youtube",
      title: "YouTube Video",
      description: "Extract transcript from video",
      icon: Youtube,
      gradient: "from-red-500 to-rose-500",
      bgLight: "bg-red-50 dark:bg-red-950/30",
      iconBg: "bg-red-500",
      badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
      formats: ["Lectures", "Tutorials", "Talks"],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 max-w-3xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 mb-1">
            <FilePlusIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Create Your Quiz
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choose how you want to add your study material
          </p>
        </motion.div>

        {!isReady && (
          <div className="space-y-3">
            {inputOptions.map((option) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card 
                  className={`cursor-pointer overflow-visible border-2 hover:border-primary/60 transition-all duration-200 ${option.bgLight} hover:shadow-lg`}
                  onClick={() => setActiveModal(option.id as ActiveModal)}
                  data-testid={`card-${option.id}`}
                >
                  <CardContent className="p-5 flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-xl ${option.iconBg} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <option.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {option.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {option.formats.map((format) => (
                          <Badge 
                            key={format} 
                            variant="outline"
                            className={`text-[10px] md:text-xs px-2 py-0.5 font-medium transition-colors ${option.badgeClass}`}
                          >
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-primary" />
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
            className="space-y-4"
          >
              <Card className="border border-green-500/40 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center shadow-md">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Content Ready</h3>
                          <p className="text-xs text-muted-foreground">
                            {getWordCount(extractedText || "")} words from your {getSourceLabel()}
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
                            <AlertDialogTitle>Remove content?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the extracted content and you will need to add it again.
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

                    {sourceMaterial?.isOfficeWithImages && sourceMaterial?.documentImages && sourceMaterial.documentImages.length > 0 ? (
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-background/60 border">
                        <div className="flex items-center gap-2 mb-2">
                          <Image className="w-4 h-4 text-primary" />
                          <p className="text-xs font-medium text-foreground">
                            {sourceMaterial.documentImages.length} images detected
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sourceMaterial.documentImages.slice(0, 4).map((img, index) => (
                            <div key={index} className="w-10 h-10 rounded-md overflow-hidden border border-white shadow-sm">
                              <img 
                                src={img} 
                                alt={`Document image ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {sourceMaterial.documentImages.length > 4 && (
                            <div className="w-10 h-10 rounded-md border border-dashed border-muted flex items-center justify-center bg-muted/50">
                              <span className="text-[10px] text-muted-foreground font-medium">
                                +{sourceMaterial.documentImages.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-background/60 border">
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {getPreviewText(extractedText || "", 250)}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2" data-testid="badges-source-info">
                      <Badge variant="secondary" className="gap-1.5" data-testid="badge-source-type">
                        {sourceInputType === "youtube" ? (
                          <>
                            <Youtube className="w-3.5 h-3.5" />
                            YouTube
                          </>
                        ) : sourceInputType === "manual" ? (
                          <>
                            <Type className="w-3.5 h-3.5" />
                            Pasted Text
                          </>
                        ) : sourceMaterial?.type === "image" ? (
                          <>
                            <Image className="w-3.5 h-3.5" />
                            Image
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            Document
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  onClick={handleContinueToGenerate}
                  className="w-full sm:w-auto gap-2 min-w-[200px]"
                  data-testid="button-continue-generate"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate Quiz
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Customize question types, difficulty, and more
                </p>
              </div>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={activeModal === "upload"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <FileUp className="w-5 h-5 text-white" />
              </div>
              Upload Your File
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <FileUpload onTextExtracted={handleTextExtracted} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "manual"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
                <Type className="w-5 h-5 text-white" />
              </div>
              Paste Your Text
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Textarea
              placeholder="Paste your study material here... (minimum 50 characters)"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="min-h-[250px] resize-none text-base"
              data-testid="textarea-manual-text"
            />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {getWordCount(manualText)} words
              </span>
              <Button
                onClick={handleManualTextSubmit}
                disabled={manualText.trim().length < 50}
                className="gap-2"
                data-testid="button-submit-manual-text"
              >
                <CheckCircle2 className="h-4 w-4" />
                Use This Text
              </Button>
            </div>
            
            {manualText.length > 0 && manualText.trim().length < 50 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2" data-testid="text-manual-validation">
                <AlertCircle className="h-4 w-4" />
                Please enter at least 50 characters
              </p>
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              YouTube Video
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter a YouTube URL to extract the transcript and generate questions
            </p>
            
            <div className="space-y-3">
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    setYoutubeError(null);
                  }}
                  className="pl-10 h-11"
                  data-testid="input-youtube-url"
                />
              </div>
              
              <Button
                onClick={() => handleYoutubeSubmit()}
                disabled={isLoadingYoutube || !youtubeUrl.trim()}
                className="w-full gap-2 h-11"
                data-testid="button-fetch-youtube"
              >
                {isLoadingYoutube ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching Transcript...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get Transcript
                  </>
                )}
              </Button>
            </div>
            
            {youtubeError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20" data-testid="text-youtube-error">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {youtubeError}
                </p>
              </div>
            )}
            
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Supported: youtube.com/watch?v=... and youtu.be/... links
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
