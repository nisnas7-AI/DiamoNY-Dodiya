import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Upload, Video, Trash2, Sparkles, Loader2, Copy, Check, Link, Globe, Crop, 
  AlertCircle, FolderOpen, Search, Grid3X3, List, Play, ExternalLink, 
  ChevronDown, X, Download, FolderPlus, Layers
} from "lucide-react";
import { toast } from "sonner";
import { processImageForCatalog, CATALOG_IMAGE_CONFIG } from "@/lib/imageProcessor";

type ViewMode = 'grid' | 'list' | 'category';

interface MediaItem {
  id: string;
  filename: string;
  original_filename: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  alt_text: string | null;
  ai_description: string | null;
  ai_tags: string[] | null;
  category_id: string | null;
  product_id: string | null;
  display_name: string | null;
  created_at: string;
  categories: { id: string; name: string } | null;
  products?: { id: string; name: string; sku: string | null } | null;
}

const MediaManager = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [standardizeImages, setStandardizeImages] = useState(true);
  
  // View & Filter state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*, categories(id, name), products:product_id(id, name, sku)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MediaItem[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories-for-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Filtered media based on search and filters
  const filteredMedia = useMemo(() => {
    if (!mediaItems) return [];
    
    return mediaItems.filter(item => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        item.display_name?.toLowerCase().includes(searchLower) ||
        item.products?.sku?.toLowerCase().includes(searchLower) ||
        item.products?.name?.toLowerCase().includes(searchLower) ||
        item.original_filename?.toLowerCase().includes(searchLower) ||
        item.categories?.name?.toLowerCase().includes(searchLower);
      
      // Category filter
      const categoryMatch = categoryFilter === "all" || item.category_id === categoryFilter;
      
      // Unassigned filter
      const unassignedMatch = !showUnassignedOnly || !item.product_id;
      
      return searchMatch && categoryMatch && unassignedMatch;
    });
  }, [mediaItems, searchQuery, categoryFilter, showUnassignedOnly]);

  // Group media by category for category view
  const groupedMedia = useMemo(() => {
    if (viewMode !== 'category') return {};
    
    const groups: Record<string, MediaItem[]> = { "unassigned": [] };
    categories?.forEach(cat => { groups[cat.id] = []; });
    
    filteredMedia.forEach(item => {
      const key = item.category_id || "unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    
    return groups;
  }, [filteredMedia, categories, viewMode]);

  const uploadMedia = useMutation({
    mutationFn: async ({ file, shouldStandardize }: { file: File; shouldStandardize: boolean }) => {
      let uploadFile: File | Blob = file;
      let fileName: string;
      let fileType = file.type;
      let fileSize = file.size;

      if (shouldStandardize && file.type.startsWith("image/") && !file.type.includes("gif")) {
        try {
          const result = await processImageForCatalog(file);
          uploadFile = result.blob;
          fileType = result.format === 'webp' ? 'image/webp' : 'image/jpeg';
          fileSize = result.blob.size;
          const baseName = file.name.split(".")[0];
          fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${baseName}.${result.format}`;
        } catch (error) {
          console.error("Error processing image:", error);
          const fileExt = file.name.split(".").pop();
          fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        }
      } else {
        const fileExt = file.name.split(".").pop();
        fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      }

      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("media").insert({
        filename: fileName,
        original_filename: file.name,
        file_url: publicUrl,
        file_type: fileType,
        file_size: fileSize,
      });

      if (insertError) throw insertError;
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("הקובץ הועלה בהצלחה");
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה בהעלאת הקובץ");
    },
  });

  const uploadFromUrl = async () => {
    if (!urlInput.trim()) {
      toast.error("נא להזין כתובת URL");
      return;
    }

    setUrlLoading(true);
    try {
      const response = await fetch(urlInput);
      if (!response.ok) throw new Error("לא ניתן להוריד את הקובץ");
      
      const blob = await response.blob();
      const urlParts = urlInput.split("/");
      const originalFilename = urlParts[urlParts.length - 1].split("?")[0] || "uploaded-file";
      
      let fileExt = originalFilename.split(".").pop();
      const contentType = response.headers.get("content-type") || "";
      
      if (!fileExt || fileExt.length > 5) {
        if (contentType?.includes("image/jpeg")) fileExt = "jpg";
        else if (contentType?.includes("image/png")) fileExt = "png";
        else if (contentType?.includes("image/webp")) fileExt = "webp";
        else if (contentType?.includes("image/gif")) fileExt = "gif";
        else if (contentType?.includes("video/mp4")) fileExt = "mp4";
        else if (contentType?.includes("video/webm")) fileExt = "webm";
        else fileExt = "jpg";
      }

      const isImage = contentType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(fileExt.toLowerCase());
      const isGif = contentType.includes("gif") || fileExt.toLowerCase() === "gif";

      let uploadBlob: Blob = blob;
      let uploadFileType = blob.type || `image/${fileExt}`;
      let finalFileExt = fileExt;

      if (standardizeImages && isImage && !isGif) {
        try {
          const result = await processImageForCatalog(urlInput);
          uploadBlob = result.blob;
          uploadFileType = result.format === 'webp' ? 'image/webp' : 'image/jpeg';
          finalFileExt = result.format;
        } catch (error) {
          console.error("Error processing image from URL:", error);
        }
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${finalFileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(filePath, uploadBlob, {
          contentType: uploadFileType,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("media").insert({
        filename: fileName,
        original_filename: originalFilename,
        file_url: publicUrl,
        file_type: uploadFileType,
        file_size: uploadBlob.size,
      });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("הקובץ הועלה בהצלחה מהאינטרנט");
      setUrlInput("");
    } catch (error: any) {
      console.error("URL upload error:", error);
      toast.error(error.message || "שגיאה בהעלאה מכתובת URL");
    } finally {
      setUrlLoading(false);
    }
  };

  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("הקובץ נמחק");
    },
    onError: () => {
      toast.error("שגיאה במחיקת הקובץ");
    },
  });

  const bulkDeleteMedia = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("media").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      setSelectedItems(new Set());
      setSelectionMode(false);
      toast.success("הקבצים נמחקו בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה במחיקת הקבצים");
    },
  });

  const bulkUpdateCategory = useMutation({
    mutationFn: async ({ ids, categoryId }: { ids: string[]; categoryId: string | null }) => {
      const { error } = await supabase
        .from("media")
        .update({ category_id: categoryId })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      setSelectedItems(new Set());
      toast.success("הקטגוריה עודכנה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הקטגוריה");
    },
  });

  const updateMediaCategory = useMutation({
    mutationFn: async ({ mediaId, categoryId }: { mediaId: string; categoryId: string | null }) => {
      const { error } = await supabase
        .from("media")
        .update({ category_id: categoryId })
        .eq("id", mediaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("הקטגוריה עודכנה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הקטגוריה");
    },
  });

  const generateAISEO = async (mediaId: string, fileUrl: string) => {
    setGeneratingAI(mediaId);
    try {
      const { data, error } = await supabase.functions.invoke("ai-media-seo", {
        body: { imageUrl: fileUrl },
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("media")
        .update({
          ai_description: data.description,
          ai_tags: data.tags,
          alt_text: data.alt_text,
        })
        .eq("id", mediaId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("תיאור AI נוצר בהצלחה");
    } catch (error: any) {
      toast.error(error.message || "שגיאה ביצירת תיאור AI");
    } finally {
      setGeneratingAI(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia.mutateAsync({ file, shouldStandardize: standardizeImages });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia.mutateAsync({ file, shouldStandardize: standardizeImages });
      }
    } finally {
      setUploading(false);
    }
  }, [uploadMedia, standardizeImages]);

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("הקישור הועתק");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isVideo = (type: string | null) => type?.startsWith("video/");

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(filteredMedia.map(m => m.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const goToProduct = (productId: string) => {
    navigate(`/admin/catalog?tab=products&product=${productId}`);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryName = (categoryId: string) => {
    if (categoryId === "unassigned") return "ללא קטגוריה";
    return categories?.find(c => c.id === categoryId)?.name || categoryId;
  };

  // Media Card Component
  const MediaCard = ({ item }: { item: MediaItem }) => (
    <div className="group relative bg-card rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-border/50">
      {/* Thumbnail */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        {isVideo(item.file_type) ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="w-14 h-14 bg-background/90 rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-foreground fill-current" />
            </div>
          </div>
        ) : (
          <img
            src={item.file_url}
            alt={item.alt_text || item.original_filename || ""}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        )}
        
        {/* Selection Checkbox */}
        {selectionMode && (
          <div className="absolute top-3 right-3 z-10">
            <Checkbox
              checked={selectedItems.has(item.id)}
              onCheckedChange={() => toggleSelection(item.id)}
              className="h-5 w-5 bg-background/90 border-2"
            />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
          <div className="flex justify-end gap-1.5">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={() => copyUrl(item.file_url, item.id)}
            >
              {copiedId === item.id ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {!isVideo(item.file_type) && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => generateAISEO(item.id, item.file_url)}
                disabled={generatingAI === item.id}
              >
                {generatingAI === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
              </Button>
            )}
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={() => deleteMedia.mutate(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {item.product_id && (
              <Button
                size="sm"
                variant="secondary"
                className="w-full h-7 text-xs"
                onClick={() => goToProduct(item.product_id!)}
              >
                <ExternalLink className="h-3 w-3 ml-1" />
                עבור למוצר
              </Button>
            )}
            {item.ai_description && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 ml-1" />
                AI תיאור
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Minimal Info */}
      <div className="p-3 space-y-2">
        <p className="text-sm font-mono text-muted-foreground truncate">
          {item.display_name || item.products?.sku || item.original_filename}
        </p>
        
        {/* Category Selector */}
        <Select
          value={item.category_id || "none"}
          onValueChange={(value) => 
            updateMediaCategory.mutate({ 
              mediaId: item.id, 
              categoryId: value === "none" ? null : value 
            })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <FolderOpen className="h-3 w-3 ml-1" />
            <SelectValue placeholder="בחר קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">ללא קטגוריה</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // List View Row
  const MediaListRow = ({ item }: { item: MediaItem }) => (
    <TableRow className="group">
      <TableCell className="w-12">
        {selectionMode && (
          <Checkbox
            checked={selectedItems.has(item.id)}
            onCheckedChange={() => toggleSelection(item.id)}
          />
        )}
      </TableCell>
      <TableCell>
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted relative">
          {isVideo(item.file_type) ? (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={item.file_url}
              alt={item.alt_text || ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium truncate max-w-[200px]">
            {item.display_name || item.products?.name || item.original_filename}
          </p>
          {item.products?.sku && (
            <p className="text-xs font-mono text-muted-foreground">{item.products.sku}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {item.categories?.name || "ללא"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatFileSize(item.file_size)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDate(item.created_at)}
      </TableCell>
      <TableCell>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyUrl(item.file_url, item.id)}>
            {copiedId === item.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          {item.product_id && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => goToProduct(item.product_id!)}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMedia.mutate(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            העלאת מדיה
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Image Standardization Toggle */}
          <div className="flex items-center justify-between p-3 mb-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Crop className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="standardize-toggle" className="font-medium cursor-pointer">
                  התאמה אוטומטית לקטלוג
                </Label>
                <p className="text-xs text-muted-foreground">
                  תמונות יותאמו אוטומטית באיכות גבוהה (עד {CATALOG_IMAGE_CONFIG.maxDimension}px)
                </p>
              </div>
            </div>
            <Switch
              id="standardize-toggle"
              checked={standardizeImages}
              onCheckedChange={setStandardizeImages}
            />
          </div>

          {standardizeImages && (
            <div className="flex items-center gap-2 p-2 mb-4 text-sm text-primary bg-primary/10 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>תמונות יעובדו אוטומטית באיכות גבוהה (WebP, עד {CATALOG_IMAGE_CONFIG.maxDimension}px)</span>
            </div>
          )}

          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                מהמחשב
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                מהאינטרנט
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              >
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="media-upload"
                  disabled={uploading}
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-muted-foreground">מעלה קבצים...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="font-medium">גרור קבצים לכאן או לחץ לבחירה</p>
                      <p className="text-sm text-muted-foreground">
                        תמונות (JPG, PNG, WebP, GIF) ווידאו (MP4, WebM)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </TabsContent>

            <TabsContent value="url">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="הדבק כתובת URL של תמונה או וידאו..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1"
                    dir="ltr"
                  />
                  <Button
                    onClick={uploadFromUrl}
                    disabled={urlLoading || !urlInput.trim()}
                  >
                    {urlLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Link className="h-4 w-4 ml-2" />
                    )}
                    העלה
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  הדבק קישור לתמונה או וידאו מהאינטרנט והמערכת תעלה אותו לספריית המדיה שלך
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Media Library */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>ספריית מדיה ({filteredMedia.length})</CardTitle>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectionMode(!selectionMode);
                    if (selectionMode) setSelectedItems(new Set());
                  }}
                >
                  {selectionMode ? "בטל בחירה" : "בחירה מרובה"}
                </Button>
                
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    className="rounded-none h-9 w-9"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    className="rounded-none h-9 w-9"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'category' ? 'default' : 'ghost'}
                    size="icon"
                    className="rounded-none h-9 w-9"
                    onClick={() => setViewMode('category')}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Global Search */}
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש לפי מק״ט, שם מוצר או קטגוריה..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <FolderOpen className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="כל הקטגוריות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקטגוריות</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Unassigned Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="unassigned-filter"
                  checked={showUnassignedOnly}
                  onCheckedChange={setShowUnassignedOnly}
                />
                <Label htmlFor="unassigned-filter" className="text-sm cursor-pointer">
                  קבצים ללא שיוך
                </Label>
              </div>

              {selectionMode && filteredMedia.length > 0 && (
                <Button variant="outline" size="sm" onClick={selectAll}>
                  בחר הכל ({filteredMedia.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !filteredMedia.length ? (
            <p className="text-center text-muted-foreground py-12">
              {searchQuery || categoryFilter !== "all" || showUnassignedOnly
                ? "לא נמצאו קבצים התואמים לחיפוש"
                : "אין קבצים בספרייה"}
            </p>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredMedia.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">תמונה</TableHead>
                  <TableHead>שם / מק״ט</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>גודל</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead className="w-28">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedia.map((item) => (
                  <MediaListRow key={item.id} item={item} />
                ))}
              </TableBody>
            </Table>
          ) : (
            /* Category View */
            <div className="space-y-6">
              {Object.entries(groupedMedia)
                .filter(([_, items]) => items.length > 0)
                .map(([categoryId, items]) => (
                  <Collapsible key={categoryId} defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <ChevronDown className="h-4 w-4 transition-transform [[data-state=closed]_&]:-rotate-90" />
                      <span className="font-medium">{getCategoryName(categoryId)}</span>
                      <Badge variant="secondary">{items.length}</Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-4">
                        {items.map(item => <MediaCard key={item.id} item={item} />)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Bar */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-foreground text-background rounded-full px-6 py-3 shadow-2xl flex items-center gap-4">
            <span className="font-medium">{selectedItems.size} נבחרו</span>
            <div className="h-4 w-px bg-background/30" />
            
            <Select
              onValueChange={(value) => 
                bulkUpdateCategory.mutate({
                  ids: Array.from(selectedItems),
                  categoryId: value === "none" ? null : value
                })
              }
            >
              <SelectTrigger className="w-auto border-0 bg-transparent text-background h-8 gap-1">
                <FolderPlus className="h-4 w-4" />
                <span>שייך</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא קטגוריה</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-background hover:bg-background/20"
              onClick={() => bulkDeleteMedia.mutate(Array.from(selectedItems))}
            >
              <Trash2 className="h-4 w-4 ml-1" />
              מחק
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-background hover:bg-background/20"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManager;
