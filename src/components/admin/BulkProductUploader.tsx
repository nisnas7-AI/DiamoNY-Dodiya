import { useState, useCallback, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock,
  FileImage,
  Film,
  Sparkles,
  Layers,
  Search,
  Plus,
  ArrowRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  compressToWebP, 
  processImageForCatalog,
  detectCategoryFromFilename,
  generateProductNameFromFilename,
  extractProductIdentifier,
  extractSkuFromFilename,
  isVideoFile,
  isImageFile
} from "@/lib/imageProcessor";

interface UploadFile {
  id: string;
  file: File;
  name: string;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  productName: string;
  categoryName: string | null;
  errorMessage?: string;
  fileType: 'image' | 'video';
  groupId: string;
  detectedSku: string | null;
}

interface ProductMatch {
  id: string;
  name: string;
  sku: string | null;
  main_image_url: string | null;
  matchType: 'sku' | 'name';
  confidence: 'exact' | 'partial';
}

interface FileGroup {
  groupId: string;
  productName: string;
  categoryName: string | null;
  files: UploadFile[];
  mainImageId: string | null;
  videoId: string | null;
  uploadTarget: 'new' | 'existing';
  existingProductId?: string;
  existingProductName?: string;
  matchedProduct?: ProductMatch;
  detectedSku: string | null;
}

