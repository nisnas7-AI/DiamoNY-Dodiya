import { useState, useRef } from "react";
import { Upload, X, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { processImageForCatalog } from "@/lib/imageProcessor";
import { toast } from "sonner";

interface UploadedImage {
  url: string;
  alt_text: string;
  file_name: string;
  isMain?: boolean;
}

interface ProductImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

const ProductImageUploader = ({ 
  images, 
  onImagesChange, 
  maxImages = 5 
}: ProductImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`ניתן להעלות עד ${maxImages} תמונות`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const newImages: UploadedImage[] = [];

      for (const file of filesToUpload) {
        // Process image with high quality WebP (preserves aspect ratio)
        const processed = await processImageForCatalog(file, {
          maxDimension: 2400,
          quality: 0.95,
          outputFormat: 'webp'
        });
        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${processed.format}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("catalog-media")
          .upload(fileName, processed.blob, {
            contentType: processed.format === 'webp' ? 'image/webp' : 'image/jpeg',
            cacheControl: "31536000", // 1 year cache for immutable images
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("catalog-media")
          .getPublicUrl(fileName);

        // Save to media table
        await supabase.from("media").insert({
          filename: fileName,
          file_url: publicUrl,
          original_filename: file.name,
          file_type: processed.format === 'webp' ? 'image/webp' : 'image/jpeg',
          file_size: processed.blob.size,
        });

        newImages.push({
          url: publicUrl,
          alt_text: "",
          file_name: fileName,
          isMain: images.length === 0 && newImages.length === 0,
        });
      }

      onImagesChange([...images, ...newImages]);
      toast.success(`${newImages.length} תמונות הועלו בהצלחה`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "שגיאה בהעלאת התמונות");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // If we removed the main image, make the first one main
    if (images[index].isMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }
    onImagesChange(newImages);
  };

  const setMainImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
    onImagesChange(newImages);
  };

  const updateAltText = (index: number, altText: string) => {
    const newImages = [...images];
    newImages[index].alt_text = altText;
    onImagesChange(newImages);
  };

  const generateAISeo = async (index: number) => {
    const image = images[index];
    setGeneratingSeo(index);

    try {
      const { data, error } = await supabase.functions.invoke("ai-media-seo", {
        body: { imageUrl: image.url },
      });

      if (error) throw error;

      const newImages = [...images];
      newImages[index].alt_text = data.alt_text || data.description || "";
      onImagesChange(newImages);

      // Update media table
      await supabase
        .from("media")
        .update({
          alt_text: data.alt_text,
          ai_description: data.description,
          ai_tags: data.tags,
        })
        .eq("file_url", image.url);

      toast.success("תיאור AI נוצר בהצלחה");
    } catch (error: any) {
      toast.error(error.message || "שגיאה ביצירת תיאור AI");
    } finally {
      setGeneratingSeo(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          תמונות מוצר (מקסימום {maxImages})
        </Label>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              מעלה...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              העלה תמונות מהמחשב
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          תמונות באיכות גבוהה (WebP, עד 2400px)
        </p>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div 
              key={index} 
              className={`relative group rounded-lg overflow-hidden border-2 ${
                image.isMain ? "border-primary" : "border-transparent"
              }`}
            >
              <img
                src={image.url}
                alt={image.alt_text || `תמונה ${index + 1}`}
                className="w-full aspect-square object-cover"
              />
              
              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {!image.isMain && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setMainImage(index)}
                    className="text-xs"
                  >
                    הגדר כראשית
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => generateAISeo(index)}
                  disabled={generatingSeo === index}
                  className="text-xs gap-1"
                >
                  {generatingSeo === index ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  SEO AI
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Main Badge */}
              {image.isMain && (
                <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                  ראשית
                </div>
              )}

              {/* Index Badge */}
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                {index === 0 ? "ראשית" : index === 1 ? "משנית" : `נוספת ${index}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alt Text Inputs */}
      {images.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">תיאורי תמונות (Alt Text)</Label>
          {images.map((image, index) => (
            <Input
              key={index}
              value={image.alt_text}
              onChange={(e) => updateAltText(index, e.target.value)}
              placeholder={`תיאור תמונה ${index + 1}...`}
              className="text-sm"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageUploader;
