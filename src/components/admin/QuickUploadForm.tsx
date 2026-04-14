import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileImage,
  Film,
  Package,
  Tag,
  Settings,
  Zap,
  Link2
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ProductAutocomplete from "./ProductAutocomplete";
import { 
  processImageForCatalog,
  isVideoFile,
  isImageFile,
  formatFileSize,
} from "@/lib/mediaProcessor";
import { parseFilenameForSpecs, GoldType, GOLD_TYPE_LABELS } from "@/lib/filenameParser";
import { 
  detectCategoryFromFilename,
  generateProductNameFromFilename,
  extractProductIdentifier,
  extractSkuFromFilename
} from "@/lib/imageProcessor";

interface UploadFile {
  id: string;
  file: File;
  name: string;
  status: 'pending' | 'processing' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
  fileType: 'image' | 'video';
  groupId: string;
  processedSize?: number;
  originalSize?: number;
}

interface ExistingProduct {
  id: string;
  name: string;
  sku: string | null;
  main_image_url: string | null;
  category_id: string | null;
}

interface ProductEntry {
  groupId: string;
  productName: string;
  categoryId: string | null;
  sku: string;
  price: string;
  stockStatus: 'in_stock' | 'made_to_order';
  files: UploadFile[];
  // Auto-detected specs
  detectedGoldType?: GoldType;
  detectedCarat?: string;
  // Binding to existing product
  existingProduct: ExistingProduct | null;
  bindMode: 'new' | 'existing';
  // Dynamic pricing fields
  goldWeightGrams: string;
  baseLaborMarkup: string;
  isDiamondJewelry: boolean;
}

