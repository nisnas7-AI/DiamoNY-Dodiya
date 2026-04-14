import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2, Instagram, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  price?: number;
  main_image_url?: string;
}

interface SocialStoryGeneratorProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const SocialStoryGenerator = ({ product, isOpen, onClose }: SocialStoryGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [customTagline, setCustomTagline] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const STORY_WIDTH = 1080;
  const STORY_HEIGHT = 1920;

  const generateStoryImage = async () => {
    if (!product.main_image_url) {
      toast.error("למוצר זה אין תמונה ראשית");
      return;
    }

    setIsGenerating(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = STORY_WIDTH;
      canvas.height = STORY_HEIGHT;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas context not available');

      // Background gradient - Premium dark
      const gradient = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);
      gradient.addColorStop(0, '#1A1A1B');
      gradient.addColorStop(0.5, '#2D2D2E');
      gradient.addColorStop(1, '#1A1A1B');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

      // Load product image
      const productImg = new Image();
      productImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        productImg.onload = () => resolve();
        productImg.onerror = () => reject(new Error('Failed to load product image'));
        productImg.src = product.main_image_url!;
      });

      // Draw product image - centered, large
      const imgSize = 800;
      const imgX = (STORY_WIDTH - imgSize) / 2;
      const imgY = 300;
      
      // Circular mask for product image
      ctx.save();
      ctx.beginPath();
      ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(productImg, imgX, imgY, imgSize, imgSize);
      ctx.restore();

      // Gold accent ring around image
      ctx.beginPath();
      ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2 + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#C5A059';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Brand logo at top
      ctx.fillStyle = '#C5A059';
      ctx.font = 'bold 48px "Cormorant Garamond", serif';
      ctx.textAlign = 'center';
      ctx.fillText('DiamoNY', STORY_WIDTH / 2, 120);

      // Tagline
      ctx.fillStyle = '#E5E4E2';
      ctx.font = '24px "Inter", sans-serif';
      ctx.fillText('HANDCRAFTED JEWELRY', STORY_WIDTH / 2, 170);

      // Product Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 56px "Cormorant Garamond", serif';
      ctx.textAlign = 'center';
      
      // Handle long names
      const words = product.name.split(' ');
      let lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > STORY_WIDTH - 100) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);
      
      const nameY = imgY + imgSize + 100;
      lines.forEach((line, i) => {
        ctx.fillText(line, STORY_WIDTH / 2, nameY + i * 70);
      });

      // Price
      if (product.price) {
        const priceY = nameY + lines.length * 70 + 60;
        ctx.fillStyle = '#C5A059';
        ctx.font = 'bold 72px "Cormorant Garamond", serif';
        ctx.fillText(`₪${product.price.toLocaleString()}`, STORY_WIDTH / 2, priceY);
      }

      // Custom tagline or default
      const tagline = customTagline || 'יצירה ייחודית בעבודת יד';
      ctx.fillStyle = '#A0A0A0';
      ctx.font = '32px "Inter", sans-serif';
      ctx.fillText(tagline, STORY_WIDTH / 2, STORY_HEIGHT - 200);

      // CTA
      ctx.fillStyle = '#C5A059';
      ctx.font = 'bold 28px "Inter", sans-serif';
      ctx.fillText('לפרטים נוספים ➜ DiamoNY.me', STORY_WIDTH / 2, STORY_HEIGHT - 120);

      // Convert to image
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setGeneratedImage(dataUrl);
      
      toast.success("תמונת סטורי נוצרה בהצלחה");
    } catch (error: any) {
      console.error('Story generation error:', error);
      toast.error("שגיאה ביצירת התמונה");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.download = `${product.name.replace(/\s+/g, '-')}-story.jpg`;
    link.href = generatedImage;
    link.click();
    
    toast.success("התמונה הורדה בהצלחה");
  };

  const handleClose = () => {
    setGeneratedImage(null);
    setCustomTagline("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5" />
            יצירת תמונה לסטורי
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Preview */}
          <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
            {product.main_image_url && (
              <img 
                src={product.main_image_url} 
                alt={product.name}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div>
              <p className="font-medium">{product.name}</p>
              {product.price && (
                <p className="text-accent">₪{product.price.toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Custom Tagline */}
          <div className="space-y-2">
            <Label>טקסט מותאם אישית (אופציונלי)</Label>
            <Input
              value={customTagline}
              onChange={(e) => setCustomTagline(e.target.value)}
              placeholder="יצירה ייחודית בעבודת יד"
            />
          </div>

          {/* Generated Image Preview */}
          {generatedImage && (
            <div className="border rounded-lg overflow-hidden">
              <img 
                src={generatedImage} 
                alt="Story Preview"
                className="w-full max-h-[400px] object-contain bg-black"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!generatedImage ? (
            <Button 
              onClick={generateStoryImage} 
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              צור תמונה
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setGeneratedImage(null)}>
                צור מחדש
              </Button>
              <Button onClick={downloadImage} className="gap-2">
                <Download className="w-4 h-4" />
                הורד (1080x1920)
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SocialStoryGenerator;
