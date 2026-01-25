import { useState } from "react";
import { FileText, Image, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuiz, type SourceMaterialType } from "@/lib/quiz-context";
import { apiRequest } from "@/lib/queryClient";

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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No material available</p>
      </div>
    );
  }

  const SummarizeButton = () => (
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
  );

  const displayText = showSummary && summary ? summary : text;

  if (imageDataUrl) {
    return (
      <div className="h-full flex flex-col">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "text" | "image")} className="w-full h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <TabsList className="flex-1">
              <TabsTrigger value="text" className="flex-1 gap-2" data-testid="tab-text">
                <FileText className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image" className="flex-1 gap-2" data-testid="tab-image">
                <Image className="h-4 w-4" />
                Image
              </TabsTrigger>
            </TabsList>
            {viewMode === "text" && <SummarizeButton />}
          </div>
          <TabsContent value="text" className="mt-0 flex-1 min-h-0">
            <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-14rem)]">
              <div className="text-sm leading-relaxed whitespace-pre-wrap pr-4" data-testid="material-text">
                {displayText}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="image" className="mt-0 flex-1 min-h-0">
            <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-14rem)]">
              <img 
                src={imageDataUrl} 
                alt="Uploaded material" 
                className="w-full h-auto rounded-md"
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
      <div className="flex justify-end mb-3 flex-shrink-0">
        <SummarizeButton />
      </div>
      <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-12rem)]">
        <div className="text-sm leading-relaxed whitespace-pre-wrap pr-4" data-testid="material-text">
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
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
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Study Material
        </h3>
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
