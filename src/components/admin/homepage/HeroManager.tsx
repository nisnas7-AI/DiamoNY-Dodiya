import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Upload, Loader2, Video, Link, RotateCcw, Trash2, ImageIcon, Layers } from "lucide-react";
import PositionPicker, { type Position } from "./PositionPicker";

const DEFAULT_BACKGROUND_IMAGE = "/lovable-uploads/5fbea2df-72c8-4caa-bffe-c87cfb578052.png";
const DEFAULT_LOGO_IMAGE = "/lovable-uploads/diamony-hero-logo.png";
const DEFAULT_VIDEO_SIZE = 85;

type VideoFormat = '1:1' | '16:9' | '9:16' | 'custom';

interface HeroMetadata {
  video_size?: number;
  video_position?: Position;
  video_format?: VideoFormat;
  video_custom_width?: number;
  video_custom_height?: number;
  overlay_image_url?: string | null;
  overlay_position?: Position;
  overlay_size?: number;
  logo_url?: string | null;
  show_logo?: boolean;
  // Video settings
  video_loop?: boolean;
  video_playback_speed?: number;
  video_overlay_opacity?: number;
  video_poster_image?: string | null;
}

interface HeroSection {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  video_url: string | null;
  metadata: HeroMetadata | null;
  cta_primary_text: string | null;
  cta_primary_url: string | null;
  cta_secondary_text: string | null;
  cta_secondary_url: string | null;
}

