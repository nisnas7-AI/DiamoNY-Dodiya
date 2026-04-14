import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X, Upload, Image as ImageIcon, Video, Link as LinkIcon, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { METAL_CONFIGS, type MetalType } from "@/components/catalog/MetalSelector";

interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: string;
  variant_value: string;
  sku: string | null;
  is_available: boolean;
  price_modifier: number;
  display_order: number;
  video_url: string | null;
}

interface VariantImage {
  id: string;
  variant_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  media_type?: string;
}

interface ProductVariantManagerProps {
  productId: string | null;
  productSku?: string;
  onVariantChange?: () => void;
}

// Predefined variant types
const VARIANT_TYPES = [
  { value: 'gold_type', label: 'סוג זהב', labelEn: 'Metal Type' },
  { value: 'size', label: 'מידה', labelEn: 'Size' },
  { value: 'stone', label: 'סוג אבן', labelEn: 'Stone Type' },
  { value: 'finish', label: 'גימור', labelEn: 'Finish' },
  { value: 'custom', label: 'מותאם אישית', labelEn: 'Custom' },
];

// Predefined values for gold_type
const GOLD_TYPE_VALUES = [
  { value: 'yellow', label: 'זהב צהוב', labelEn: 'Yellow Gold' },
  { value: 'white', label: 'זהב לבן', labelEn: 'White Gold' },
  { value: 'rose', label: 'זהב אדום', labelEn: 'Rose Gold' },
];

const METAL_TYPES: MetalType[] = ['yellow', 'white', 'rose'];

