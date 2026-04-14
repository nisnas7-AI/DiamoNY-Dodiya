/**
 * Centralized utility for SEO-optimized alt text generation
 * Ensures consistent, descriptive alt tags across all product images
 */

/**
 * Generate alt text for product gallery images
 * @param productName - The product name (Hebrew/English)
 * @param index - Zero-based index of the current image
 * @param totalImages - Total number of images in the gallery
 * @param variant - Optional variant label (e.g., "זהב צהוב", "זהב לבן")
 * @returns SEO-optimized alt text string
 * 
 * @example
 * generateProductImageAlt("טבעת יהלום סוליטר", 0, 4) 
 * → "טבעת יהלום סוליטר - תמונה 1 מתוך 4"
 * 
 * generateProductImageAlt("טבעת יהלום סוליטר", 1, 4, "זהב לבן")
 * → "טבעת יהלום סוליטר - זהב לבן - תמונה 2 מתוך 4"
 */
export const generateProductImageAlt = (
  productName: string,
  index: number,
  totalImages: number,
  variant?: string
): string => {
  const baseAlt = productName.trim();
  const variantText = variant ? ` - ${variant}` : '';
  const positionText = totalImages > 1 ? ` - תמונה ${index + 1} מתוך ${totalImages}` : '';
  
  return `${baseAlt}${variantText}${positionText}`;
};

/**
 * Generate alt text for the main/hero product image
 * @param productName - The product name
 * @param variant - Optional variant label
 * @returns SEO-optimized alt text with brand suffix
 * 
 * @example
 * generateMainImageAlt("טבעת יהלום סוליטר")
 * → "טבעת יהלום סוליטר - DiamoNY"
 * 
 * generateMainImageAlt("טבעת יהלום סוליטר", "זהב לבן")
 * → "טבעת יהלום סוליטר - זהב לבן - DiamoNY"
 */
export const generateMainImageAlt = (
  productName: string,
  variant?: string
): string => {
  const baseAlt = productName.trim();
  const variantText = variant ? ` - ${variant}` : '';
  return `${baseAlt}${variantText} - DiamoNY`;
};

/**
 * Generate alt text for thumbnail images
 * @param productName - The product name
 * @param index - Zero-based index
 * @returns Shorter alt text for thumbnail context
 */
export const generateThumbnailAlt = (
  productName: string,
  index: number
): string => {
  return `${productName.trim()} - תמונה ${index + 1}`;
};

/**
 * Generate alt text for video thumbnails
 * @param productName - The product name
 * @returns Alt text indicating video content
 */
export const generateVideoThumbnailAlt = (
  productName: string
): string => {
  return `צפו בסרטון: ${productName.trim()}`;
};
