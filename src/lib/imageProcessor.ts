// Image processing utilities for catalog standardization
// High quality settings for jewelry images

export const CATALOG_IMAGE_CONFIG = {
  maxDimension: 2400,
  quality: 0.95,
  format: 'image/webp' as const,
  // Files under this size skip compression to preserve diamond clarity
  skipCompressionThreshold: 1.5 * 1024 * 1024, // 1.5MB
};

/**
 * Load an image from a URL or File
 */
export const loadImage = (source: string | File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
};

/**
 * Process image preserving aspect ratio with high quality
 * No white padding - images keep their natural dimensions
 * QUALITY PRESERVATION: Files under 1.5MB skip compression entirely
 */
export const processImageForCatalog = async (
  source: string | File,
  options: {
    maxDimension?: number;
    quality?: number;
    outputFormat?: 'webp' | 'jpeg';
    forceProcess?: boolean; // Override the skip threshold
  } = {}
): Promise<{ blob: Blob; format: string; originalSize: number; processedSize: number; skippedCompression: boolean }> => {
  const config = {
    maxDimension: options.maxDimension || CATALOG_IMAGE_CONFIG.maxDimension,
    quality: options.quality || CATALOG_IMAGE_CONFIG.quality,
    outputFormat: options.outputFormat || 'webp',
    forceProcess: options.forceProcess || false,
  };

  const originalSize = source instanceof File ? source.size : 0;
  
  // QUALITY PRESERVATION: Skip compression for files under 1.5MB
  // This maintains 100% diamond clarity and depth
  if (
    source instanceof File && 
    originalSize <= CATALOG_IMAGE_CONFIG.skipCompressionThreshold && 
    !config.forceProcess
  ) {
    const extension = source.name.split('.').pop()?.toLowerCase() || 'jpg';
    return {
      blob: source,
      format: extension,
      originalSize,
      processedSize: source.size,
      skippedCompression: true,
    };
  }

  const img = await loadImage(source);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Calculate dimensions preserving aspect ratio, capped at maxDimension
  let width = img.width;
  let height = img.height;
  
  if (width > config.maxDimension || height > config.maxDimension) {
    if (width > height) {
      height = Math.round((height * config.maxDimension) / width);
      width = config.maxDimension;
    } else {
      width = Math.round((width * config.maxDimension) / height);
      height = config.maxDimension;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Draw image at full canvas size (no padding)
  ctx.drawImage(img, 0, 0, width, height);
  
  // Try WebP first, fall back to JPEG
  const webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  const format = webpSupported && config.outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
  const extension = format === 'image/webp' ? 'webp' : 'jpg';
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({
            blob,
            format: extension,
            originalSize,
            processedSize: blob.size,
            skippedCompression: false,
          });
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      format,
      config.quality
    );
  });
};

/**
 * Process and crop image to standard dimensions with custom crop area
 */
export const cropAndProcessImage = async (
  source: string | File,
  cropArea: { x: number; y: number; width: number; height: number },
  options: {
    maxDimension?: number;
    quality?: number;
    outputFormat?: 'webp' | 'jpeg';
  } = {}
): Promise<{ blob: Blob; format: string }> => {
  const config = {
    maxDimension: options.maxDimension || CATALOG_IMAGE_CONFIG.maxDimension,
    quality: options.quality || CATALOG_IMAGE_CONFIG.quality,
    outputFormat: options.outputFormat || 'webp',
  };
  const img = await loadImage(source);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Calculate output dimensions preserving crop aspect ratio
  let width = cropArea.width;
  let height = cropArea.height;
  
  if (width > config.maxDimension || height > config.maxDimension) {
    if (width > height) {
      height = Math.round((height * config.maxDimension) / width);
      width = config.maxDimension;
    } else {
      width = Math.round((width * config.maxDimension) / height);
      height = config.maxDimension;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Draw cropped area scaled to fill the canvas
  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  
  const webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  const format = webpSupported && config.outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, format: format === 'image/webp' ? 'webp' : 'jpg' });
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      format,
      config.quality
    );
  });
};

/**
 * Get image dimensions
 */
export const getImageDimensions = async (
  source: string | File
): Promise<{ width: number; height: number }> => {
  const img = await loadImage(source);
  return { width: img.width, height: img.height };
};

/**
 * Check if image meets catalog standards
 */
export const isImageStandardized = async (
  source: string | File
): Promise<boolean> => {
  const { width, height } = await getImageDimensions(source);
  return width <= CATALOG_IMAGE_CONFIG.maxDimension && height <= CATALOG_IMAGE_CONFIG.maxDimension;
};

/**
 * Convert blob to base64 data URL
 */
export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert data URL to blob
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

/**
 * Compress image to WebP format for optimal file size
 * Falls back to JPEG if WebP is not supported
 */
export const compressToWebP = async (
  source: string | File,
  quality: number = 0.85
): Promise<{ blob: Blob; format: string }> => {
  const img = await loadImage(source);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Keep original dimensions but cap at 2000px
  const maxDimension = 2000;
  let width = img.width;
  let height = img.height;
  
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  
  // Try WebP first
  const webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  const format = webpSupported ? 'image/webp' : 'image/jpeg';
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, format: webpSupported ? 'webp' : 'jpeg' });
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      format,
      quality
    );
  });
};

/**
 * Auto-detect category from filename prefix
 */