const HeroManager = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingOverlay, setUploadingOverlay] = useState(false);
  
  // Video settings
  const [videoSize, setVideoSize] = useState<number>(DEFAULT_VIDEO_SIZE);
  const [videoPosition, setVideoPosition] = useState<Position>('center');
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('1:1');
  const [videoCustomWidth, setVideoCustomWidth] = useState<number>(50);
  const [videoCustomHeight, setVideoCustomHeight] = useState<number>(50);
  const [videoLoop, setVideoLoop] = useState<boolean>(true);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1);
  const [videoOverlayOpacity, setVideoOverlayOpacity] = useState<number>(0);
  const [videoPosterImage, setVideoPosterImage] = useState<string>("");
  const [uploadingPoster, setUploadingPoster] = useState(false);
  
  // Overlay settings
  const [overlayPosition, setOverlayPosition] = useState<Position>('center');
  const [overlaySize, setOverlaySize] = useState<number>(30);

  const { data: heroSection, isLoading } = useQuery({
    queryKey: ["homepage-hero", getBrandId()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .eq("key", "hero")
        .maybeSingle();
      
      if (error) throw error;
      
      // Set values from metadata if exists
      if (data?.metadata && typeof data.metadata === 'object') {
        const meta = data.metadata as HeroMetadata;
        if (meta.video_size) setVideoSize(meta.video_size);
        if (meta.video_position) setVideoPosition(meta.video_position);
        if (meta.video_format) setVideoFormat(meta.video_format);
        if (meta.video_custom_width) setVideoCustomWidth(meta.video_custom_width);
        if (meta.video_custom_height) setVideoCustomHeight(meta.video_custom_height);
        if (meta.overlay_position) setOverlayPosition(meta.overlay_position);
        if (meta.overlay_size) setOverlaySize(meta.overlay_size);
        // New video settings
        if (meta.video_loop !== undefined) setVideoLoop(meta.video_loop);
        if (meta.video_playback_speed !== undefined) setVideoPlaybackSpeed(meta.video_playback_speed);
        if (meta.video_overlay_opacity !== undefined) setVideoOverlayOpacity(meta.video_overlay_opacity);
        if (meta.video_poster_image) setVideoPosterImage(meta.video_poster_image);
      }
      
      return data as HeroSection | null;
    },
  });

  const [formData, setFormData] = useState<Partial<HeroSection & { 
    logo_url?: string | null; 
    show_logo?: boolean;
    overlay_image_url?: string | null;
  }>>({});

  // Extract metadata values
  const metadata = heroSection?.metadata as HeroMetadata | null;

  // Initialize form data when hero section loads
  const currentData = {
    title: formData.title ?? heroSection?.title ?? "",
    subtitle: formData.subtitle ?? heroSection?.subtitle ?? "",
    image_url: formData.image_url ?? heroSection?.image_url ?? "",
    video_url: formData.video_url ?? heroSection?.video_url ?? "",
    logo_url: formData.logo_url ?? metadata?.logo_url ?? DEFAULT_LOGO_IMAGE,
    show_logo: formData.show_logo ?? metadata?.show_logo ?? true,
    overlay_image_url: formData.overlay_image_url ?? metadata?.overlay_image_url ?? "",
    cta_primary_text: formData.cta_primary_text ?? heroSection?.cta_primary_text ?? "",
    cta_primary_url: formData.cta_primary_url ?? heroSection?.cta_primary_url ?? "",
    cta_secondary_text: formData.cta_secondary_text ?? heroSection?.cta_secondary_text ?? "",
    cta_secondary_url: formData.cta_secondary_url ?? heroSection?.cta_secondary_url ?? "",
  };

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (heroSection?.id) {
        const { error } = await supabase
          .from("homepage_sections")
          .update(data)
          .eq("id", heroSection.id);
        if (error) throw error;
      } else {
        const insertData = { ...data, key: "hero" };
        const { error } = await supabase
          .from("homepage_sections")
          .insert([insertData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-hero"] });
      toast.success("הבאנר הראשי עודכן בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הבאנר");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("התמונה הועלתה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי. מקסימום 50MB");
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-video-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, video_url: publicUrl }));
      toast.success("הוידאו הועלה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהעלאת הוידאו");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: publicUrl, show_logo: true }));
      toast.success("הלוגו הועלה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהעלאת הלוגו");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleOverlayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOverlay(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-overlay-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, overlay_image_url: publicUrl }));
      toast.success("תמונת ה-Overlay הועלתה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploadingOverlay(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPoster(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-poster-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      setVideoPosterImage(publicUrl);
      toast.success("תמונת הפוסטר הועלתה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      title: currentData.title,
      subtitle: currentData.subtitle,
      image_url: currentData.image_url || null,
      video_url: currentData.video_url || null,
      metadata: { 
        video_size: videoSize,
        video_position: videoPosition,
        video_format: videoFormat,
        video_custom_width: videoCustomWidth,
        video_custom_height: videoCustomHeight,
        overlay_image_url: currentData.overlay_image_url || null,
        overlay_position: overlayPosition,
        overlay_size: overlaySize,
        logo_url: currentData.logo_url || null,
        show_logo: currentData.show_logo,
        // New video settings
        video_loop: videoLoop,
        video_playback_speed: videoPlaybackSpeed,
        video_overlay_opacity: videoOverlayOpacity,
        video_poster_image: videoPosterImage || null,
      },
      cta_primary_text: currentData.cta_primary_text,
      cta_primary_url: currentData.cta_primary_url,
      cta_secondary_text: currentData.cta_secondary_text,
      cta_secondary_url: currentData.cta_secondary_url,
    });
  };

  // Reset/Delete handlers for Layer 1 (Background)
  const handleResetBackground = () => {
    setFormData(prev => ({ ...prev, image_url: DEFAULT_BACKGROUND_IMAGE }));
    toast.info("תמונת הרקע אופסה לברירת מחדל - לחץ 'שמור שינויים' לשמירה");
  };

  const handleDeleteBackground = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
    toast.info("תמונת הרקע הוסרה - לחץ 'שמור שינויים' לשמירה");
  };

  // Reset/Delete handlers for Layer 1.5 (Overlay)
  const handleResetOverlay = () => {
    setFormData(prev => ({ ...prev, overlay_image_url: "" }));
    setOverlayPosition('center');
    setOverlaySize(30);
    toast.info("תמונת ה-Overlay אופסה - לחץ 'שמור שינויים' לשמירה");
  };

  // Reset/Delete handlers for Layer 2 (Video)
  const handleResetVideo = () => {
    setFormData(prev => ({ ...prev, video_url: "" }));
    setVideoSize(DEFAULT_VIDEO_SIZE);
    setVideoPosition('center');
    setVideoFormat('1:1');
    setVideoCustomWidth(50);
    setVideoCustomHeight(50);
    // Reset new video settings
    setVideoLoop(true);
    setVideoPlaybackSpeed(1);
    setVideoOverlayOpacity(0);
    setVideoPosterImage("");
    toast.info("הוידאו אופס - לחץ 'שמור שינויים' לשמירה");
  };

  // Reset/Delete handlers for Layer 3 (Logo)
  const handleResetLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: DEFAULT_LOGO_IMAGE, show_logo: true }));
    toast.info("הלוגו אופס לברירת מחדל - לחץ 'שמור שינויים' לשמירה");
  };

  const handleDeleteLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: null, show_logo: false }));
    toast.info("הלוגו הוסר - לחץ 'שמור שינויים' לשמירה");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Layer 1: Background Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            שכבה 1: תמונת רקע
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentData.image_url && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <img
                src={currentData.image_url}
                alt="Hero background"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!currentData.image_url && (
            <div className="w-full h-48 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
              <span className="text-muted-foreground">אין תמונת רקע</span>
            </div>
          )}
          <div>
            <Label htmlFor="hero-image">העלאת תמונה חדשה</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="hero-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetBackground}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              איפוס לברירת מחדל
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteBackground}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              הסר תמונה
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Layer 1.5: Overlay Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            שכבה 1.5: תמונת Overlay (מעל הרקע)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentData.overlay_image_url && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border">
              <img
                src={currentData.overlay_image_url}
                alt="Overlay"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          {!currentData.overlay_image_url && (
            <div className="w-full h-48 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
              <span className="text-muted-foreground">אין תמונת Overlay</span>
            </div>
          )}
          <div>
            <Label htmlFor="overlay-image">העלאת תמונה</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="overlay-image"
                type="file"
                accept="image/*"
                onChange={handleOverlayUpload}
                disabled={uploadingOverlay}
              />
              {uploadingOverlay && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
          </div>
          <div>
            <Label htmlFor="overlay-url" className="flex items-center gap-1">
              <Link className="h-4 w-4" />
              או הזנת קישור לתמונה
            </Label>
            <Input
              id="overlay-url"
              value={currentData.overlay_image_url || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, overlay_image_url: e.target.value }))}
              placeholder="https://example.com/image.png"
              className="mt-1"
            />
          </div>
          
          {currentData.overlay_image_url && (
            <>
              <div className="pt-4 border-t">
                <Label className="mb-3 block">מיקום התמונה</Label>
                <PositionPicker value={overlayPosition} onChange={setOverlayPosition} />
              </div>
              
              <div>
                <Label className="flex items-center justify-between mb-3">
                  <span>גודל התמונה (% מרוחב המסך)</span>
                  <span className="text-muted-foreground font-mono">{overlaySize}%</span>
                </Label>
                <Slider
                  value={[overlaySize]}
                  onValueChange={(value) => setOverlaySize(value[0])}
                  min={10}
                  max={80}
                  step={5}
                  className="w-full"
                />
              </div>
            </>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOverlay}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              איפוס (הסר תמונה)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Layer 2: Video */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            שכבה 2: וידאו/מדיה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentData.video_url && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted border">
              <video
                src={currentData.video_url}
                className="w-full h-full object-cover"
                controls
                muted
              />
            </div>
          )}
          {!currentData.video_url && (
            <div className="w-full h-48 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
              <span className="text-muted-foreground">אין וידאו</span>
            </div>
          )}
          <div>
            <Label htmlFor="hero-video">העלאת קובץ וידאו (MP4, WebM - עד 50MB)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="hero-video"
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleVideoUpload}
                disabled={uploadingVideo}
              />
              {uploadingVideo && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
          </div>
          <div>
            <Label htmlFor="video-url" className="flex items-center gap-1">
              <Link className="h-4 w-4" />
              או הזנת קישור לוידאו
            </Label>
            <Input
              id="video-url"
              value={currentData.video_url}
              onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
              placeholder="https://example.com/video.mp4"
              className="mt-1"
            />
          </div>
          
          {currentData.video_url && (
            <>
              <div className="pt-4 border-t space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">מיקום הוידאו</Label>
                    <PositionPicker value={videoPosition} onChange={setVideoPosition} />
                  </div>
                  <div>
                    <Label className="mb-2 block">פורמט גודל</Label>
                    <Select value={videoFormat} onValueChange={(v) => setVideoFormat(v as VideoFormat)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">ריבוע (1:1)</SelectItem>
                        <SelectItem value="16:9">לרוחב (16:9)</SelectItem>
                        <SelectItem value="9:16">לאורך (9:16)</SelectItem>
                        <SelectItem value="custom">מותאם אישית</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label className="flex items-center justify-between mb-3">
                    <span>גודל הוידאו (% מגובה המסך)</span>
                    <span className="text-muted-foreground font-mono">{videoSize}%</span>
                  </Label>
                  <Slider
                    value={[videoSize]}
                    onValueChange={(value) => setVideoSize(value[0])}
                    min={20}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                </div>
                
                {videoFormat === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="flex items-center justify-between mb-3">
                        <span>רוחב (%)</span>
                        <span className="text-muted-foreground font-mono">{videoCustomWidth}%</span>
                      </Label>
                      <Slider
                        value={[videoCustomWidth]}
                        onValueChange={(value) => setVideoCustomWidth(value[0])}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center justify-between mb-3">
                        <span>גובה (%)</span>
                        <span className="text-muted-foreground font-mono">{videoCustomHeight}%</span>
                      </Label>
                      <Slider
                        value={[videoCustomHeight]}
                        onValueChange={(value) => setVideoCustomHeight(value[0])}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
                
                {/* New Video Settings */}
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-medium text-sm">הגדרות וידאו מתקדמות</h4>
                  
                  {/* Loop Toggle */}
                  <div className="flex items-center justify-between">
                    <Label>ניגון בלולאה (Loop)</Label>
                    <button
                      type="button"
                      onClick={() => setVideoLoop(!videoLoop)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        videoLoop ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          videoLoop ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Playback Speed */}
                  <div>
                    <Label className="flex items-center justify-between mb-3">
                      <span>מהירות ניגון</span>
                      <span className="text-muted-foreground font-mono">{videoPlaybackSpeed}x</span>
                    </Label>
                    <Slider
                      value={[videoPlaybackSpeed]}
                      onValueChange={(value) => setVideoPlaybackSpeed(value[0])}
                      min={0.25}
                      max={2}
                      step={0.25}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Overlay Opacity */}
                  <div>
                    <Label className="flex items-center justify-between mb-3">
                      <span>שכבת כהות (Overlay)</span>
                      <span className="text-muted-foreground font-mono">{Math.round(videoOverlayOpacity * 100)}%</span>
                    </Label>
                    <Slider
                      value={[videoOverlayOpacity]}
                      onValueChange={(value) => setVideoOverlayOpacity(value[0])}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Poster Image */}
                  <div className="space-y-2">
                    <Label>תמונת פוסטר (מופיעה עד טעינת הוידאו)</Label>
                    {videoPosterImage && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                        <img
                          src={videoPosterImage}
                          alt="Video poster"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterUpload}
                        disabled={uploadingPoster}
                      />
                      {uploadingPoster && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                    <Input
                      value={videoPosterImage}
                      onChange={(e) => setVideoPosterImage(e.target.value)}
                      placeholder="או הזנת קישור לתמונה"
                    />
                    {videoPosterImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVideoPosterImage("")}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        הסר פוסטר
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetVideo}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              איפוס (הסר וידאו ואפס הגדרות)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Layer 3: Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            שכבה 3: לוגו (שכבה עליונה)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentData.show_logo && currentData.logo_url && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border">
              <img
                src={currentData.logo_url}
                alt="Hero logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          {(!currentData.show_logo || !currentData.logo_url) && (
            <div className="w-full h-48 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
              <span className="text-muted-foreground">הלוגו מוסתר</span>
            </div>
          )}
          <div>
            <Label htmlFor="hero-logo">העלאת לוגו חדש (PNG שקוף מומלץ)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="hero-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              {uploadingLogo && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
          </div>
          <div>
            <Label htmlFor="logo-url" className="flex items-center gap-1">
              <Link className="h-4 w-4" />
              או הזנת קישור ללוגו
            </Label>
            <Input
              id="logo-url"
              value={currentData.logo_url || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value, show_logo: !!e.target.value }))}
              placeholder="https://example.com/logo.png"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetLogo}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              איפוס לברירת מחדל
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteLogo}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              הסתר לוגו
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Texts */}
      <Card>
        <CardHeader>
          <CardTitle>טקסטים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">כותרת ראשית</Label>
            <Input
              id="title"
              value={currentData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="תכשיטים שמספרים את הסיפור שלך"
            />
          </div>
          <div>
            <Label htmlFor="subtitle">תת-כותרת</Label>
            <Input
              id="subtitle"
              value={currentData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="עיצוב אישי | יהלומים טבעיים | אומנות ישראלית"
            />
          </div>
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>כפתורי פעולה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cta1-text">טקסט כפתור ראשי</Label>
              <Input
                id="cta1-text"
                value={currentData.cta_primary_text}
                onChange={(e) => setFormData(prev => ({ ...prev, cta_primary_text: e.target.value }))}
                placeholder="לתיאום פגישת עיצוב"
              />
            </div>
            <div>
              <Label htmlFor="cta1-url">קישור כפתור ראשי</Label>
              <Input
                id="cta1-url"
                value={currentData.cta_primary_url}
                onChange={(e) => setFormData(prev => ({ ...prev, cta_primary_url: e.target.value }))}
                placeholder="/contact"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cta2-text">טקסט כפתור משני</Label>
              <Input
                id="cta2-text"
                value={currentData.cta_secondary_text}
                onChange={(e) => setFormData(prev => ({ ...prev, cta_secondary_text: e.target.value }))}
                placeholder="לצפייה בקולקציה"
              />
            </div>
            <div>
              <Label htmlFor="cta2-url">קישור כפתור משני</Label>
              <Input
                id="cta2-url"
                value={currentData.cta_secondary_url}
                onChange={(e) => setFormData(prev => ({ ...prev, cta_secondary_url: e.target.value }))}
                placeholder="/catalog"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          שמור שינויים
        </Button>
      </div>
    </div>
  );
};

export default HeroManager;