const BulkProductUploader = () => {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [useWebP, setUseWebP] = useState(true);
  const [standardize, setStandardize] = useState(true);
  const [autoAI, setAutoAI] = useState(false);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [pendingGroupsForDialog, setPendingGroupsForDialog] = useState<FileGroup[]>([]);
  const [groupTargets, setGroupTargets] = useState<Map<string, 'new' | 'existing'>>(new Map());

  // Fetch categories for auto-mapping
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-for-upload"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all products for matching
  const { data: existingProducts = [] } = useQuery({
    queryKey: ["products-for-matching"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, main_image_url")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const findCategoryId = (categoryName: string | null): string | null => {
    if (!categoryName) return null;
    const category = categories.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category?.id || null;
  };

  // Find existing product by SKU or name
  const findExistingProduct = (identifier: string, sku: string | null): ProductMatch | null => {
    // First try exact SKU match
    if (sku) {
      const skuMatch = existingProducts.find(p => 
        p.sku?.toLowerCase() === sku.toLowerCase()
      );
      if (skuMatch) {
        return {
          ...skuMatch,
          matchType: 'sku',
          confidence: 'exact'
        };
      }
    }

    // Try partial name match
    const nameMatches = existingProducts.filter(p => 
      p.name.toLowerCase().includes(identifier.toLowerCase()) ||
      identifier.toLowerCase().includes(p.name.toLowerCase())
    );
    
    if (nameMatches.length === 1) {
      return {
        ...nameMatches[0],
        matchType: 'name',
        confidence: 'exact'
      };
    }
    
    if (nameMatches.length > 1) {
      // Return the first match with partial confidence
      return {
        ...nameMatches[0],
        matchType: 'name',
        confidence: 'partial'
      };
    }

    return null;
  };

  // Group files by product identifier
  const fileGroups = useMemo((): FileGroup[] => {
    const groups = new Map<string, UploadFile[]>();
    
    files.forEach(file => {
      if (!groups.has(file.groupId)) {
        groups.set(file.groupId, []);
      }
      groups.get(file.groupId)!.push(file);
    });

    return Array.from(groups.entries()).map(([groupId, groupFiles]) => {
      const images = groupFiles.filter(f => f.fileType === 'image');
      const videos = groupFiles.filter(f => f.fileType === 'video');
      const firstImage = images[0];
      const detectedSku = groupFiles.find(f => f.detectedSku)?.detectedSku || null;
      
      // Find matching product
      const matchedProduct = findExistingProduct(
        firstImage?.productName || groupFiles[0]?.productName || '', 
        detectedSku
      );
      
      const target = groupTargets.get(groupId) || 'new';
      
      return {
        groupId,
        productName: firstImage?.productName || groupFiles[0]?.productName || 'מוצר חדש',
        categoryName: firstImage?.categoryName || groupFiles[0]?.categoryName || null,
        files: groupFiles,
        mainImageId: images[0]?.id || null,
        videoId: videos[0]?.id || null,
        uploadTarget: target,
        existingProductId: target === 'existing' ? matchedProduct?.id : undefined,
        existingProductName: target === 'existing' ? matchedProduct?.name : undefined,
        matchedProduct,
        detectedSku,
      };
    });
  }, [files, existingProducts, groupTargets]);

  const updateGroupName = (groupId: string, productName: string) => {
    setFiles(prev => prev.map(f => 
      f.groupId === groupId ? { ...f, productName } : f
    ));
  };

  const updateGroupCategory = (groupId: string, categoryName: string | null) => {
    setFiles(prev => prev.map(f => 
      f.groupId === groupId ? { ...f, categoryName } : f
    ));
  };

  const setGroupTarget = (groupId: string, target: 'new' | 'existing') => {
    setGroupTargets(prev => new Map(prev).set(groupId, target));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => {
      const isVideo = isVideoFile(file.name);
      const groupId = extractProductIdentifier(file.name);
      const detectedSku = extractSkuFromFilename(file.name);
      
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        status: 'pending' as const,
        progress: 0,
        productName: generateProductNameFromFilename(file.name),
        categoryName: detectCategoryFromFilename(file.name),
        fileType: isVideo ? 'video' : 'image',
        groupId,
        detectedSku,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    multiple: true,
  });

  const generateSlug = (name: string, nameEn?: string, sku?: string): string => {
    // If English name provided, use it for SEO-friendly URL
    if (nameEn?.trim()) {
      const baseSlug = nameEn
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      if (sku?.trim()) {
        const cleanSku = sku.toLowerCase().replace(/[^a-z0-9-]/g, '');
        return `${cleanSku}-${baseSlug}`;
      }
      return baseSlug + '-' + Date.now().toString(36).slice(-5);
    }
    
    // Fallback: Hebrew name with timestamp
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now();
  };

  // Check if any groups have matching products and show dialog
  const checkForMatchesAndProceed = () => {
    const groupsWithMatches = fileGroups.filter(g => 
      g.matchedProduct && g.files.some(f => f.status === 'pending' || f.status === 'error')
    );
    
    if (groupsWithMatches.length > 0) {
      setPendingGroupsForDialog(groupsWithMatches);
      setShowTargetDialog(true);
    } else {
      startUpload();
    }
  };

  const confirmTargetsAndUpload = () => {
    setShowTargetDialog(false);
    startUpload();
  };

  // Upload a single file and return its URL
  const uploadSingleFileToStorage = async (uploadFile: UploadFile): Promise<{ url: string; filename: string } | null> => {
    const { file, fileType } = uploadFile;
    
    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 20 } : f
      ));

      let processedBlob: Blob;
      let fileExtension: string;
      let contentType: string;

      if (fileType === 'video') {
        // Video files - upload as-is
        processedBlob = file;
        fileExtension = file.name.split('.').pop() || 'mp4';
        contentType = file.type || 'video/mp4';
      } else {
        // Image files - process
        if (standardize) {
          const result = await processImageForCatalog(file);
          processedBlob = result.blob;
          fileExtension = result.format;
          contentType = result.format === 'webp' ? 'image/webp' : 'image/jpeg';
        } else if (useWebP) {
          const result = await compressToWebP(file);
          processedBlob = result.blob;
          fileExtension = result.format;
          contentType = `image/${result.format}`;
        } else {
          processedBlob = file;
          fileExtension = file.name.split('.').pop() || 'jpg';
          contentType = file.type || 'image/jpeg';
        }
      }

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 50 } : f
      ));

      const filename = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(filename, processedBlob, {
          contentType,
          cacheControl: "31536000",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(filename);

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 80, status: 'processing' as const } : f
      ));

      // Add to media library for images
      if (fileType === 'image') {
        await supabase.from("media").insert({
          filename,
          original_filename: file.name,
          file_url: publicUrl,
          file_type: contentType,
          file_size: processedBlob.size,
        });
      }

      return { url: publicUrl, filename };
    } catch (error: any) {
      console.error("Upload error:", error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error' as const, 
          progress: 0,
          errorMessage: error.message 
        } : f
      ));
      return null;
    }
  };

  // Get max display order for existing product images
  const getMaxDisplayOrder = async (productId: string): Promise<number> => {
    const { data } = await supabase
      .from("product_images")
      .select("display_order")
      .eq("product_id", productId)
      .order("display_order", { ascending: false })
      .limit(1);
    
    return data?.[0]?.display_order ?? -1;
  };

  // Upload an entire group as a single product or to existing product
  const uploadGroup = async (group: FileGroup): Promise<void> => {
    const images = group.files.filter(f => f.fileType === 'image' && (f.status === 'pending' || f.status === 'error'));
    const videos = group.files.filter(f => f.fileType === 'video' && (f.status === 'pending' || f.status === 'error'));
    
    if (images.length === 0 && videos.length === 0) return;

    try {
      const uploadedImages: { url: string; filename: string; fileId: string }[] = [];
      let videoUrl: string | null = null;

      // Upload all images
      for (const img of images) {
        const result = await uploadSingleFileToStorage(img);
        if (result) {
          uploadedImages.push({ ...result, fileId: img.id });
        }
      }

      // Upload first video
      if (videos.length > 0) {
        const videoResult = await uploadSingleFileToStorage(videos[0]);
        if (videoResult) {
          videoUrl = videoResult.url;
        }
        // Mark other videos as skipped
        for (let i = 1; i < videos.length; i++) {
          setFiles(prev => prev.map(f => 
            f.id === videos[i].id ? { ...f, status: 'success' as const, progress: 100 } : f
          ));
        }
      }

      if (uploadedImages.length === 0 && !videoUrl) {
        throw new Error("לא הועלו קבצים");
      }

      if (group.uploadTarget === 'existing' && group.existingProductId) {
        // Add to existing product
        const maxOrder = await getMaxDisplayOrder(group.existingProductId);
        
        for (let i = 0; i < uploadedImages.length; i++) {
          await supabase.from("product_images").insert({
            product_id: group.existingProductId,
            image_url: uploadedImages[i].url,
            alt_text: group.productName,
            display_order: maxOrder + i + 1,
          });
        }
        
        // Update video if doesn't exist
        if (videoUrl) {
          const { data: existingProduct } = await supabase
            .from("products")
            .select("video_url")
            .eq("id", group.existingProductId)
            .single();
          
          if (!existingProduct?.video_url) {
            await supabase
              .from("products")
              .update({ video_url: videoUrl })
              .eq("id", group.existingProductId);
          }
        }
      } else {
        // Create new product
        const categoryId = findCategoryId(group.categoryName);
        const slug = generateSlug(group.productName);
        const mainImageUrl = uploadedImages[0]?.url || null;

        const { data: product, error: productError } = await supabase
          .from("products")
          .insert({
            name: group.productName,
            slug,
            main_image_url: mainImageUrl,
            video_url: videoUrl,
            category_id: categoryId,
            is_active: true,
            is_featured: false,
            sku: group.detectedSku,
          })
          .select()
          .single();

        if (productError) throw productError;

        // Create product_images entries
        for (let i = 0; i < uploadedImages.length; i++) {
          await supabase.from("product_images").insert({
            product_id: product.id,
            image_url: uploadedImages[i].url,
            alt_text: group.productName,
            display_order: i,
          });
        }

        // Auto AI SEO for main image
        if (autoAI && mainImageUrl) {
          try {
            await supabase.functions.invoke("ai-media-seo", {
              body: { imageUrl: mainImageUrl, productId: product.id },
            });
          } catch (aiError) {
            console.warn("AI SEO failed:", aiError);
          }
        }
      }

      // Mark all files in group as success
      const groupFileIds = group.files.map(f => f.id);
      setFiles(prev => prev.map(f => 
        groupFileIds.includes(f.id) ? { ...f, status: 'success' as const, progress: 100 } : f
      ));

    } catch (error: any) {
      console.error("Group upload error:", error);
      const groupFileIds = group.files.map(f => f.id);
      setFiles(prev => prev.map(f => 
        groupFileIds.includes(f.id) && f.status !== 'success' ? { 
          ...f, 
          status: 'error' as const, 
          progress: 0,
          errorMessage: error.message 
        } : f
      ));
    }
  };

  const startUpload = async () => {
    setIsUploading(true);
    
    // Get groups with pending files
    const pendingGroups = fileGroups.filter(g => 
      g.files.some(f => f.status === 'pending' || f.status === 'error')
    );
    
    // Process groups sequentially
    for (const group of pendingGroups) {
      await uploadGroup(group);
    }
    
    setIsUploading(false);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    queryClient.invalidateQueries({ queryKey: ["products-for-matching"] });
    
    const newCount = pendingGroups.filter(g => g.uploadTarget === 'new').length;
    const existingCount = pendingGroups.filter(g => g.uploadTarget === 'existing').length;
    
    if (existingCount > 0) {
      toast.success(`נוספו תמונות ל-${existingCount} מוצרים קיימים, נוצרו ${newCount} מוצרים חדשים`);
    } else {
      toast.success(`הועלו ${newCount} מוצרים בהצלחה`);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const clearAll = () => {
    setFiles([]);
    setGroupTargets(new Map());
  };

  const totalProgress = files.length > 0 
    ? Math.round(files.reduce((acc, f) => acc + f.progress, 0) / files.length) 
    : 0;

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading' || f.status === 'processing').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-secondary/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Switch id="webp" checked={useWebP} onCheckedChange={setUseWebP} />
          <Label htmlFor="webp">כיווץ WebP</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="standardize" checked={standardize} onCheckedChange={setStandardize} />
          <Label htmlFor="standardize">תקנון 1000x1000</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="autoAI" checked={autoAI} onCheckedChange={setAutoAI} />
          <Label htmlFor="autoAI" className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            AI SEO אוטומטי
          </Label>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? "שחרר כאן להעלאה" : "גרור תמונות ווידאו לכאן או לחץ לבחירה"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              תמונות: JPG, PNG, WebP, GIF • וידאו: MP4, WebM, MOV
            </p>
          </div>
        </div>
      </div>

      {/* Upload Controls */}
      {files.length > 0 && (
        <div className="space-y-4">
          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>מעלה {uploadingCount} קבצים...</span>
                <span>{totalProgress}%</span>
              </div>
              <Progress value={totalProgress} className="h-2" />
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="secondary" className="gap-1">
              <Layers className="w-3 h-3" />
              מוצרים: {fileGroups.length}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Clock className="w-3 h-3" />
              ממתין: {pendingCount}
            </Badge>
            {uploadingCount > 0 && (
              <Badge variant="default" className="gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                מעלה: {uploadingCount}
              </Badge>
            )}
            {successCount > 0 && (
              <Badge className="gap-1 bg-green-500 text-white">
                <CheckCircle className="w-3 h-3" />
                הצליח: {successCount}
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="w-3 h-3" />
                נכשל: {errorCount}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={checkForMatchesAndProceed} 
              disabled={isUploading || pendingCount === 0}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              העלה {fileGroups.length > 0 ? `(${fileGroups.length} מוצרים)` : ''}
            </Button>
            <Button variant="outline" onClick={clearCompleted} disabled={successCount === 0}>
              נקה הושלמו
            </Button>
            <Button variant="ghost" onClick={clearAll} disabled={isUploading}>
              נקה הכל
            </Button>
          </div>

          {/* Group List */}
          <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
            {fileGroups.map((group) => {
              const images = group.files.filter(f => f.fileType === 'image');
              const videos = group.files.filter(f => f.fileType === 'video');
              const allSuccess = group.files.every(f => f.status === 'success');
              const hasError = group.files.some(f => f.status === 'error');
              const isProcessing = group.files.some(f => f.status === 'uploading' || f.status === 'processing');
              const isPending = group.files.some(f => f.status === 'pending');
              
              return (
                <div key={group.groupId} className="p-4 hover:bg-secondary/30 space-y-3">
                  {/* Group Header */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {allSuccess ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : hasError ? (
                        <XCircle className="w-5 h-5 text-destructive" />
                      ) : isProcessing ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {isPending ? (
                        <>
                          <Input
                            value={group.productName}
                            onChange={(e) => updateGroupName(group.groupId, e.target.value)}
                            className="h-8 text-sm font-medium"
                            placeholder="שם המוצר"
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={group.categoryName || "none"}
                              onValueChange={(value) => updateGroupCategory(group.groupId, value === "none" ? null : value)}
                            >
                              <SelectTrigger className="h-7 text-xs w-[160px]">
                                <SelectValue placeholder="בחר קטגוריה" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">ללא קטגוריה</SelectItem>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Target Selection */}
                            {group.matchedProduct && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant={group.uploadTarget === 'new' ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => setGroupTarget(group.groupId, 'new')}
                                >
                                  <Plus className="w-3 h-3" />
                                  חדש
                                </Button>
                                <Button
                                  variant={group.uploadTarget === 'existing' ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => setGroupTarget(group.groupId, 'existing')}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  {group.matchedProduct.name}
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {/* Match indicator */}
                          {group.matchedProduct && (
                            <div className="flex items-center gap-2 text-xs">
                              <Search className="w-3 h-3 text-blue-500" />
                              <span className="text-muted-foreground">
                                נמצא: <span className="font-medium text-foreground">{group.matchedProduct.name}</span>
                                {group.matchedProduct.sku && (
                                  <span className="text-muted-foreground"> (מק"ט: {group.matchedProduct.sku})</span>
                                )}
                              </span>
                              <Badge variant="outline" className="text-[10px] h-4">
                                {group.matchedProduct.matchType === 'sku' ? 'התאמת מק"ט' : 'התאמת שם'}
                              </Badge>
                            </div>
                          )}
                          
                          {group.detectedSku && !group.matchedProduct && (
                            <div className="text-xs text-muted-foreground">
                              מק"ט מזוהה: <span className="font-mono">{group.detectedSku}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-medium">{group.productName}</p>
                          <div className="flex items-center gap-2">
                            {group.categoryName && (
                              <Badge variant="outline" className="text-xs">
                                {group.categoryName}
                              </Badge>
                            )}
                            {group.uploadTarget === 'existing' && (
                              <Badge variant="secondary" className="text-xs">
                                נוסף ל: {group.existingProductName}
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <FileImage className="w-3 h-3" />
                        {images.length}
                      </Badge>
                      {videos.length > 0 && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Film className="w-3 h-3" />
                          {videos.length}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* File Thumbnails */}
                  <div className="flex flex-wrap gap-2 mr-9">
                    {group.files.map((file, idx) => (
                      <div 
                        key={file.id} 
                        className={`relative w-12 h-12 rounded border overflow-hidden ${
                          file.status === 'success' ? 'border-green-500' :
                          file.status === 'error' ? 'border-destructive' :
                          file.status === 'uploading' || file.status === 'processing' ? 'border-primary' :
                          'border-border'
                        }`}
                      >
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          {file.fileType === 'video' ? (
                            <Film className="w-5 h-5 text-blue-500" />
                          ) : (
                            <FileImage className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        {idx === 0 && file.fileType === 'image' && (
                          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[8px] px-1 rounded-bl">
                            ראשית
                          </div>
                        )}
                        {file.status === 'error' && (
                          <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                            <XCircle className="w-4 h-4 text-destructive" />
                          </div>
                        )}
                        {(file.status === 'uploading' || file.status === 'processing') && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Error Messages */}
                  {group.files.filter(f => f.errorMessage).map(file => (
                    <p key={file.id} className="text-xs text-destructive mr-9">
                      {file.name}: {file.errorMessage}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Target Selection Dialog */}
      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              נמצאו מוצרים קיימים
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              נמצאו התאמות למוצרים קיימים. בחר להוסיף למוצר קיים או ליצור מוצר חדש:
            </p>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {pendingGroupsForDialog.map((group) => (
                <div key={group.groupId} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{group.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.files.length} קבצים
                        {group.detectedSku && ` • מק"ט: ${group.detectedSku}`}
                      </p>
                    </div>
                  </div>
                  
                  {group.matchedProduct && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-sm">
                      {group.matchedProduct.main_image_url && (
                        <img 
                          src={group.matchedProduct.main_image_url} 
                          alt={group.matchedProduct.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{group.matchedProduct.name}</p>
                        {group.matchedProduct.sku && (
                          <p className="text-xs text-muted-foreground">מק"ט: {group.matchedProduct.sku}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {group.matchedProduct.matchType === 'sku' ? 'מק"ט' : 'שם'}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={group.uploadTarget === 'existing' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => setGroupTarget(group.groupId, 'existing')}
                    >
                      <ArrowRight className="w-4 h-4" />
                      הוסף למוצר קיים
                    </Button>
                    <Button
                      variant={group.uploadTarget === 'new' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => setGroupTarget(group.groupId, 'new')}
                    >
                      <Plus className="w-4 h-4" />
                      צור מוצר חדש
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTargetDialog(false)}>
              ביטול
            </Button>
            <Button onClick={confirmTargetsAndUpload}>
              המשך להעלאה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-lg">
        <p className="font-medium mb-2">💡 טיפים:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>קבצים עם אותו שם בסיס יקובצו כמוצר אחד (Ring-001.jpg + Ring-001.mp4)</li>
          <li>המערכת מזהה מק"ט משמות קבצים כמו SKU-R001.jpg או RING-001.jpg</li>
          <li>אם נמצא מוצר קיים עם מק"ט או שם תואם, תוכל לבחור להוסיף אליו</li>
          <li>קידומות Ring_, טבעת_, עגיל_, צמיד_, תליון_ יקטלגו אוטומטית</li>
          <li>התמונה הראשונה תהיה התמונה הראשית של המוצר</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkProductUploader;
