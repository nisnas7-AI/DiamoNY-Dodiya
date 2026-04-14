import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MetalType } from "@/components/catalog/MetalSelector";

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
  media_type: string | null;
}

interface UseProductVariantsReturn {
  variants: ProductVariant[];
  variantImages: Record<string, VariantImage[]>;
  isLoading: boolean;
  getVariantByMetal: (metal: MetalType) => ProductVariant | undefined;
  getImagesForMetal: (metal: MetalType) => VariantImage[];
  getVideosForMetal: (metal: MetalType) => VariantImage[];
  hasImagesForMetal: (metal: MetalType) => boolean;
  getVideoForMetal: (metal: MetalType) => string | null;
  hasVideoForMetal: (metal: MetalType) => boolean;
}

export const useProductVariants = (productId: string | null): UseProductVariantsReturn => {
  // Fetch variants for the product
  const { data: variants = [], isLoading: variantsLoading } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .eq("variant_type", "gold_type")
        .order("display_order");
      
      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!productId,
  });

  // Fetch variant images
  const { data: allVariantImages = [], isLoading: imagesLoading } = useQuery({
    queryKey: ["product-variant-images", productId],
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

  // Group images by variant ID
  const variantImages: Record<string, VariantImage[]> = {};
  allVariantImages.forEach(img => {
    if (!variantImages[img.variant_id]) {
      variantImages[img.variant_id] = [];
    }
    variantImages[img.variant_id].push(img);
  });

  const getVariantByMetal = (metal: MetalType): ProductVariant | undefined => {
    return variants.find(v => v.variant_value === metal);
  };

  const getImagesForMetal = (metal: MetalType): VariantImage[] => {
    const variant = getVariantByMetal(metal);
    if (!variant) return [];
    // Return only items with media_type 'image' or null (for backwards compatibility)
    const allMedia = variantImages[variant.id] || [];
    return allMedia.filter(m => !m.media_type || m.media_type === 'image');
  };

  const getVideosForMetal = (metal: MetalType): VariantImage[] => {
    const variant = getVariantByMetal(metal);
    if (!variant) return [];
    // Return only items with media_type 'video'
    const allMedia = variantImages[variant.id] || [];
    return allMedia.filter(m => m.media_type === 'video');
  };

  const hasImagesForMetal = (metal: MetalType): boolean => {
    return getImagesForMetal(metal).length > 0;
  };

  const getVideoForMetal = (metal: MetalType): string | null => {
    const variant = getVariantByMetal(metal);
    if (!variant) return null;
    return variant.video_url || null;
  };

  const hasVideoForMetal = (metal: MetalType): boolean => {
    return !!getVideoForMetal(metal);
  };

  return {
    variants,
    variantImages,
    isLoading: variantsLoading || imagesLoading,
    getVariantByMetal,
    getImagesForMetal,
    getVideosForMetal,
    hasImagesForMetal,
    getVideoForMetal,
    hasVideoForMetal,
  };
};

export default useProductVariants;
