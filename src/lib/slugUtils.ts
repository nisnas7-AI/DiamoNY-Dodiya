import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";

/**
 * Generates an English-only slug from name_en and SKU
 * Format: {sku}-{name-in-english} or just {name-in-english}
 */
export const generateEnglishSlug = (nameEn: string, sku?: string): string => {
  if (!nameEn?.trim()) {
    throw new Error("שם באנגלית נדרש ליצירת slug");
  }
  
  // Clean and convert to lowercase
  const baseSlug = nameEn
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Only English letters, numbers, and hyphens
    .replace(/\s+/g, '-')         // Spaces to hyphens
    .replace(/-+/g, '-')          // Single hyphens only
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
  
  // Combine with SKU if available
  if (sku?.trim()) {
    const cleanSku = sku.toLowerCase().replace(/[^a-z0-9-]/g, '');
    return `${cleanSku}-${baseSlug}`;
  }
  
  return baseSlug;
};

/**
 * Ensures slug uniqueness by checking the database
 * Adds random suffix if duplicate exists
 */
export const ensureUniqueSlug = async (
  baseSlug: string, 
  excludeProductId?: string
): Promise<string> => {
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    let query = supabase
      .from('products')
      .select('id')
      .eq('slug', slug);
    
    // Exclude current product when editing
    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }
    
    const { data } = await query.maybeSingle();
    
    if (!data) return slug; // Slug is available
    
    // Add random 5-char suffix
    const suffix = Math.random().toString(36).substring(2, 7);
    slug = `${baseSlug}-${suffix}`;
    attempts++;
  }
  
  throw new Error("לא ניתן ליצור slug ייחודי");
};

/**
 * Validates that a string contains only valid slug characters
 */
export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+$/.test(slug);
};

/**
 * Legacy slug generator for backwards compatibility (Hebrew support)
 * @deprecated Use generateEnglishSlug instead
 */
export const generateLegacySlug = (name: string, sku?: string): string => {
  const baseSlug = name.toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0590-\u05FF-]+/g, "") // Keep Hebrew chars
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
  
  const uniqueSuffix = sku 
    ? sku.toLowerCase().replace(/[^\w-]+/g, "")
    : Date.now().toString(36).slice(-5);
  
  return sku ? `${uniqueSuffix}-${baseSlug}` : `${baseSlug}-${uniqueSuffix}`;
};
