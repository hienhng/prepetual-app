import { useState } from "react";
import { FileText, Image, X, Sparkles, Loader2, BookOpen, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  materialType, 
  text, 
  imageDataUrl 
}: { 
  materialType: SourceMaterialType; 
  text: string | null; 
  imageDataUrl: string | null; 
}) {
  const [viewMode, setViewMode] = useState<"text" | "image">("text");
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

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

  if (!text && !imageDataUrl) {
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

  const ViewToggle = () => (
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
  );

  if (imageDataUrl) {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-shrink-0">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "text" | "image")} className="flex-1">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="text" className="gap-2 text-xs" data-testid="tab-text">
                <FileText className="h-3.5 w-3.5" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-2 text-xs" data-testid="tab-image">
                <Image className="h-3.5 w-3.5" />
                Image
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {viewMode === "text" && (
          <div className="flex items-center justify-between gap-2 flex-shrink-0">
            <ViewToggle />
            <Badge variant="secondary" className="text-xs font-normal">
              {showSummary ? "AI Summary" : `${wordCount.toLocaleString()} words`}
            </Badge>
          </div>
        )}
        
        <div className="flex-1 min-h-0">
          {viewMode === "text" ? (
            <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-16rem)]">
              <div 
                className={cn(
                  "text-sm leading-relaxed pr-4 transition-opacity duration-200",
                  showSummary ? "whitespace-pre-wrap" : "whitespace-pre-wrap"
                )}
                data-testid="material-text"
              >
                {displayText}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-14rem)]">
              <img 
                src={imageDataUrl} 
                alt="Uploaded material" 
                className="w-full h-auto rounded-lg border"
                data-testid="material-image"
              />
            </ScrollArea>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        <ViewToggle />
        <Badge variant="secondary" className="text-xs font-normal">
          {showSummary ? "AI Summary" : `${wordCount.toLocaleString()} words`}
        </Badge>
      </div>
      <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-14rem)]">
        <div 
          className="text-sm leading-relaxed whitespace-pre-wrap pr-4" 
          data-testid="material-text"
        >
          {displayText}
        </div>
      </ScrollArea>
    </div>
  );
}

export function MaterialViewerDialog({ isOpen = false, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { sourceMaterial, currentQuiz } = useQuiz();
  
  const materialText = sourceMaterial.text || currentQuiz?.sourceText || null;
  const materialType = sourceMaterial.type;
  const imageDataUrl = sourceMaterial.imageDataUrl;

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
          <MaterialContent 
            materialType={materialType} 
            text={materialText} 
            imageDataUrl={imageDataUrl} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MaterialViewerSidebar({ onClose }: { onClose: () => void }) {
  const { sourceMaterial, currentQuiz } = useQuiz();
  
  const materialText = sourceMaterial.text || currentQuiz?.sourceText || null;
  const materialType = sourceMaterial.type;
  const imageDataUrl = sourceMaterial.imageDataUrl;

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
          className="h-8 w-8"
          data-testid="button-close-material"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <MaterialContent 
          materialType={materialType} 
          text={materialText} 
          imageDataUrl={imageDataUrl} 
        />
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