const ProductVariantManager = ({ 
  productId, 
  productSku,
  onVariantChange 
}: ProductVariantManagerProps) => {
  const queryClient = useQueryClient();
  const [activeVariantType, setActiveVariantType] = useState<string>('gold_type');
  const [customVariantValue, setCustomVariantValue] = useState<string>('');
  const [localVariants, setLocalVariants] = useState<Record<MetalType, {
    enabled: boolean;
    sku: string;
    isAvailable: boolean;
    videoUrl: string;
  }>>({
    yellow: { enabled: false, sku: '', isAvailable: true, videoUrl: '' },
    white: { enabled: false, sku: '', isAvailable: true, videoUrl: '' },
    rose: { enabled: false, sku: '', isAvailable: true, videoUrl: '' },
  });
  const [videoUrlInput, setVideoUrlInput] = useState<Record<MetalType, string>>({
    yellow: '',
    white: '',
    rose: '',
  });

  // Fetch existing variants
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["admin-product-variants", productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      
      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!productId,
  });

  // Fetch variant images
  const { data: variantImages = [] } = useQuery({
    queryKey: ["admin-variant-images", productId],
    queryFn: async () => {
      if (!productId || variants.length === 0) return [];
      
      const variantIds = variants.map(v => v.id);
      
      const { data, error } = await supabase
        .from("product_variant_images")
        .select("*")
        .in("variant_id", variantIds)
        .order("display_order");
      
      if (error) throw error;
      return data as VariantImage[];
    },
    enabled: !!productId && variants.length > 0,
  });

  // Sync local state with fetched data
  useEffect(() => {
    if (variants.length > 0) {
      const newLocalVariants = { ...localVariants };
      variants.forEach(v => {
        if (v.variant_type === 'gold_type') {
          const metal = v.variant_value as MetalType;
          if (METAL_TYPES.includes(metal)) {
            newLocalVariants[metal] = {
              enabled: true,
              sku: v.sku || '',
              isAvailable: v.is_available,
              videoUrl: v.video_url || '',
            };
          }
        }
      });
      setLocalVariants(newLocalVariants);
    }
  }, [variants]);

  // Auto-generate SKU based on product SKU
  const generateVariantSku = (metal: MetalType): string => {
    if (!productSku) return '';
    const suffixes: Record<MetalType, string> = {
      yellow: '-YG',
      white: '-WG',
      rose: '-RG',
    };
    return `${productSku}${suffixes[metal]}`;
  };

  // Save variant mutation
  const saveVariant = useMutation({
    mutationFn: async ({ 
      metal, 
      enabled, 
      sku, 
      isAvailable,
      videoUrl,
      variantType = 'gold_type',
    }: { 
      metal: MetalType; 
      enabled: boolean; 
      sku: string; 
      isAvailable: boolean;
      videoUrl?: string;
      variantType?: string;
    }) => {
      if (!productId) throw new Error("Product ID required");
      
      const existingVariant = variants.find(v => v.variant_value === metal && v.variant_type === variantType);
      
      if (enabled) {
        if (existingVariant) {
          // Update existing
          const { error } = await supabase
            .from("product_variants")
            .update({
              sku: sku || null,
              is_available: isAvailable,
              video_url: videoUrl !== undefined ? (videoUrl || null) : existingVariant.video_url,
            })
            .eq("id", existingVariant.id);
          if (error) throw error;
        } else {
          // Create new
          const { error } = await supabase
            .from("product_variants")
            .insert({
              product_id: productId,
              variant_type: variantType,
              variant_value: metal,
              sku: sku || null,
              is_available: isAvailable,
              display_order: METAL_TYPES.indexOf(metal),
              video_url: videoUrl || null,
            });
          if (error) throw error;
        }
      } else {
        // Delete if disabled
        if (existingVariant) {
          const { error } = await supabase
            .from("product_variants")
            .delete()
            .eq("id", existingVariant.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      onVariantChange?.();
    },
  });

  // Upload video for variant
  const uploadVariantVideo = async (metal: MetalType, file: File) => {
    const existingVariant = variants.find(v => v.variant_value === metal && v.variant_type === 'gold_type');
    if (!existingVariant) {
      toast.error("שמור את הוריאנט קודם");
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/variants/${existingVariant.id}/video_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("catalog-media")
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from("catalog-media")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ video_url: urlData.publicUrl })
      .eq("id", existingVariant.id);
    
    if (updateError) throw updateError;
    
    setLocalVariants(prev => ({
      ...prev,
      [metal]: { ...prev[metal], videoUrl: urlData.publicUrl },
    }));
    
    queryClient.invalidateQueries({ queryKey: ["admin-product-variants", productId] });
    toast.success("וידאו הועלה בהצלחה");
  };

  // Save video URL for variant
  const saveVariantVideoUrl = async (metal: MetalType, url: string) => {
    const existingVariant = variants.find(v => v.variant_value === metal && v.variant_type === 'gold_type');
    if (!existingVariant) {
      toast.error("שמור את הוריאנט קודם");
      return;
    }

    const { error } = await supabase
      .from("product_variants")
      .update({ video_url: url || null })
      .eq("id", existingVariant.id);
    
    if (error) throw error;
    
    setLocalVariants(prev => ({
      ...prev,
      [metal]: { ...prev[metal], videoUrl: url },
    }));
    
    queryClient.invalidateQueries({ queryKey: ["admin-product-variants", productId] });
    toast.success("קישור וידאו נשמר");
  };

  // Remove video from variant
  const removeVariantVideo = async (metal: MetalType) => {
    const existingVariant = variants.find(v => v.variant_value === metal && v.variant_type === 'gold_type');
    if (!existingVariant) return;

    const { error } = await supabase
      .from("product_variants")
      .update({ video_url: null })
      .eq("id", existingVariant.id);
    
    if (error) throw error;
    
    setLocalVariants(prev => ({
      ...prev,
      [metal]: { ...prev[metal], videoUrl: '' },
    }));
    
    queryClient.invalidateQueries({ queryKey: ["admin-product-variants", productId] });
    toast.success("וידאו הוסר");
  };

  // Upload image/video for variant with media_type support
  const uploadVariantMedia = async (variantId: string, file: File, mediaType: 'image' | 'video' = 'image') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${variantId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("catalog-media")
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from("catalog-media")
      .getPublicUrl(fileName);
    
    const existingCount = variantImages.filter(vi => vi.variant_id === variantId).length;
    
    const { error: insertError } = await supabase
      .from("product_variant_images")
      .insert({
        variant_id: variantId,
        image_url: urlData.publicUrl,
        display_order: existingCount,
        media_type: mediaType,
      });
    
    if (insertError) throw insertError;
    
    queryClient.invalidateQueries({ queryKey: ["admin-variant-images", productId] });
    toast.success(mediaType === 'video' ? "וידאו הועלה בהצלחה" : "תמונה הועלתה בהצלחה");
  };

  // Delete variant image
  const deleteVariantImage = async (imageId: string) => {
    const { error } = await supabase
      .from("product_variant_images")
      .delete()
      .eq("id", imageId);
    
    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ["admin-variant-images", productId] });
    toast.success("מדיה נמחקה");
  };

  const handleToggleVariant = (metal: MetalType, enabled: boolean) => {
    const newState = {
      ...localVariants[metal],
      enabled,
      sku: enabled && !localVariants[metal].sku ? generateVariantSku(metal) : localVariants[metal].sku,
    };
    setLocalVariants(prev => ({ ...prev, [metal]: newState }));
    
    // Auto-save when toggling
    if (productId) {
      saveVariant.mutate({
        metal,
        enabled: newState.enabled,
        sku: newState.sku,
        isAvailable: newState.isAvailable,
        variantType: activeVariantType,
      });
    }
  };

  const handleSkuChange = (metal: MetalType, sku: string) => {
    setLocalVariants(prev => ({
      ...prev,
      [metal]: { ...prev[metal], sku },
    }));
  };

  const handleSaveVariant = (metal: MetalType) => {
    if (!productId) return;
    
    saveVariant.mutate({
      metal,
      enabled: localVariants[metal].enabled,
      sku: localVariants[metal].sku,
      isAvailable: localVariants[metal].isAvailable,
      variantType: activeVariantType,
    });
    toast.success(`וריאנט ${METAL_CONFIGS[metal].label} נשמר`);
  };

  // Get embed URL for video
  const getVideoEmbed = (url: string): string | null => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Direct video URL
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url;
    }
    
    return url;
  };

  // Get media type badge color
  const getMediaTypeBadge = (mediaType?: string) => {
    if (mediaType === 'video') {
      return <Badge variant="secondary" className="absolute top-0 left-0 text-[8px] px-1 py-0"><Video className="h-2 w-2" /></Badge>;
    }
    return null;
  };

  if (!productId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            ניהול וריאנטים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            שמור את המוצר קודם כדי להוסיף וריאנטים
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="flex gap-1">
              {METAL_TYPES.map(metal => (
                <div
                  key={metal}
                  className={cn(
                    "w-4 h-4 rounded-full border transition-opacity",
                    localVariants[metal].enabled ? "opacity-100" : "opacity-30"
                  )}
                  style={{ background: METAL_CONFIGS[metal].gradient }}
                />
              ))}
            </div>
            ניהול וריאנטים
          </CardTitle>
          
          {/* Variant Type Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">סוג:</Label>
            <Select value={activeVariantType} onValueChange={setActiveVariantType}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VARIANT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-xs">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show current variant type info */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">סוג וריאנט פעיל: </span>
              <Badge variant="outline">
                {VARIANT_TYPES.find(t => t.value === activeVariantType)?.label || activeVariantType}
              </Badge>
            </div>

            {METAL_TYPES.map(metal => {
              const config = METAL_CONFIGS[metal];
              const localState = localVariants[metal];
              const existingVariant = variants.find(v => v.variant_value === metal && v.variant_type === activeVariantType);
              const images = variantImages.filter(vi => vi.variant_id === existingVariant?.id);
              
              return (
                <div 
                  key={metal}
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    localState.enabled 
                      ? "bg-background border-border" 
                      : "bg-muted/30 border-dashed"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 shadow-sm"
                        style={{ 
                          background: config.gradient,
                          borderColor: localState.enabled ? 'hsl(var(--primary))' : 'transparent',
                        }}
                      />
                      <div>
                        <p className="font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.labelEn}</p>
                      </div>
                    </div>
                    <Switch
                      checked={localState.enabled}
                      onCheckedChange={(checked) => handleToggleVariant(metal, checked)}
                    />
                  </div>
                  
                  {localState.enabled && (
                    <div className="space-y-4 animate-fade-in">
                      {/* SKU Field */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">מק״ט לוריאנט</Label>
                          <div className="flex gap-2">
                            <Input
                              value={localState.sku}
                              onChange={(e) => handleSkuChange(metal, e.target.value)}
                              placeholder={generateVariantSku(metal)}
                              className="text-sm"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveVariant(metal)}
                              disabled={saveVariant.isPending}
                            >
                              {saveVariant.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "שמור"
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">זמינות</Label>
                          <div className="flex items-center gap-2 h-9">
                            <Switch
                              checked={localState.isAvailable}
                              onCheckedChange={(checked) => {
                                setLocalVariants(prev => ({
                                  ...prev,
                                  [metal]: { ...prev[metal], isAvailable: checked },
                                }));
                              }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {localState.isAvailable ? "זמין" : "להזמנה בלבד"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Images Section with media_type support */}
                      {existingVariant && (
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-2">
                            <ImageIcon className="h-3 w-3" />
                            תמונות ווידאו לוריאנט זה
                          </Label>
                          <div className="flex gap-2 flex-wrap">
                            {images.map(img => (
                              <div key={img.id} className="relative group">
                                {img.media_type === 'video' ? (
                                  <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                                    <Video className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                ) : (
                                  <img
                                    src={img.image_url}
                                    alt={img.alt_text || config.label}
                                    className="w-16 h-16 object-cover rounded border"
                                  />
                                )}
                                {getMediaTypeBadge(img.media_type)}
                                <button
                                  onClick={() => deleteVariantImage(img.id)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            
                            {/* Upload Image button */}
                            <label className="w-16 h-16 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors" title="העלה תמונה">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file && existingVariant) {
                                    uploadVariantMedia(existingVariant.id, file, 'image');
                                  }
                                }}
                              />
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              <Plus className="h-3 w-3 text-muted-foreground" />
                            </label>

                            {/* Upload Video button */}
                            <label className="w-16 h-16 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20" title="העלה וידאו">
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file && existingVariant) {
                                    if (file.size > 100 * 1024 * 1024) {
                                      toast.error("גודל הקובץ מקסימלי הוא 100MB");
                                      return;
                                    }
                                    uploadVariantMedia(existingVariant.id, file, 'video');
                                  }
                                }}
                              />
                              <Video className="h-4 w-4 text-muted-foreground" />
                              <Plus className="h-3 w-3 text-muted-foreground" />
                            </label>
                          </div>
                          
                          {/* Rose gold notice */}
                          {metal === 'rose' && images.filter(i => i.media_type !== 'video').length === 0 && (
                            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
                              ללא תמונה - תוצג הודעה "זהב אדום זמין בהזמנה"
                            </p>
                          )}
                        </div>
                      )}

                      {/* External Video URL Section */}
                      {existingVariant && (
                        <div className="space-y-2 border-t pt-4 mt-4">
                          <Label className="text-xs flex items-center gap-2">
                            <LinkIcon className="h-3 w-3" />
                            קישור וידאו חיצוני (YouTube / Vimeo)
                          </Label>
                          
                          {localState.videoUrl ? (
                            <div className="space-y-2">
                              <div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden border bg-black">
                                {getVideoEmbed(localState.videoUrl)?.match(/\.(mp4|webm|ogg)$/i) ? (
                                  <video 
                                    src={localState.videoUrl} 
                                    className="w-full h-full object-contain"
                                    controls
                                  />
                                ) : (
                                  <iframe
                                    src={getVideoEmbed(localState.videoUrl) || undefined}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeVariantVideo(metal)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3 ml-1" />
                                הסר וידאו
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                value={videoUrlInput[metal]}
                                onChange={(e) => setVideoUrlInput(prev => ({ ...prev, [metal]: e.target.value }))}
                                placeholder="https://youtube.com/watch?v=..."
                                className="text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (videoUrlInput[metal]) {
                                    saveVariantVideoUrl(metal, videoUrlInput[metal]);
                                    setVideoUrlInput(prev => ({ ...prev, [metal]: '' }));
                                  }
                                }}
                                disabled={!videoUrlInput[metal]}
                              >
                                שמור
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductVariantManager;
