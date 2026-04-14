import { useState, useRef } from "react";
import { Upload, X, Loader2, Video, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductVideoUploaderProps {
  videoUrl: string;
  onVideoChange: (url: string) => void;
}

const ProductVideoUploader = ({ videoUrl, onVideoChange }: ProductVideoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(videoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי. מקסימום 50MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("video/")) {
      toast.error("נא להעלות קובץ וידאו בלבד");
      return;
    }

    setUploading(true);

    try {
      const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: "3600",
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
        file_type: file.type,
        file_size: file.size,
      });

      onVideoChange(publicUrl);
      setUrlInput(publicUrl);
      toast.success("הוידאו הועלה בהצלחה");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "שגיאה בהעלאת הוידאו");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onVideoChange(urlInput.trim());
      toast.success("קישור הוידאו נשמר");
    }
  };

  const removeVideo = () => {
    onVideoChange("");
    setUrlInput("");
    toast.success("הוידאו הוסר");
  };

  const getVideoEmbed = (url: string) => {
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    // Vimeo
    if (url.includes("vimeo.com")) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
    return url;
  };

  const isEmbedUrl = videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo");

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Video className="h-4 w-4" />
        וידאו מוצר (אופציונלי)
      </Label>

      {videoUrl ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
            {isEmbedUrl ? (
              <iframe
                src={getVideoEmbed(videoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={videoUrl}
              readOnly
              className="text-xs flex-1"
              dir="ltr"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={removeVideo}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              העלאה
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link className="h-4 w-4" />
              קישור
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
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
                    העלה וידאו מהמחשב
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                MP4, WebM - מקסימום 50MB
              </p>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://youtube.com/... או קישור ישיר"
                dir="ltr"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
              >
                שמור
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              YouTube, Vimeo, או קישור ישיר לקובץ וידאו
            </p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ProductVideoUploader;
