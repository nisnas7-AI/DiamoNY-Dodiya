import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIBannerGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
}

const styleOptions = [
  { value: "luxury-gold", label: "יוקרה זהב" },
  { value: "elegant-diamond", label: "יהלומים אלגנטיים" },
  { value: "romantic-rose", label: "רומנטי ורוד" },
  { value: "modern-minimal", label: "מודרני מינימליסטי" },
  { value: "festive-holiday", label: "חגיגי לחג" },
  { value: "dark-luxury", label: "יוקרה כהה" },
];

const AIBannerGenerator = ({ onImageGenerated }: AIBannerGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("luxury-gold");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("נא להזין תיאור לבאנר");
      return;
    }

    setIsGenerating(true);
    setPreviewImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-banner", {
        body: { prompt, style },
      });

      if (error) {
        console.error("Function error:", error);
        throw new Error(error.message || "שגיאה ביצירת הבאנר");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.image) {
        setPreviewImage(data.image);
        toast.success("הבאנר נוצר בהצלחה!");
      } else {
        throw new Error("לא התקבלה תמונה");
      }
    } catch (error) {
      console.error("Error generating banner:", error);
      const message = error instanceof Error ? error.message : "שגיאה ביצירת הבאנר";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = async () => {
    if (!previewImage) return;

    setIsGenerating(true);
    try {
      // Convert base64 to blob and upload to storage
      const response = await fetch(previewImage);
      const blob = await response.blob();
      
      const fileName = `ai-banner-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      onImageGenerated(publicUrl);
      toast.success("הבאנר נשמר בהצלחה!");
      setIsOpen(false);
      setPreviewImage(null);
      setPrompt("");
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("שגיאה בשמירת הבאנר");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Wand2 className="h-4 w-4 ml-2" />
          יצירה עם AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            יצירת באנר עם AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>תאר את הבאנר שאתה רוצה</Label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="למשל: מבצע חורף עם רקע שלג ויהלומים נוצצים"
              className="mt-1"
            />
          </div>

          <div>
            <Label>סגנון עיצוב</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {previewImage && (
            <div className="space-y-2">
              <Label>תצוגה מקדימה</Label>
              <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                <img
                  src={previewImage}
                  alt="AI Generated Banner"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!previewImage ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    יוצר באנר...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 ml-2" />
                    צור באנר
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setPreviewImage(null)}
                  disabled={isGenerating}
                >
                  נסה שוב
                </Button>
                <Button
                  onClick={handleUseImage}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    "השתמש בבאנר הזה"
                  )}
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            התמונה נוצרת באמצעות AI ומותאמת לתכשיטים יוקרתיים
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIBannerGenerator;
