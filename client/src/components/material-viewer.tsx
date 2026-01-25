import { useState } from "react";
import { FileText, Image, X, Sparkles, Loader2, BookOpen, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuiz, type SourceMaterialType } from "@/lib/quiz-context";
import { apiRequest } from "@/lib/queryClient";

interface MaterialViewerProps {
  isOpen?: boolean;
  onClose?: () => void;
  variant: "sidebar" | "dialog";
}

function FormattedText({ content, isSummary }: { content: string; isSummary: boolean }) {
  if (isSummary) {
    const lines = content.split('\n').filter(line => line.trim());
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*');
          const bulletContent = isBullet ? trimmed.slice(1).trim() : trimmed;
          
          if (isBullet) {
            return (
              <div key={index} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm leading-relaxed text-foreground/90">{bulletContent}</p>
              </div>
            );
          }
          
          const isHeader = trimmed.endsWith(':') || trimmed.startsWith('#');
          if (isHeader) {
            return (
              <h4 key={index} className="font-medium text-sm text-foreground pt-2 first:pt-0">
                {trimmed.replace(/^#+\s*/, '').replace(/:$/, '')}
              </h4>
            );
          }
          
          return (
            <p key={index} className="text-sm leading-relaxed text-foreground/90">{trimmed}</p>
          );
        })}
      </div>
    );
  }

  const paragraphs = content.split(/\n\n+/);
  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm leading-relaxed text-foreground/80">
          {paragraph.trim()}
        </p>
      ))}
    </div>
  );
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
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">No material available</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Upload a document to see content here</p>
      </div>
    );
  }

  const displayText = showSummary && summary ? summary : text;
  const wordCount = text ? text.split(/\s+/).length : 0;

  const ContentHeader = () => (
    <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b">
      <div className="flex items-center gap-2">
        {showSummary ? (
          <Badge variant="default" className="gap-1 bg-primary/10 text-primary border-primary/20">
            <ListChecks className="h-3 w-3" />
            Key Points
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {wordCount.toLocaleString()} words
          </Badge>
        )}
      </div>
      <Button
        size="sm"
        variant={showSummary ? "default" : "outline"}
        onClick={handleSummarize}
        disabled={isSummarizing || !text || text.length < 100}
        className="gap-1.5"
        data-testid="button-summarize"
      >
        {isSummarizing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {showSummary ? "Full Text" : "Summarize"}
      </Button>
    </div>
  );

  if (imageDataUrl) {
    return (
      <div className="h-full flex flex-col">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "text" | "image")} className="w-full h-full flex flex-col">
          <TabsList className="w-full mb-4 flex-shrink-0">
            <TabsTrigger value="text" className="flex-1 gap-2" data-testid="tab-text">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="image" className="flex-1 gap-2" data-testid="tab-image">
              <Image className="h-4 w-4" />
              Image
            </TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-0 flex-1 min-h-0 flex flex-col">
            <ContentHeader />
            <ScrollArea className="flex-1 h-[45vh] sm:h-[55vh] lg:h-[calc(100vh-18rem)]">
              <div className="pr-4" data-testid="material-text">
                <FormattedText content={displayText || ''} isSummary={showSummary} />
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="image" className="mt-0 flex-1 min-h-0">
            <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-14rem)]">
              <img 
                src={imageDataUrl} 
                alt="Uploaded material" 
                className="w-full h-auto rounded-lg border"
                data-testid="material-image"
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ContentHeader />
      <ScrollArea className="flex-1 h-[45vh] sm:h-[55vh] lg:h-[calc(100vh-14rem)]">
        <div className="pr-4" data-testid="material-text">
          <FormattedText content={displayText || ''} isSummary={showSummary} />
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
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
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Study Material</h3>
            <p className="text-xs text-muted-foreground">Review your source content</p>
          </div>
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
