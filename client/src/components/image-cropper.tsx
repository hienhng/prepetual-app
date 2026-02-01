import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Crop as CropIcon, Plus, Trash2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CroppedRegion {
  id: string;
  description: string;
  imageDataUrl: string;
}

interface ImageCropperProps {
  imageDataUrl: string;
  onCropsComplete: (crops: CroppedRegion[]) => void;
  onCancel: () => void;
  isOpen: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 50,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropper({ imageDataUrl, onCropsComplete, onCancel, isOpen }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [croppedRegions, setCroppedRegions] = useState<CroppedRegion[]>([]);
  const [currentDescription, setCurrentDescription] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Reset state when image changes or dialog opens
  useEffect(() => {
    if (isOpen && imageDataUrl) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCroppedRegions([]);
      setCurrentDescription("");
    }
  }, [imageDataUrl, isOpen]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerAspectCrop(width, height, 1);
    setCrop(initialCrop);
  }, []);

  const getCroppedImg = useCallback((): string | null => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas.toDataURL("image/png");
  }, [completedCrop]);

  const handleAddCrop = () => {
    const croppedImageUrl = getCroppedImg();
    if (!croppedImageUrl) return;

    const newRegion: CroppedRegion = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: currentDescription.trim() || "Manually cropped illustration",
      imageDataUrl: croppedImageUrl,
    };

    setCroppedRegions(prev => [...prev, newRegion]);
    setCurrentDescription("");
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleRemoveCrop = (id: string) => {
    setCroppedRegions(prev => prev.filter(r => r.id !== id));
  };

  const handleComplete = () => {
    onCropsComplete(croppedRegions);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5 text-primary" />
            Crop Illustrations
          </DialogTitle>
          <DialogDescription>
            Select regions of the image that contain diagrams, charts, or illustrations. These will be matched with quiz questions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select a region to crop</Label>
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  src={imageDataUrl}
                  alt="Source"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[400px] object-contain"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>

            {completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="crop-description" className="text-sm">Description (optional)</Label>
                  <Input
                    id="crop-description"
                    placeholder="e.g., Triangle with labeled vertices A, B, C"
                    value={currentDescription}
                    onChange={(e) => setCurrentDescription(e.target.value)}
                    data-testid="input-crop-description"
                  />
                </div>
                <Button
                  onClick={handleAddCrop}
                  className="w-full"
                  data-testid="button-add-crop"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add This Crop
                </Button>
              </motion.div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Cropped Illustrations ({croppedRegions.length})
            </Label>
            
            <div className="border rounded-lg p-3 min-h-[200px] bg-muted/20">
              <AnimatePresence mode="popLayout">
                {croppedRegions.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-muted-foreground text-center py-8"
                  >
                    No crops added yet. Select a region and click "Add This Crop"
                  </motion.p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {croppedRegions.map((region, index) => (
                      <motion.div
                        key={region.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        layout
                      >
                        <Card className="p-2 relative group">
                          <div className="absolute top-1 right-1 z-10">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveCrop(region.id)}
                              data-testid={`button-remove-crop-${index}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="aspect-square rounded overflow-hidden bg-white mb-1.5">
                            <img
                              src={region.imageDataUrl}
                              alt={region.description}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {region.description}
                          </p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel-crop">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={croppedRegions.length === 0}
            data-testid="button-complete-crop"
          >
            <Check className="h-4 w-4 mr-2" />
            Use {croppedRegions.length} Illustration{croppedRegions.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
