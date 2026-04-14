import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, X, Loader2, Play, Pause, Video, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { processImageForCatalog } from "@/lib/imageProcessor";
import { cn } from "@/lib/utils";

export type MediaType = "image" | "video";

interface MediaSelectorProps {
  mediaUrl: string | null;
  mediaType: MediaType;
  onMediaChange: (url: string | null, type: MediaType) => void;
  label?: string;
  bucket?: string;
  className?: string;
  maxFileSize?: number; // in MB
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const isVideoUrl = (url: string): boolean => {
  const videoExtensions = [".mp4", ".webm", ".mov", ".ogg"];
  const lowercaseUrl = url.toLowerCase();
  
  if (videoExtensions.some(ext => lowercaseUrl.includes(ext))) return true;
  if (lowercaseUrl.includes("youtube.com") || 
      lowercaseUrl.includes("youtu.be") || 
      lowercaseUrl.includes("vimeo.com")) return true;
  
  return false;
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const getVimeoEmbedUrl = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
};

const isEmbedUrl = (url: string): boolean => {
  return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo");
};

export const MediaSelector = ({
  mediaUrl,
  mediaType,
  onMediaChange,
  label = "מדיה",
  bucket = "catalog-media",
  className,
  maxFileSize = 50
}: MediaSelectorProps) => {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error(`הקובץ גדול מדי. מקסימום ${maxFileSize}MB`);
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("סוג קובץ לא נתמך. נא להעלות תמונה או וידאו");
      return;
    }

    if (isImage && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("פורמט תמונה לא נתמך. נא להעלות JPG, PNG, WebP או GIF");
      return;
    }

    if (isVideo && !ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast.error("פורמט וידאו לא נתמך. נא להעלות MP4, WebM או MOV");
      return;
    }

    setUploading(true);

    try {
      let uploadBlob: Blob = file;
      let contentType = file.type;
      let fileExt = file.name.split('.').pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");

      // Process images (except GIFs) - convert to WebP for optimization
      if (isImage && !file.type.includes("gif")) {
        try {
          const result = await processImageForCatalog(file);
          uploadBlob = result.blob;
          contentType = result.format === 'webp' ? 'image/webp' : 'image/jpeg';
          fileExt = result.format;
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }

      const fileName = `media-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, uploadBlob, {
          contentType,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Save to media table for tracking
      await supabase.from("media").insert({
        filename: fileName,
        file_url: publicUrl,
        original_filename: file.name,
        file_type: contentType,
        file_size: uploadBlob.size,
      });

      onMediaChange(publicUrl, isVideo ? "video" : "image");
      toast.success(isVideo ? "הוידאו הועלה בהצלחה" : "התמונה הועלתה בהצלחה");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "שגיאה בהעלאת הקובץ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    
    if (!url.trim()) return;

    try {
      new URL(url);
    } catch {
      return;
    }

    const type = isVideoUrl(url) ? "video" : "image";
    onMediaChange(url.trim(), type);
    toast.success(type === "video" ? "קישור הוידאו נשמר" : "קישור התמונה נשמר");
  };

  const removeMedia = () => {
    onMediaChange(null, "image");
    setUrlInput("");
    toast.success("המדיה הוסרה");
  };

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const renderMediaPreview = () => {
    if (!mediaUrl) return null;

    if (mediaType === "video") {
      if (isEmbedUrl(mediaUrl)) {
        const embedUrl = getYouTubeEmbedUrl(mediaUrl) || getVimeoEmbedUrl(mediaUrl) || mediaUrl;
        return (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <Badge className="absolute top-2 left-2 bg-primary/90">
              <Video className="h-3 w-3 ml-1" />
              וידאו חיצוני
            </Badge>
          </div>
        );
      }

      return (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center group">
          <video
            ref={videoRef}
            src={mediaUrl}
            className="max-h-full"
            muted
            loop
            playsInline
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <Badge className="absolute top-2 left-2 bg-primary/90">
            <Video className="h-3 w-3 ml-1" />
            וידאו
          </Badge>
        </div>
      );
    }

    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
        <img
          src={mediaUrl}
          alt="Preview"
          className="object-contain max-h-full"
        />
        <Badge className="absolute top-2 left-2 bg-primary/90">
          <Image className="h-3 w-3 ml-1" />
          תמונה
        </Badge>
      </div>
    );
  };

  return (
    <div className={cn("w-full p-6 bg-white border border-gray-100 rounded-xl shadow-sm", className)}>
      {/* Header with label */}
      <div className="flex items-center gap-2 mb-4">
        {mediaType === "video" ? <Video className="h-4 w-4" /> : <Image className="h-4 w-4" />}
        <span className="font-medium">{label}</span>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="flex gap-4 mb-6 border-b pb-4">
        <button 
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
            mode === "upload" 
              ? "bg-black text-white" 
              : "text-gray-500 hover:bg-gray-50"
          )}
        >
          <Upload size={18} /> העלאת קובץ
        </button>
        <button 
          type="button"
          onClick={() => setMode("url")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
            mode === "url" 
              ? "bg-black text-white" 
              : "text-gray-500 hover:bg-gray-50"
          )}
        >
          <LinkIcon size={18} /> קישור חיצוני
        </button>
      </div>

      {/* Upload Mode */}
      {mode === "upload" && (
        <div 
          className={cn(
            "border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-black transition-colors cursor-pointer",
            uploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {uploading ? (
              <Loader2 className="text-gray-400 animate-spin" />
            ) : (
              <Upload className="text-gray-400" />
            )}
          </div>
          <p className="text-sm font-medium">
            {uploading ? "מעלה..." : "גרור קובץ לכאן או לחץ לבחירה"}
          </p>
          <p className="text-xs text-gray-400 mt-1">MP4, WebM, PNG, JPG (עד {maxFileSize}MB)</p>
        </div>
      )}

      {/* URL Mode */}
      {mode === "url" && (
        <input 
          type="url" 
          placeholder="הדבק קישור (URL) לתמונה או וידאו..." 
          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          value={urlInput}
          onChange={handleUrlSubmit}
          dir="ltr"
        />
      )}

      {/* Media Preview */}
      {mediaUrl && (
        <div className="mt-6 relative group">
          {renderMediaPreview()}
          <button 
            type="button"
            onClick={removeMedia}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaSelector;
