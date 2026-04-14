import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crop, ZoomIn, ZoomOut, RotateCw, Check, X, Maximize2 } from "lucide-react";

interface ImageEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageUrl: string) => void;
}

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

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: CroppedArea,
  targetWidth?: number,
  targetHeight?: number
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to target dimensions or cropped dimensions
  canvas.width = targetWidth || pixelCrop.width;
  canvas.height = targetHeight || pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.9);
};

export const ImageEditor = ({ imageUrl, isOpen, onClose, onSave }: ImageEditorProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [outputWidth, setOutputWidth] = useState<string>("");
  const [outputHeight, setOutputHeight] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const targetWidth = outputWidth ? parseInt(outputWidth) : undefined;
      const targetHeight = outputHeight ? parseInt(outputHeight) : undefined;
      
      const croppedImage = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        targetWidth,
        targetHeight
      );
      onSave(croppedImage);
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
    setRotation(0);
    setOutputWidth("");
    setOutputHeight("");
    setAspectRatio(undefined);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const aspectRatios = [
    { label: "חופשי", value: undefined },
    { label: "1:1", value: 1 },
    { label: "16:9", value: 16 / 9 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:2", value: 3 / 2 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            עריכת תמונה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cropper Area */}
          <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Zoom */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                זום
              </Label>
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                סיבוב
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">0°</span>
                <Slider
                  value={[rotation]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(value) => setRotation(value[0])}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">360°</span>
              </div>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>יחס גובה-רוחב</Label>
            <div className="flex flex-wrap gap-2">
              {aspectRatios.map((ratio) => (
                <Button
                  key={ratio.label}
                  variant={aspectRatio === ratio.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAspectRatio(ratio.value)}
                >
                  {ratio.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Output Dimensions */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              גודל פלט (אופציונלי)
            </Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">רוחב:</Label>
                <Input
                  type="number"
                  placeholder="אוטומטי"
                  value={outputWidth}
                  onChange={(e) => setOutputWidth(e.target.value)}
                  className="w-24"
                  dir="ltr"
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">גובה:</Label>
                <Input
                  type="number"
                  placeholder="אוטומטי"
                  value={outputHeight}
                  onChange={(e) => setOutputHeight(e.target.value)}
                  className="w-24"
                  dir="ltr"
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 ml-2" />
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={isProcessing}>
              <Check className="h-4 w-4 ml-2" />
              {isProcessing ? "מעבד..." : "שמור והכנס"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