const QuickUploadForm = () => {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [products, setProducts] = useState<Map<string, Omit<ProductEntry, 'files'>>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [processSettings, setProcessSettings] = useState({
    convertToWebP: true,
    standardizeCanvas: true,
    canvasSize: 1600,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Pre-binding state
  const [preSelectedProduct, setPreSelectedProduct] = useState<ExistingProduct | null>(null);
  const [preSearchQuery, setPreSearchQuery] = useState('');
  const [preSelectedCategory, setPreSelectedCategory] = useState<string | null>(null);

  // Fetch categories
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

  // Group files by product identifier
  const fileGroups = useMemo(() => {
    const groups = new Map<string, UploadFile[]>();
    
    files.forEach(file => {
      if (!groups.has(file.groupId)) {
        groups.set(file.groupId, []);
      }
      groups.get(file.groupId)!.push(file);
    });

    return groups;
  }, [files]);

  // Combined product entries with files
  const productEntries = useMemo((): ProductEntry[] => {
    return Array.from(fileGroups.entries()).map(([groupId, groupFiles]) => {
      const existingProduct = products.get(groupId);
      const firstFile = groupFiles[0];
      
      return {
        groupId,
        productName: existingProduct?.productName || generateProductNameFromFilename(firstFile.name),
        categoryId: existingProduct?.categoryId || null,
        sku: existingProduct?.sku || '',
        price: existingProduct?.price || '',
        stockStatus: existingProduct?.stockStatus || 'made_to_order',
        files: groupFiles,
        detectedGoldType: existingProduct?.detectedGoldType,
        detectedCarat: existingProduct?.detectedCarat,
        existingProduct: existingProduct?.existingProduct || null,
        bindMode: existingProduct?.bindMode || 'new',
        goldWeightGrams: existingProduct?.goldWeightGrams || '',
        baseLaborMarkup: existingProduct?.baseLaborMarkup || '',
        isDiamondJewelry: existingProduct?.isDiamondJewelry || false,
      };
    });
  }, [fileGroups, products]);

  const updateProduct = (groupId: string, updates: Partial<Omit<ProductEntry, 'files'>>) => {
    setProducts(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(groupId) || {
        groupId,
        productName: '',
        categoryId: null,
        sku: '',
        price: '',
        stockStatus: 'made_to_order' as const,
        existingProduct: null,
        bindMode: 'new' as const,
        goldWeightGrams: '',
        baseLaborMarkup: '',
        isDiamondJewelry: false,
      };
      newMap.set(groupId, { ...existing, ...updates });
      return newMap;
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // If a product is pre-selected, bind ALL files to it
    if (preSelectedProduct) {
      const groupId = preSelectedProduct.id;
      
      const newFiles: UploadFile[] = acceptedFiles.map((file) => {
        const isVideo = isVideoFile(file);
        
        return {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          status: 'pending' as const,
          progress: 0,
          fileType: isVideo ? 'video' : 'image',
          groupId, // All files share the same group (product ID)
          originalSize: file.size,
        };
      });
      
      setFiles((prev) => [...prev, ...newFiles]);
      
      // Set product data for this group
      setProducts(prev => {
        const newMap = new Map(prev);
        newMap.set(groupId, {
          groupId,
          productName: preSelectedProduct.name,
          categoryId: preSelectedProduct.category_id,
          sku: preSelectedProduct.sku || '',
          price: '',
          stockStatus: 'made_to_order',
          existingProduct: preSelectedProduct,
          bindMode: 'existing',
          goldWeightGrams: '',
          baseLaborMarkup: '',
          isDiamondJewelry: false,
        });
        return newMap;
      });
      
      // Clear pre-selection after binding
      setPreSelectedProduct(null);
      setPreSearchQuery('');
      
      return;
    }
    
    // Default behavior: smart grouping by filename
    const newFiles: UploadFile[] = acceptedFiles.map((file) => {
      const isVideo = isVideoFile(file);
      const groupId = extractProductIdentifier(file.name);
      
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        status: 'pending' as const,
        progress: 0,
        fileType: isVideo ? 'video' : 'image',
        groupId,
        originalSize: file.size,
      };
    });
    
    setFiles((prev) => [...prev, ...newFiles]);

    // Auto-parse specs from filenames
    newFiles.forEach(file => {
      const specs = parseFilenameForSpecs(file.name);
      const groupId = file.groupId;
      const extractedSku = extractSkuFromFilename(file.name);
      
      setProducts(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(groupId);
        
        if (!existing) {
          const category = detectCategoryFromFilename(file.name);
          // Use pre-selected category if available, otherwise detect from filename
          const categoryId = preSelectedCategory || categories.find(c => c.name === category)?.id || null;
          
          newMap.set(groupId, {
            groupId,
            productName: generateProductNameFromFilename(file.name),
            categoryId,
            sku: extractedSku || specs.sku || '',
            price: '',
            stockStatus: 'made_to_order',
            detectedGoldType: specs.goldType,
            detectedCarat: specs.caratWeight,
            existingProduct: null,
            bindMode: 'new',
            goldWeightGrams: '',
            baseLaborMarkup: '',
            isDiamondJewelry: false,
          });
        } else if ((extractedSku || specs.sku) && !existing.sku) {
          newMap.set(groupId, { ...existing, sku: extractedSku || specs.sku || '' });
        }
        
        return newMap;
      });
    });
  }, [categories, preSelectedProduct, preSelectedCategory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.heic', '.heif'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    multiple: true,
    maxFiles: 50,
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

  const uploadFile = async (uploadFile: UploadFile): Promise<string | null> => {
    try {
      // Processing phase
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'processing' as const, progress: 10 } : f
      ));

      let processedBlob: Blob;
      let fileExtension: string;
      let contentType: string;
      let processedSize = uploadFile.file.size;

      if (uploadFile.fileType === 'video') {
        // Videos pass through with basic validation
        processedBlob = uploadFile.file;
        fileExtension = uploadFile.file.name.split('.').pop() || 'mp4';
        contentType = uploadFile.file.type || 'video/mp4';
      } else {
        // Process images with pipeline
        if (processSettings.standardizeCanvas) {
          const result = await processImageForCatalog(uploadFile.file, {
            maxDimension: processSettings.canvasSize,
            quality: 0.95,
            outputFormat: processSettings.convertToWebP ? 'webp' : 'jpeg',
          });
          processedBlob = result.blob;
          fileExtension = result.format;
          contentType = result.format === 'webp' ? 'image/webp' : 'image/jpeg';
          processedSize = result.processedSize;
        } else {
          processedBlob = uploadFile.file;
          fileExtension = uploadFile.file.name.split('.').pop() || 'jpg';
          contentType = uploadFile.file.type || 'image/jpeg';
        }
      }

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 50, processedSize } : f
      ));

      // Upload to storage
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
        f.id === uploadFile.id ? { ...f, progress: 100, status: 'success' as const } : f
      ));

      return publicUrl;
    } catch (error: any) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'error' as const, errorMessage: error.message } : f
      ));
      return null;
    }
  };

  const uploadProducts = async () => {
    setIsUploading(true);
    
    for (const entry of productEntries) {
      const pendingFiles = entry.files.filter(f => f.status === 'pending');
      if (pendingFiles.length === 0) continue;

      const images = pendingFiles.filter(f => f.fileType === 'image');
      const videos = pendingFiles.filter(f => f.fileType === 'video');

      const uploadedImages: string[] = [];
      let videoUrl: string | null = null;

      // Upload images
      for (const img of images) {
        const url = await uploadFile(img);
        if (url) uploadedImages.push(url);
      }

      // Upload first video
      if (videos.length > 0) {
        videoUrl = await uploadFile(videos[0]);
      }

      if (uploadedImages.length === 0 && !videoUrl) continue;

      try {
        if (entry.bindMode === 'existing' && entry.existingProduct) {
          // Append media to existing product
          const productId = entry.existingProduct.id;

          // Get current image count for display_order
          const { data: existingImages } = await supabase
            .from("product_images")
            .select("display_order")
            .eq("product_id", productId)
            .order("display_order", { ascending: false })
            .limit(1);

          const startOrder = (existingImages?.[0]?.display_order ?? -1) + 1;

          // Add new images
          for (let i = 0; i < uploadedImages.length; i++) {
            await supabase.from("product_images").insert({
              product_id: productId,
              image_url: uploadedImages[i],
              alt_text: entry.existingProduct.name,
              display_order: startOrder + i,
            });
          }

          // Update video if provided and product doesn't have one
          if (videoUrl) {
            await supabase
              .from("products")
              .update({ video_url: videoUrl })
              .eq("id", productId)
              .is("video_url", null);
          }

          toast.success(`${uploadedImages.length} תמונות נוספו ל${entry.existingProduct.name}`);
        } else {
          // Create new product
          const slug = generateSlug(entry.productName);
          const { data: product, error } = await supabase
            .from("products")
            .insert({
              name: entry.productName,
              slug,
              main_image_url: uploadedImages[0] || null,
              video_url: videoUrl,
              category_id: entry.categoryId,
              sku: entry.sku || null,
              price: entry.price ? parseFloat(entry.price) : null,
              stock_status: entry.stockStatus,
              gold_type: entry.detectedGoldType ? GOLD_TYPE_LABELS[entry.detectedGoldType] : null,
              stone_weight: entry.detectedCarat || null,
              is_active: true,
              // Dynamic pricing fields
              gold_weight_grams: entry.goldWeightGrams ? parseFloat(entry.goldWeightGrams) : null,
              base_labor_markup: entry.baseLaborMarkup ? parseFloat(entry.baseLaborMarkup) : 0,
              is_diamond_jewelry: entry.isDiamondJewelry,
            })
            .select()
            .single();

          if (error) throw error;

          // Create product_images
          for (let i = 0; i < uploadedImages.length; i++) {
            await supabase.from("product_images").insert({
              product_id: product.id,
              image_url: uploadedImages[i],
              alt_text: entry.productName,
              display_order: i,
            });
          }

          toast.success(`${entry.productName} נוצר בהצלחה`);
        }
      } catch (error: any) {
        toast.error(`שגיאה: ${error.message}`);
      }
    }

    setIsUploading(false);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
  };

  const clearCompleted = () => {
    const completedGroupIds = new Set<string>();
    files.forEach(f => {
      if (f.status === 'success') completedGroupIds.add(f.groupId);
    });
    
    setFiles(prev => prev.filter(f => !completedGroupIds.has(f.groupId)));
    setProducts(prev => {
      const newMap = new Map(prev);
      completedGroupIds.forEach(id => newMap.delete(id));
      return newMap;
    });
  };

  const clearAll = () => {
    setFiles([]);
    setProducts(new Map());
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;

  return (
    <div className="space-y-6">
      {/* Processing Settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 w-full justify-between">
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              הגדרות עיבוד מדיה
            </span>
            <Badge variant="secondary" className="text-xs">
              {processSettings.standardizeCanvas ? `${processSettings.canvasSize}×${processSettings.canvasSize}` : 'מקורי'}
              {processSettings.convertToWebP && ' • WebP'}
            </Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm">המרה ל-WebP</Label>
              <Switch
                checked={processSettings.convertToWebP}
                onCheckedChange={(checked) => 
                  setProcessSettings(prev => ({ ...prev, convertToWebP: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">קנבס אחיד (רקע לבן)</Label>
              <Switch
                checked={processSettings.standardizeCanvas}
                onCheckedChange={(checked) => 
                  setProcessSettings(prev => ({ ...prev, standardizeCanvas: checked }))
                }
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">גודל קנבס</Label>
              <Select
                value={String(processSettings.canvasSize)}
                onValueChange={(value) => 
                  setProcessSettings(prev => ({ ...prev, canvasSize: parseInt(value) }))
                }
                disabled={!processSettings.standardizeCanvas}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1000×1000</SelectItem>
                  <SelectItem value="1200">1200×1200</SelectItem>
                  <SelectItem value="1600">1600×1600 (מומלץ)</SelectItem>
                  <SelectItem value="2000">2000×2000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Pre-bind Section */}
      <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="font-medium">שיוך מהיר למוצר</h3>
          <span className="text-xs text-muted-foreground">(אופציונלי - בחר מוצר קיים לפני גרירת קבצים)</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Search */}
          <ProductAutocomplete
            label="חפש מוצר קיים (מק״ט או שם)"
            value={preSearchQuery}
            onChange={setPreSearchQuery}
            onProductSelect={(product) => {
              setPreSelectedProduct(product);
              if (product) {
                setPreSearchQuery(product.name);
              }
            }}
            selectedProduct={preSelectedProduct}
            searchBySku={true}
            placeholder="הקלד מק״ט או שם מוצר..."
          />
          
          {/* Default Category for new products */}
          <div>
            <Label className="text-xs mb-1 block">קטגוריה ברירת מחדל (למוצרים חדשים)</Label>
            <Select
              value={preSelectedCategory || "none"}
              onValueChange={(value) => setPreSelectedCategory(value === "none" ? null : value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Selected product indicator */}
        {preSelectedProduct && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Package className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                התמונות שתגרור יצטרפו למוצר: <strong>{preSelectedProduct.name}</strong>
              </p>
              {preSelectedProduct.sku && (
                <p className="text-xs text-blue-600 dark:text-blue-300 font-mono">
                  מק״ט: {preSelectedProduct.sku}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPreSelectedProduct(null);
                setPreSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              ביטול
            </Button>
          </div>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${preSelectedProduct 
            ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
            : isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            preSelectedProduct ? 'bg-blue-100 dark:bg-blue-900' : 'bg-primary/10'
          }`}>
            {preSelectedProduct ? (
              <Link2 className="w-8 h-8 text-blue-600" />
            ) : (
              <Upload className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium">
              {preSelectedProduct 
                ? `הוסף תמונות ל-${preSelectedProduct.name}`
                : isDragActive 
                  ? "שחרר כאן להעלאה" 
                  : "גרור תמונות ווידאו לכאן"
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              תמיכה ב-JPG, PNG, HEIC, WebP, MP4, MOV • עד 50 קבצים
            </p>
            {!preSelectedProduct && (
              <p className="text-xs text-muted-foreground mt-2">
                <Zap className="w-3 h-3 inline mr-1" />
                שמות קבצים כמו RING-102_18k_05ct.jpg יזוהו אוטומטית
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Product Entries */}
      {productEntries.length > 0 && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-1">
              <Package className="w-3 h-3" />
              {productEntries.length} מוצרים
            </Badge>
            <Badge variant="outline" className="gap-1">
              <FileImage className="w-3 h-3" />
              {files.filter(f => f.fileType === 'image').length} תמונות
            </Badge>
            {files.some(f => f.fileType === 'video') && (
              <Badge variant="outline" className="gap-1">
                <Film className="w-3 h-3" />
                {files.filter(f => f.fileType === 'video').length} וידאו
              </Badge>
            )}
            {successCount > 0 && (
              <Badge className="gap-1 bg-green-500 text-white">
                <CheckCircle className="w-3 h-3" />
                {successCount} הועלו
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={uploadProducts} 
              disabled={isUploading || pendingCount === 0}
              className="gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              העלה והמשך
            </Button>
            <Button variant="outline" onClick={clearCompleted} disabled={successCount === 0}>
              נקה הושלמו
            </Button>
            <Button variant="ghost" onClick={clearAll} disabled={isUploading}>
              נקה הכל
            </Button>
          </div>

          {/* Product List */}
          <div className="border rounded-lg divide-y">
            {productEntries.map((entry) => {
              const images = entry.files.filter(f => f.fileType === 'image');
              const videos = entry.files.filter(f => f.fileType === 'video');
              const isComplete = entry.files.every(f => f.status === 'success');
              const hasError = entry.files.some(f => f.status === 'error');
              const isProcessing = entry.files.some(f => f.status === 'processing' || f.status === 'uploading');

              return (
                <div key={entry.groupId} className="p-4 space-y-4">
                  {/* Status and bind mode indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : hasError ? (
                        <XCircle className="w-5 h-5 text-destructive" />
                      ) : isProcessing ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <Package className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {images.length} תמונות {videos.length > 0 && `• ${videos.length} וידאו`}
                      </span>
                      
                      {/* Auto-detected specs */}
                      {entry.detectedGoldType && (
                        <Badge variant="outline" className="text-xs">
                          {GOLD_TYPE_LABELS[entry.detectedGoldType]}
                        </Badge>
                      )}
                      {entry.detectedCarat && (
                        <Badge variant="outline" className="text-xs">
                          {entry.detectedCarat} ct
                        </Badge>
                      )}
                    </div>

                    {/* Bind mode indicator */}
                    {entry.bindMode === 'existing' && entry.existingProduct && (
                      <Badge className="gap-1 bg-blue-500 text-white">
                        <Link2 className="w-3 h-3" />
                        מקושר למוצר קיים
                      </Badge>
                    )}
                  </div>

                  {/* Smart Search / Product Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ProductAutocomplete
                      label="שם מוצר / מק״ט (חפש קיים או צור חדש)"
                      value={entry.productName}
                      onChange={(value) => updateProduct(entry.groupId, { productName: value })}
                      onProductSelect={(product) => {
                        if (product) {
                          updateProduct(entry.groupId, {
                            existingProduct: product,
                            bindMode: 'existing',
                            productName: product.name,
                            sku: product.sku || entry.sku,
                            categoryId: product.category_id || entry.categoryId,
                          });
                        } else {
                          updateProduct(entry.groupId, {
                            existingProduct: null,
                            bindMode: 'new',
                          });
                        }
                      }}
                      selectedProduct={entry.existingProduct}
                      searchBySku
                      disabled={isComplete}
                    />

                    <div>
                      <Label className="text-xs mb-1 block">מק"ט</Label>
                      <Input
                        value={entry.sku}
                        onChange={(e) => updateProduct(entry.groupId, { sku: e.target.value })}
                        placeholder="SKU"
                        className="h-9 font-mono"
                        disabled={isComplete || entry.bindMode === 'existing'}
                      />
                    </div>
                  </div>

                  {/* Only show these for new products */}
                  {entry.bindMode === 'new' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Price */}
                        <div>
                          <Label className="text-xs mb-1 block">מחיר ₪</Label>
                          <Input
                            type="number"
                            value={entry.price}
                            onChange={(e) => updateProduct(entry.groupId, { price: e.target.value })}
                            placeholder="0"
                            className="h-9"
                            disabled={isComplete}
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <Label className="text-xs mb-1 block">קטגוריה</Label>
                          <Select
                            value={entry.categoryId || "none"}
                            onValueChange={(value) => updateProduct(entry.groupId, { 
                              categoryId: value === "none" ? null : value 
                            })}
                            disabled={isComplete}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="בחר" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">ללא</SelectItem>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Stock Status */}
                        <div className="flex items-end pb-1">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`stock-${entry.groupId}`}
                              checked={entry.stockStatus === 'in_stock'}
                              onCheckedChange={(checked) => updateProduct(entry.groupId, { 
                                stockStatus: checked ? 'in_stock' : 'made_to_order' 
                              })}
                              disabled={isComplete}
                            />
                            <Label htmlFor={`stock-${entry.groupId}`} className="text-sm">
                              {entry.stockStatus === 'in_stock' ? (
                                <span className="text-green-600 font-medium">במלאי</span>
                              ) : (
                                <span className="text-accent font-medium">להזמנה</span>
                              )}
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Pricing Row */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50">
                        <div>
                          <Label className="text-xs mb-1 block">משקל זהב (גרם)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.goldWeightGrams}
                            onChange={(e) => updateProduct(entry.groupId, { goldWeightGrams: e.target.value })}
                            placeholder="0.00"
                            className="h-9"
                            disabled={isComplete}
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">עלות עבודה (₪)</Label>
                          <Input
                            type="number"
                            value={entry.baseLaborMarkup}
                            onChange={(e) => updateProduct(entry.groupId, { baseLaborMarkup: e.target.value })}
                            placeholder="0"
                            className="h-9"
                            disabled={isComplete}
                          />
                        </div>
                        <div className="flex items-end pb-1">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`diamond-${entry.groupId}`}
                              checked={entry.isDiamondJewelry}
                              onCheckedChange={(checked) => updateProduct(entry.groupId, { 
                                isDiamondJewelry: checked 
                              })}
                              disabled={isComplete}
                            />
                            <Label htmlFor={`diamond-${entry.groupId}`} className="text-xs">
                              תכשיט יהלומים
                            </Label>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <span className="bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                            נתונים פנימיים בלבד
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File thumbnails with processing info */}
                  <div className="flex gap-2 flex-wrap">
                    {entry.files.map((file) => (
                      <div 
                        key={file.id}
                        className={`relative w-12 h-12 rounded border flex items-center justify-center overflow-hidden ${
                          file.status === 'success' ? 'border-green-500 bg-green-50' :
                          file.status === 'error' ? 'border-destructive bg-red-50' :
                          file.status === 'processing' || file.status === 'uploading' ? 'border-primary' :
                          'border-border bg-secondary/50'
                        }`}
                        title={file.processedSize ? 
                          `${formatFileSize(file.originalSize || 0)} → ${formatFileSize(file.processedSize)}` : 
                          file.name
                        }
                      >
                        {file.fileType === 'video' ? (
                          <Film className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FileImage className="w-5 h-5 text-muted-foreground" />
                        )}
                        {(file.status === 'processing' || file.status === 'uploading') && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          </div>
                        )}
                        {file.status === 'success' && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickUploadForm;
