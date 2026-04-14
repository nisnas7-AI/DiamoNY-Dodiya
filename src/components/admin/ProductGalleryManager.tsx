import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImagePlus, X, Loader2, GripVertical, Check, Star, Upload } from "lucide-react";
import { toast } from "sonner";
import { processImageForCatalog } from "@/lib/imageProcessor";
interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

interface MediaItem {
  id: string;
  file_url: string;
  original_filename: string | null;
  alt_text: string | null;
}

interface ProductGalleryManagerProps {
  productId: string;
}

const ProductGalleryManager = ({ productId }: ProductGalleryManagerProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ["product-gallery", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId,
  });

  const { data: mediaItems } = useQuery({
    queryKey: ["admin-media-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("id, file_url, original_filename, alt_text")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as MediaItem[];
    },
  });

  const addImages = useMutation({
    mutationFn: async (urls: string[]) => {
      const currentMax = galleryImages?.length || 0;
      const newImages = urls.map((url, index) => ({
        product_id: productId,
        image_url: url,
        display_order: currentMax + index + 1,
      }));
      const { error } = await supabase.from("product_images").insert(newImages);
      if (error) throw error;
      return urls; // Return URLs to use in onSuccess
    },
    onSuccess: async (urls) => {
      // Force immediate refetch of gallery
      queryClient.invalidateQueries({ 
        queryKey: ["product-gallery", productId],
        refetchType: 'active'
      });
      
      // Check if product needs a main image
      const { data: product } = await supabase
        .from("products")
        .select("main_image_url")
        .eq("id", productId)
        .single();
      
      // If no main image, set the first uploaded image as main
      if (!product?.main_image_url && urls.length > 0) {
        const { data, error } = await supabase
          .from("products")
          .update({ main_image_url: urls[0] })
          .eq("id", productId)
          .select('main_image_url')
          .single();
        
        if (!error) {
          console.log('Auto-set main image:', data?.main_image_url);
          queryClient.invalidateQueries({ 
            queryKey: ["admin-products"],
            refetchType: 'active'
          });
          toast.success("התמונה הראשונה הוגדרה כתמונה ראשית");
        }
      }
      
      toast.success("התמונות נוספו לגלריה");
      setSelectedUrls([]);
      setIsPickerOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה בהוספת תמונות");
    },
  });

  const removeImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-gallery", productId] });
      toast.success("התמונה הוסרה");
    },
    onError: () => {
      toast.error("שגיאה בהסרת התמונה");
    },
  });

  const reorderImages = useMutation({
    mutationFn: async (reorderedImages: ProductImage[]) => {
      // Update each image's display_order
      const updates = reorderedImages.map((image, index) => 
        supabase
          .from("product_images")
          .update({ display_order: index + 1 })
          .eq("id", image.id)
      );
      
      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-gallery", productId] });
      toast.success("סדר התמונות עודכן");
    },
    onError: () => {
      toast.error("שגיאה בעדכון סדר התמונות");
    },
  });

  const toggleImageSelection = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleAddSelected = () => {
    if (selectedUrls.length === 0) {
      toast.error("נא לבחור לפחות תמונה אחת");
      return;
    }
    addImages.mutate(selectedUrls);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Add a slight delay to show the drag effect
    setTimeout(() => {
      const target = e.target as HTMLElement;
      target.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || !galleryImages || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...galleryImages];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    // Optimistically update the UI
    queryClient.setQueryData(["product-gallery", productId], newImages);
    
    // Persist the new order
    reorderImages.mutate(newImages);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter out images already in gallery
  const existingUrls = galleryImages?.map((img) => img.image_url) || [];
  const availableMedia = mediaItems?.filter(
    (item) => !existingUrls.includes(item.file_url)
  );

  const setAsMainImage = async (imageUrl: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ main_image_url: imageUrl })
        .eq('id', productId)
        .select('main_image_url')
        .single();
      
      if (error) throw error;
      
      console.log('Main image updated:', data?.main_image_url);
      
      // Force immediate refetch with refetchType: 'active'
      queryClient.invalidateQueries({ 
        queryKey: ["admin-products"],
        refetchType: 'active'
      });
      
      toast.success("תמונה ראשית עודכנה");
    } catch (error: any) {
      console.error('setAsMainImage error:', error);
      toast.error(`שגיאה בעדכון תמונה ראשית: ${error.message || 'לא ידוע'}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        // Process image with quality preservation for files under 1.5MB
        const result = await processImageForCatalog(file);
        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${result.format}`;
        
        // Log quality preservation status
        if (result.skippedCompression) {
          console.log(`Quality preserved for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB < 1.5MB)`);
        }

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("catalog-media")
          .upload(fileName, result.blob, {
            contentType: result.format === 'webp' ? 'image/webp' : `image/${result.format}`,
            cacheControl: "31536000",
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
          file_type: result.format === 'webp' ? 'image/webp' : `image/${result.format}`,
          file_size: result.blob instanceof File ? result.blob.size : (result.blob as Blob).size,
        });

        uploadedUrls.push(publicUrl);
      }

      // Add to product gallery
      addImages.mutate(uploadedUrls);
      toast.success(`${uploadedUrls.length} תמונות הועלו בהצלחה`);
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהעלאת התמונות");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">גלריית תמונות ({galleryImages?.length || 0})</span>
        <div className="flex gap-2">
          {/* Upload from computer */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Upload className="h-4 w-4 ml-2" />
            )}
            העלה מהמחשב
          </Button>
          
          {/* Select from media library */}
          <Dialog open={isPickerOpen} onOpenChange={(open) => {
            setIsPickerOpen(open);
            if (!open) setSelectedUrls([]);
          }}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <ImagePlus className="h-4 w-4 ml-2" />
                בחר מהספרייה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>בחר תמונות לגלריה</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] mt-4">
                {!availableMedia?.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין תמונות זמינות להוספה
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 p-1">
                    {availableMedia.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleImageSelection(item.file_url)}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:border-primary ${
                          selectedUrls.includes(item.file_url)
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={item.file_url}
                          alt={item.alt_text || item.original_filename || ""}
                          className="w-full h-full object-cover"
                        />
                        {selectedUrls.includes(item.file_url) && (
                          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  נבחרו {selectedUrls.length} תמונות
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsPickerOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleAddSelected} disabled={addImages.isPending || selectedUrls.length === 0}>
                    {addImages.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    הוסף לגלריה
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !galleryImages?.length ? (
        <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
          אין תמונות בגלריה
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">גרור כדי לשנות סדר</p>
          <div className="flex flex-wrap gap-2">
            {galleryImages.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative group w-20 h-24 rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
                  dragOverIndex === index 
                    ? "border-primary scale-105 shadow-lg" 
                    : draggedIndex === index 
                    ? "border-primary/50 opacity-50" 
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                {/* Drag Handle */}
                <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-black/50 to-transparent flex items-start justify-center pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <GripVertical className="h-4 w-4 text-white" />
                </div>
                
                <img
                  src={image.image_url}
                  alt={image.alt_text || ""}
                  className="w-full h-full object-cover pointer-events-none"
                />
                
                {/* Set as Main Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAsMainImage(image.image_url);
                  }}
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  title="הגדר כתמונה ראשית"
                >
                  <Star className="h-3 w-3" />
                </button>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage.mutate(image.id);
                  }}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                  <X className="h-3 w-3" />
                </button>
                
                {/* Order Badge */}
                <div className="absolute bottom-0.5 left-0.5 w-5 h-5 bg-black/60 text-white rounded text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                
                {/* Drop Indicator */}
                {dragOverIndex === index && draggedIndex !== index && (
                  <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
                    <span className="text-xs font-medium text-primary bg-white px-1 rounded">שחרר כאן</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGalleryManager;
