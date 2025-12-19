import { useState } from "react";
import { FileText, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuiz, type SourceMaterialType } from "@/lib/quiz-context";

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

  if (!text && !imageDataUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No material available</p>
      </div>
    );
  }

  if (materialType === "image" && imageDataUrl) {
    return (
      <div className="h-full flex flex-col">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "text" | "image")} className="w-full h-full flex flex-col">
          <TabsList className="w-full mb-4 flex-shrink-0">
            <TabsTrigger value="text" className="flex-1 gap-2" data-testid="tab-text">
              <FileText className="h-4 w-4" />
              Extracted Text
            </TabsTrigger>
            <TabsTrigger value="image" className="flex-1 gap-2" data-testid="tab-image">
              <Image className="h-4 w-4" />
              Original Image
            </TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-0 flex-1 min-h-0">
            <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-14rem)]">
              <div className="text-sm leading-relaxed whitespace-pre-wrap pr-4" data-testid="material-text">
                {text}
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
    <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-10rem)]">
      <div className="text-sm leading-relaxed whitespace-pre-wrap pr-4" data-testid="material-text">
        {text}
      </div>
    </ScrollArea>
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
