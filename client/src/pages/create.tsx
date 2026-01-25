import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, FileText, Image, Sparkles, ArrowRight, 
  CheckCircle2, Loader2, X, FileUp, Wand2, Eye,
  Type, Youtube, Link, AlertCircle, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

type SourceInputType = "upload" | "manual" | "youtube" | null;

export default function Create() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText, sourceMaterial, setSourceMaterial, isLoading } = useQuiz();
  const { activeJob, clearJob } = useUpload();
  const [isReady, setIsReady] = useState(false);
  const redirectedRef = useRef(false);
  const [activeTab, setActiveTab] = useState("upload");
  
  // Track the actual source of extracted content (not just the active tab)
  const [sourceInputType, setSourceInputType] = useState<SourceInputType>(null);
  
  // Manual text input state
  const [manualText, setManualText] = useState("");
  
  // YouTube URL state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [canUseAudioTranscription, setCanUseAudioTranscription] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);

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

  const handleTextExtracted = (text: string, isOfficeWithImages?: boolean, documentImages?: string[]) => {
    setExtractedText(text);
    setSourceInputType("upload");
    if (isOfficeWithImages && documentImages && documentImages.length > 0) {
      setSourceMaterial({
        type: "document",
        text: text,
        imageDataUrl: null,
        isOfficeWithImages: true,
        documentImages: documentImages,
      });
    } else if (text) {
      setSourceMaterial({
        type: "document",
        text: text,
        imageDataUrl: null,
        isOfficeWithImages: false,
        documentImages: [],
      });
    }
  };

  const handleManualTextSubmit = () => {
    if (manualText.trim().length < 50) {
      return;
    }
    setExtractedText(manualText.trim());
    setSourceInputType("manual");
    setSourceMaterial({
      type: "document",
      text: manualText.trim(),
      imageDataUrl: null,
      isOfficeWithImages: false,
      documentImages: [],
    });
  };

  const handleYoutubeSubmit = async (useAudioTranscription = false) => {
    if (!youtubeUrl.trim()) {
      setYoutubeError("Please enter a YouTube URL");
      return;
    }

    if (useAudioTranscription) {
      setIsTranscribingAudio(true);
    } else {
      setIsLoadingYoutube(true);
    }
    setYoutubeError(null);
    setCanUseAudioTranscription(false);

    try {
      const response = await fetch("/api/youtube-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: youtubeUrl.trim(),
          useAudioTranscription 
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        setYoutubeError("Server error. Please try again.");
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          setYoutubeError("Please log in to use audio transcription.");
          setCanUseAudioTranscription(false);
        } else {
          setYoutubeError(data.message || "Failed to fetch video transcript");
          if (data.canUseAudioTranscription) {
            setCanUseAudioTranscription(true);
          }
        }
        return;
      }

      setExtractedText(data.text);
      setSourceInputType("youtube");
      setSourceMaterial({
        type: "document",
        text: data.text,
        imageDataUrl: null,
        isOfficeWithImages: false,
        documentImages: [],
      });
      setCanUseAudioTranscription(false);
    } catch (error) {
      setYoutubeError("Network error. Please try again.");
    } finally {
      setIsLoadingYoutube(false);
      setIsTranscribingAudio(false);
    }
  };

  const handleContinueToGenerate = () => {
    setLocation("/generate");
  };

  const handleClearText = () => {
    setExtractedText("");  
    setSourceMaterial({ type: null, text: null, imageDataUrl: null, isOfficeWithImages: false, documentImages: [] });
    clearJob();
    setIsReady(false);
    setManualText("");
    setYoutubeUrl("");
    setYoutubeError(null);
    setSourceInputType(null);
    setCanUseAudioTranscription(false);
    setIsTranscribingAudio(false);
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

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Create a New Quiz
          </h1>
          <p className="text-muted-foreground">
            Upload materials, paste text, or use a YouTube video to generate questions
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            {!isReady ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="upload" className="gap-2" data-testid="tab-upload">
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Upload File</span>
                      <span className="sm:hidden">Upload</span>
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2" data-testid="tab-manual">
                      <Type className="h-4 w-4" />
                      <span className="hidden sm:inline">Paste Text</span>
                      <span className="sm:hidden">Text</span>
                    </TabsTrigger>
                    <TabsTrigger value="youtube" className="gap-2" data-testid="tab-youtube">
                      <Youtube className="h-4 w-4" />
                      <span className="hidden sm:inline">YouTube</span>
                      <span className="sm:hidden">Video</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-0">
                    <FileUpload onTextExtracted={handleTextExtracted} />
                  </TabsContent>

                  <TabsContent value="manual" className="mt-0">
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-6 space-y-4">
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Type className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-medium text-foreground">Paste Your Study Material</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Copy and paste notes, textbook content, or any text you want to study
                          </p>
                        </div>
                        
                        <Textarea
                          placeholder="Paste your study material here... (minimum 50 characters)"
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          className="min-h-[200px] resize-none"
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
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="youtube" className="mt-0">
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-6 space-y-4">
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                            <Youtube className="h-6 w-6 text-destructive" />
                          </div>
                          <h3 className="font-medium text-foreground">YouTube Video Quiz</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Enter a YouTube URL to extract the transcript and generate a quiz
                          </p>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="https://www.youtube.com/watch?v=..."
                              value={youtubeUrl}
                              onChange={(e) => {
                                setYoutubeUrl(e.target.value);
                                setYoutubeError(null);
                              }}
                              className="pl-10"
                              data-testid="input-youtube-url"
                            />
                          </div>
                          <Button
                            onClick={() => handleYoutubeSubmit(false)}
                            disabled={isLoadingYoutube || isTranscribingAudio || !youtubeUrl.trim()}
                            className="gap-2"
                            data-testid="button-fetch-youtube"
                          >
                            {isLoadingYoutube ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Fetching...
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
                              <AlertCircle className="h-4 w-4" />
                              {youtubeError}
                            </p>
                            {canUseAudioTranscription && (
                              <div className="mt-3 pt-3 border-t border-destructive/20">
                                <p className="text-sm text-muted-foreground mb-2">
                                  Would you like to transcribe the video audio using AI instead? This may take a bit longer.
                                </p>
                                <Button
                                  onClick={() => handleYoutubeSubmit(true)}
                                  disabled={isTranscribingAudio}
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  data-testid="button-transcribe-audio"
                                >
                                  {isTranscribingAudio ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Transcribing audio...
                                    </>
                                  ) : (
                                    <>
                                      <Mic className="h-4 w-4" />
                                      Use Audio Transcription
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {isTranscribingAudio && (
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20" data-testid="text-transcribing-status">
                            <div className="flex items-center gap-3">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <div>
                                <p className="text-sm font-medium text-foreground">Transcribing video audio...</p>
                                <p className="text-xs text-muted-foreground">This may take a minute depending on video length</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t">
                          <h4 className="text-sm font-medium text-foreground mb-2">Supported formats:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              youtube.com/watch?v=...
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              youtu.be/...
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              Videos with captions (fastest)
                            </li>
                            <li className="flex items-center gap-2">
                              <Mic className="h-3.5 w-3.5 text-primary" />
                              Videos without captions (AI transcription)
                            </li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
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
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Content Ready</h3>
                            <p className="text-sm text-muted-foreground">
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
                                This will remove the extracted content and you will need to add it again to generate a quiz.
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
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <p className="text-sm font-medium text-foreground">
                              Document with visual content detected
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {sourceMaterial.documentImages.slice(0, 4).map((img, index) => (
                              <div key={index} className="w-14 h-14 rounded-md overflow-hidden border border-muted bg-muted">
                                <img 
                                  src={img} 
                                  alt={`Document image ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {sourceMaterial.documentImages.length > 4 && (
                              <div className="w-14 h-14 rounded-md border border-muted bg-muted flex items-center justify-center">
                                <span className="text-xs text-muted-foreground font-medium">+{sourceMaterial.documentImages.length - 4}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            AI will analyze charts, diagrams, and images along with text content
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-background border">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {getPreviewText(extractedText || "", 300)}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2" data-testid="badges-source-info">
                        <Badge variant="secondary" className="gap-1" data-testid="badge-source-type">
                          {sourceInputType === "youtube" ? (
                            <>
                              <Youtube className="w-3 h-3" />
                              YouTube
                            </>
                          ) : sourceInputType === "manual" ? (
                            <>
                              <Type className="w-3 h-3" />
                              Text
                            </>
                          ) : sourceMaterial?.type === "image" ? (
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
                        <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/10" data-testid="badge-ready">
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
                    <span>YouTube videos with captions work best for video quizzes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!isReady && (
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap justify-center">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>PDF, DOCX, PPTX</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center gap-1.5">
                <Image className="w-4 h-4" />
                <span>PNG, JPG</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center gap-1.5">
                <Youtube className="w-4 h-4" />
                <span>YouTube</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