export const detectCategoryFromFilename = (filename: string): string | null => {
  const lowerName = filename.toLowerCase();
  
  // English prefixes (case-insensitive)
  const englishCategoryMap: Record<string, string> = {
    'ring_': 'טבעות',
    'ring-': 'טבעות',
    'earring_': 'עגילים',
    'earring-': 'עגילים',
    'earrings_': 'עגילים',
    'earrings-': 'עגילים',
    'bracelet_': 'צמידים',
    'bracelet-': 'צמידים',
    'pendant_': 'תליונים',
    'pendant-': 'תליונים',
    'necklace_': 'שרשראות',
    'necklace-': 'שרשראות',
    'chain_': 'שרשראות',
    'chain-': 'שרשראות',
  };
  
  // Hebrew prefixes (original case for Hebrew)
  const hebrewCategoryMap: Record<string, string> = {
    'טבעת_': 'טבעות',
    'טבעת-': 'טבעות',
    'טבעת ': 'טבעות',
    'עגיל_': 'עגילים',
    'עגיל-': 'עגילים',
    'עגיל ': 'עגילים',
    'עגילים_': 'עגילים',
    'עגילים-': 'עגילים',
    'עגילים ': 'עגילים',
    'צמיד_': 'צמידים',
    'צמיד-': 'צמידים',
    'צמיד ': 'צמידים',
    'תליון_': 'תליונים',
    'תליון-': 'תליונים',
    'תליון ': 'תליונים',
    'שרשרת_': 'שרשראות',
    'שרשרת-': 'שרשראות',
    'שרשרת ': 'שרשראות',
  };
  
  // Check English prefixes (case-insensitive)
  for (const [prefix, category] of Object.entries(englishCategoryMap)) {
    if (lowerName.startsWith(prefix)) {
      return category;
    }
  }
  
  // Check Hebrew prefixes (original filename for Hebrew characters)
  for (const [prefix, category] of Object.entries(hebrewCategoryMap)) {
    if (filename.startsWith(prefix)) {
      return category;
    }
  }
  
  return null;
};

/**
 * Generate product name from filename
 */
export const generateProductNameFromFilename = (filename: string): string => {
  // Remove extension
  let name = filename.replace(/\.[^/.]+$/, '');
  
  // English prefixes (case-insensitive check)
  const englishPrefixes = [
    'ring_', 'ring-', 
    'earring_', 'earring-', 'earrings_', 'earrings-',
    'bracelet_', 'bracelet-', 
    'pendant_', 'pendant-', 
    'necklace_', 'necklace-', 
    'chain_', 'chain-'
  ];
  
  // Hebrew prefixes
  const hebrewPrefixes = [
    'טבעת_', 'טבעת-', 'טבעת ', 
    'עגיל_', 'עגיל-', 'עגיל ', 
    'עגילים_', 'עגילים-', 'עגילים ',
    'צמיד_', 'צמיד-', 'צמיד ',
    'תליון_', 'תליון-', 'תליון ',
    'שרשרת_', 'שרשרת-', 'שרשרת '
  ];
  
  // Remove English prefixes (case-insensitive)
  for (const prefix of englishPrefixes) {
    if (name.toLowerCase().startsWith(prefix)) {
      name = name.substring(prefix.length);
      break;
    }
  }
  
  // Remove Hebrew prefixes
  for (const prefix of hebrewPrefixes) {
    if (name.startsWith(prefix)) {
      name = name.substring(prefix.length);
      break;
    }
  }
  
  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]/g, ' ');
  
  // Capitalize first letter of each word (for English text)
  name = name.replace(/\b\w/g, (c) => c.toUpperCase());
  
  return name.trim() || 'מוצר חדש';
};

/**
 * Extract product identifier (SKU) from filename for grouping files
 * Supports various formats:
 * - "RING-001-front.jpg" -> "RING-001"
 * - "R001_main.jpg" -> "R001"
 * - "SKU-BR-456-1.jpg" -> "BR-456"
 * - "טבעת-יהלום-001-v2.jpg" -> "טבעת-יהלום-001"
 */
export const extractProductIdentifier = (filename: string): string => {
  // Remove extension
  let name = filename.replace(/\.[^/.]+$/, '');
  
  // Remove common suffixes like front, back, main, side, etc.
  name = name.replace(/[-_](front|back|main|side|detail|close|zoom|alt|thumb|preview)$/i, '');
  
  // Remove version suffixes like -v2, _v3, -2, _3
  name = name.replace(/[-_](v?\d+)$/i, '');
  
  // Remove trailing numbers that indicate image sequence (like -02, _03)
  // But keep numbers that are part of the product name (like -001)
  name = name.replace(/[-_](\d{1,2})$/i, '');
  
  // Normalize to lowercase for comparison
  return name.toLowerCase().trim();
};

/**
 * Extract potential SKU from filename
 * Returns the raw SKU if detected in the filename
 */
export const extractSkuFromFilename = (filename: string): string | null => {
  // Remove extension
  const name = filename.replace(/\.[^/.]+$/, '');
  
  // Common SKU patterns:
  // 1. "SKU-XXX-123" or "sku_XXX-123"
  const skuPrefixMatch = name.match(/(?:sku|מקט)[-_]?([A-Za-z0-9-]+)/i);
  if (skuPrefixMatch) {
    return skuPrefixMatch[1].toUpperCase();
  }
  
  // 2. Patterns like "R001", "BR-456", "RING-001"
  const skuPatternMatch = name.match(/^([A-Za-z]{1,4}[-_]?\d{2,4})/i);
  if (skuPatternMatch) {
    return skuPatternMatch[1].toUpperCase();
  }
  
  // 3. Pattern at the end like "filename-BR001"
  const endSkuMatch = name.match(/[-_]([A-Za-z]{1,4}\d{2,4})(?:[-_]|$)/i);
  if (endSkuMatch) {
    return endSkuMatch[1].toUpperCase();
  }
  
  return null;
};

/**
 * Check if file is a video based on extension
 */
export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(ext);
};

/**
 * Check if file is an image based on extension
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(ext);
};
