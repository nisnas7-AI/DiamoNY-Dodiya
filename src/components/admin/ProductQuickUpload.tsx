import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Upload, 
  X, 
  Loader2, 
  Sparkles,
  Link,
  Image as ImageIcon,
  Film,
  Star,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  compressToWebP, 
  processImageForCatalog,
  isVideoFile,
  isImageFile
} from "@/lib/imageProcessor";

interface UploadedFile {
  id: string;
  url: string;
  alt_text: string;
  file_name: string;
  type: 'image' | 'video';
  isMain?: boolean;
}

interface ProductQuickUploadProps {
  images: UploadedFile[];
  videoUrl?: string;
  onImagesChange: (images: UploadedFile[]) => void;
  onVideoChange?: (url: string) => void;
  maxImages?: number;
}

const ProductQuickUpload = ({ 
  images, 
  videoUrl,
  onImagesChange, 
  onVideoChange,
  maxImages = 10 
}: ProductQuickUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [useWebP, setUseWebP] = useState(true);
  const [standardize, setStandardize] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const processAndUploadFile = async (file: File): Promise<UploadedFile | null> => {
    try {
      const isVideo = isVideoFile(file.name);
      
      if (isVideo) {
        // Check video size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          toast.error("גודל וידאו מקסימלי: 50MB");
          return null;
        }
        
        const filename = `video-${Date.now()}-${crypto.randomUUID()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("catalog-media")
          .upload(filename, file, {
            contentType: file.type,
            cacheControl: "31536000",
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("catalog-media")
          .getPublicUrl(filename);

        return {
          id: crypto.randomUUID(),
          url: publicUrl,
          alt_text: "",
          file_name: filename,
          type: 'video',
        };
      } else {
        // Process image - quality preservation for small files is handled inside processImageForCatalog
        let processedBlob: Blob;
        let fileExtension: string;

        if (standardize) {
          const result = await processImageForCatalog(file);
          processedBlob = result.blob;
          fileExtension = result.format;
          // Log if quality was preserved (skipped compression)
          if (result.skippedCompression) {
            console.log(`Quality preserved for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB < 1.5MB)`);
          }
        } else if (useWebP) {
          const result = await compressToWebP(file);
          processedBlob = result.blob;
          fileExtension = result.format;
        } else {
          // Raw upload - no processing at all
          processedBlob = file;
          fileExtension = file.name.split('.').pop() || 'jpg';
        }

        const filename = `product-${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
        const { error: uploadError } = await supabase.storage
          .from("catalog-media")
          .upload(filename, processedBlob, {
            contentType: `image/${fileExtension}`,
            cacheControl: "31536000",
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("catalog-media")
          .getPublicUrl(filename);

        // Save to media table
        await supabase.from("media").insert({
          filename: filename,
          file_url: publicUrl,
          original_filename: file.name,
          file_type: `image/${fileExtension}`,
          file_size: processedBlob.size,
        });

        return {
          id: crypto.randomUUID(),
          url: publicUrl,
          alt_text: "",
          file_name: filename,
          type: 'image',
          isMain: images.filter(i => i.type === 'image').length === 0,
        };
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`שגיאה בהעלאת ${file.name}`);
      return null;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(f => isImageFile(f.name));
    const videoFiles = acceptedFiles.filter(f => isVideoFile(f.name));
    
    const currentImageCount = images.filter(i => i.type === 'image').length;
    const remainingSlots = maxImages - currentImageCount;
    
    if (imageFiles.length > remainingSlots) {
      toast.warning(`ניתן להעלות עד ${maxImages} תמונות`);
    }

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    // Process images (limited by remaining slots)
    for (const file of imageFiles.slice(0, remainingSlots)) {
      const result = await processAndUploadFile(file);
      if (result) newFiles.push(result);
    }

    // Process video (only take first one if no video exists)
    if (videoFiles.length > 0 && !videoUrl) {
      const videoResult = await processAndUploadFile(videoFiles[0]);
      if (videoResult && onVideoChange) {
        onVideoChange(videoResult.url);
        toast.success("וידאו הועלה בהצלחה");
      }
    }

    if (newFiles.length > 0) {
      // Set first image as main if no main exists
      const hasMain = images.some(i => i.isMain);
      if (!hasMain && newFiles.length > 0) {
        const firstImage = newFiles.find(f => f.type === 'image');
        if (firstImage) firstImage.isMain = true;
      }
      onImagesChange([...images, ...newFiles]);
      toast.success(`${newFiles.length} קבצים הועלו בהצלחה`);
    }

    setUploading(false);
  }, [images, maxImages, videoUrl, onImagesChange, onVideoChange, standardize, useWebP]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    multiple: true,
    disabled: uploading,
  });

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    
    setLoadingUrl(true);
    try {
      // Fetch the image/video from URL
      const response = await fetch(urlInput);
      if (!response.ok) throw new Error("לא ניתן לטעון את הקובץ");
      
      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || '';
      const isVideo = contentType.startsWith('video/');
      const extension = isVideo ? 'mp4' : 'jpg';
      
      const filename = `import-${Date.now()}-${crypto.randomUUID()}.${extension}`;
      
      let uploadBlob = blob;
      if (!isVideo && standardize) {
        const result = await processImageForCatalog(blob as any);
        uploadBlob = result.blob;
      }
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(filename, uploadBlob, {
          contentType: isVideo ? contentType : 'image/jpeg',
          cacheControl: "31536000",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(filename);

      if (isVideo) {
        onVideoChange?.(publicUrl);
        toast.success("וידאו יובא בהצלחה");
      } else {
        const newImage: UploadedFile = {
          id: crypto.randomUUID(),
          url: publicUrl,
          alt_text: "",
          file_name: filename,
          type: 'image',
          isMain: images.filter(i => i.type === 'image').length === 0,
        };
        onImagesChange([...images, newImage]);
        toast.success("תמונה יובאה בהצלחה");
      }
      
      setUrlInput("");
    } catch (error: any) {
      toast.error(error.message || "שגיאה בייבוא מ-URL");
    } finally {
      setLoadingUrl(false);
    }
  };

  const removeFile = (id: string) => {
    const file = images.find(f => f.id === id);
    if (!file) return;
    
    const newImages = images.filter(f => f.id !== id);
    
    // If removed main image, set next image as main
    if (file.isMain && newImages.length > 0) {
      const nextImage = newImages.find(i => i.type === 'image');
      if (nextImage) nextImage.isMain = true;
    }
    
    onImagesChange(newImages);
  };

  const setMainImage = (id: string) => {
    const newImages = images.map(img => ({
      ...img,
      isMain: img.id === id,
    }));
    onImagesChange(newImages);
  };

  const generateAISeo = async (id: string) => {
    const image = images.find(i => i.id === id);
    if (!image || image.type !== 'image') return;
    
    setGeneratingSeo(id);
    try {
      const { data, error } = await supabase.functions.invoke("ai-media-seo", {
        body: { imageUrl: image.url },
      });

      if (error) throw error;

      const newImages = images.map(img => 
        img.id === id ? { ...img, alt_text: data.alt_text || data.description || "" } : img
      );
      onImagesChange(newImages);
      toast.success("תיאור AI נוצר");
    } catch (error: any) {
      toast.error("שגיאה ביצירת תיאור AI");
    } finally {
      setGeneratingSeo(null);
    }
  };

  // Drag and drop for reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    // Update main status - first image is always main
    newImages.forEach((img, i) => {
      if (img.type === 'image') {
        img.isMain = i === newImages.findIndex(im => im.type === 'image');
      }
    });
    
    setDraggedIndex(index);
    onImagesChange(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const imageCount = images.filter(i => i.type === 'image').length;

  return (
    <div className="space-y-4">
      {/* Settings */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-secondary/30 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <Switch id="quick-webp" checked={useWebP} onCheckedChange={setUseWebP} />
          <Label htmlFor="quick-webp" className="text-xs">WebP</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="quick-standardize" checked={standardize} onCheckedChange={setStandardize} />
          <Label htmlFor="quick-standardize" className="text-xs">עיבוד (קבצים {'<'}1.5MB ישמרו באיכות מקור)</Label>
        </div>
        <Badge variant="secondary" className="text-xs">
          {imageCount}/{maxImages} תמונות
        </Badge>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
          <p className="text-sm">
            {uploading ? "מעלה..." : isDragActive ? "שחרר כאן" : "גרור תמונות/וידאו או לחץ"}
          </p>
          <p className="text-xs text-muted-foreground">
            תמונות: JPG, PNG, WebP • וידאו: MP4, WebM (עד 50MB)
          </p>
        </div>
      </div>

      {/* URL Import */}
      <div className="flex gap-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="או הדבק URL של תמונה/וידאו..."
          className="text-sm"
        />
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleUrlImport}
          disabled={loadingUrl || !urlInput.trim()}
        >
          {loadingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
        </Button>
      </div>

      {/* Uploaded Files Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">גרור לשינוי סדר • לחץ על כוכב לבחירת תמונה ראשית</p>
          <div className="grid grid-cols-4 gap-2">
            {images.map((file, index) => (
              <div
                key={file.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group aspect-[4/5] rounded-lg overflow-hidden border-2 cursor-move
                  ${file.isMain ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}
                  ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                `}
              >
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.alt_text} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <Film className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Drag Handle */}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-white drop-shadow" />
                </div>
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  {file.type === 'image' && !file.isMain && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => setMainImage(file.id)}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  {file.type === 'image' && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => generateAISeo(file.id)}
                      disabled={generatingSeo === file.id}
                    >
                      {generatingSeo === file.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Badges */}
                {file.isMain && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    ראשית
                  </div>
                )}
                {file.type === 'video' && (
                  <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                    וידאו
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video URL */}
      {videoUrl && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <Film className="h-4 w-4 text-blue-500" />
          <span className="text-sm flex-1 truncate">{videoUrl}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onVideoChange?.("")}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Alt Text Inputs */}
      {images.filter(i => i.type === 'image').length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">תיאורי תמונות (Alt Text)</Label>
          {images.filter(i => i.type === 'image').map((image, idx) => (
            <Input
              key={image.id}
              value={image.alt_text}
              onChange={(e) => {
                const newImages = images.map(img => 
                  img.id === image.id ? { ...img, alt_text: e.target.value } : img
                );
                onImagesChange(newImages);
              }}
              placeholder={`תיאור תמונה ${idx + 1}${image.isMain ? ' (ראשית)' : ''}...`}
              className="text-sm"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductQuickUpload;