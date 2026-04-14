import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crop, ZoomIn, ZoomOut, Check, X } from "lucide-react";

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: CroppedArea): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  // Output a square image at good resolution
  const size = Math.min(pixelCrop.width, pixelCrop.height, 800);
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, size, size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/jpeg", 0.92);
  });
};

interface TestimonialImageCropperProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedBlob: Blob) => void;
}

export const TestimonialImageCropper = ({ imageUrl, isOpen, onClose, onSave }: TestimonialImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
      onSave(blob);
      resetState();
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            חיתוך תמונת מוצר – מסגרת עגולה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cropper with circular mask */}
          <div className="relative h-[300px] bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          {/* Zoom control */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <ZoomIn className="h-4 w-4" />
              זום
            </Label>
            <div className="flex items-center gap-2">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(v) => setZoom(v[0])}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={handleClose} size="sm">
              <X className="h-4 w-4 ml-1" />
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={isProcessing} size="sm">
              <Check className="h-4 w-4 ml-1" />
              {isProcessing ? "מעבד..." : "חתוך ושמור"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
