import { useState } from "react";
import { FileText, Image, X, Loader2, BookOpen, ListTree, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuiz, type SourceMaterialType } from "@/lib/quiz-context";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface MaterialViewerProps {
  isOpen?: boolean;
  onClose?: () => void;
  variant: "sidebar" | "dialog";
}

function MaterialContent({ 
  text, 
  images = []
}: { 
  text: string | null; 
  images: string[];
}) {
  const [activeTab, setActiveTab] = useState<"text" | "images">("text");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const hasText = !!text && text.trim().length > 0;
  const hasImages = images.length > 0;

  const handleSummarize = async () => {
    if (!text) return;
    if (summary) {
      setShowSummary(!showSummary);
      return;
    }
    setIsSummarizing(true);
    try {
      const response = await apiRequest("POST", "/api/summarize-text", { text });
      const data = await response.json();
      setSummary(data.summary);
      setShowSummary(true);
    } catch (error) {
      console.error("Failed to summarize:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!hasText && !hasImages) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No material available</p>
      </div>
    );
  }

  const displayText = showSummary && summary ? summary : text;
  const wordCount = text ? text.split(/\s+/).length : 0;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Main Tab Toggle: Text / Images */}
      {hasText && hasImages && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 w-fit">
          <button
            onClick={() => setActiveTab("text")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === "text"
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="tab-text"
          >
            <FileText className="h-3.5 w-3.5" />
            Text
          </button>
          <button
            onClick={() => setActiveTab("images")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === "images"
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="tab-images"
          >
            <Image className="h-3.5 w-3.5" />
            Images ({images.length})
          </button>
        </div>
      )}

      {/* TEXT VIEW */}
      {(activeTab === "text" || !hasImages) && hasText && (
        <>
          <div className="flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
              <button
                onClick={() => !isSummarizing && setShowSummary(false)}
                disabled={isSummarizing}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  !showSummary 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="toggle-full-text"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Full
              </button>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || !text || text.length < 100}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  showSummary 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground",
                  (isSummarizing || !text || text.length < 100) && "opacity-50 cursor-not-allowed"
                )}
                data-testid="toggle-summary"
              >
                {isSummarizing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ListTree className="h-3.5 w-3.5" />
                )}
                Summary
              </button>
            </div>
            <Badge variant="secondary" className="text-xs font-normal">
              {showSummary ? "AI Summary" : `${wordCount.toLocaleString()} words`}
            </Badge>
          </div>
          <ScrollArea className="flex-1 h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-16rem)]">
            <div 
              className="text-sm leading-relaxed whitespace-pre-wrap pr-4" 
              data-testid="material-text"
            >
              {displayText}
            </div>
          </ScrollArea>
        </>
      )}

      {/* IMAGES VIEW */}
      {(activeTab === "images" || !hasText) && hasImages && (
        <>
          {/* Expanded image modal */}
          {expandedImage && (
            <div
              className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
              onClick={() => setExpandedImage(null)}
            >
              <div
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
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="secondary" className="text-xs font-normal">
              <Image className="h-3 w-3 mr-1" />
              {images.length} {images.length === 1 ? 'image' : 'images'}
            </Badge>
          </div>
          
          <ScrollArea className="flex-1 h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-16rem)]">
            <div className={cn(
              "grid gap-2 pr-4",
              images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            )}>
              {images.map((img, index) => (
                <div 
                  key={index} 
                  className="relative aspect-[4/3] rounded-lg border shadow-sm cursor-pointer overflow-hidden"
                  onClick={() => setExpandedImage(img)}
                >
                  <img 
                    src={img} 
                    alt={`Image ${index + 1}`} 
                    className="w-full h-full object-cover"
                    data-testid={`material-image-${index}`}
                  />
                  <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/80 rounded-full p-1.5 shadow-sm">
                    <ZoomIn className="w-3 h-3 text-foreground" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">Click any image to expand</p>
          </ScrollArea>
        </>
      )}
    </div>
  );
}

export function MaterialViewerDialog({ isOpen = false, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { sourceMaterial, currentQuiz } = useQuiz();
  
  const text = sourceMaterial.text || currentQuiz?.sourceText || null;
  const singleImage = sourceMaterial.imageDataUrl ? [sourceMaterial.imageDataUrl] : [];
  const docImages = sourceMaterial.documentImages || [];
  const quizImages = (currentQuiz as any)?.sourceImages || [];
  const images = [...singleImage, ...docImages, ...(docImages.length === 0 ? quizImages : [])];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="rounded-md bg-primary/10 p-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            Study Material
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <MaterialContent text={text} images={images} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MaterialViewerSidebar({ onClose }: { onClose: () => void }) {
  const { sourceMaterial, currentQuiz } = useQuiz();
  
  const text = sourceMaterial.text || currentQuiz?.sourceText || null;
  const singleImage = sourceMaterial.imageDataUrl ? [sourceMaterial.imageDataUrl] : [];
  const docImages = sourceMaterial.documentImages || [];
  const quizImages = (currentQuiz as any)?.sourceImages || [];
  const images = [...singleImage, ...docImages, ...(docImages.length === 0 ? quizImages : [])];

  return (
    <div className="w-full h-full flex flex-col bg-background border-l">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-1.5">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium text-sm">Study Material</span>
        </div>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={onClose}
          data-testid="button-close-material"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <MaterialContent text={text} images={images} />
      </div>
    </div>
  );
}

export function MaterialViewer({ isOpen = false, onClose = () => {}, variant }: MaterialViewerProps) {
  if (variant === "dialog") {
    return <MaterialViewerDialog isOpen={isOpen} onClose={onClose} />;
  }
  return <MaterialViewerSidebar onClose={onClose} />;
}
