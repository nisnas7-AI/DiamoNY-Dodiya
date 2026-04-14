// Advanced media processing pipeline for catalog uniformity
// Supports WebP conversion, 1600x1600 uniform canvas, and video optimization

export const CATALOG_MEDIA_CONFIG = {
  // Image settings - High quality for jewelry details
  imageWidth: 2400,
  imageHeight: 2400,
  imageQuality: 0.95,
  webpQuality: 0.95,
  backgroundColor: 'transparent', // No white padding
  preserveAspectRatio: true, // Keep original aspect ratio
  
  // QUALITY PRESERVATION: Files under this size skip compression
  skipCompressionThreshold: 1.5 * 1024 * 1024, // 1.5MB
  
  // Video settings
  maxVideoSizeMB: 50,
  targetVideoBitrate: 2500, // kbps for 1080p
  supportedVideoFormats: ['video/mp4', 'video/webm', 'video/quicktime'],
  
  // File types
  supportedImageFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
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
    maxDimension: options.maxDimension || CATALOG_MEDIA_CONFIG.imageWidth,
    quality: options.quality || CATALOG_MEDIA_CONFIG.imageQuality,
    outputFormat: options.outputFormat || 'webp',
    forceProcess: options.forceProcess || false,
  };

  const originalSize = source instanceof File ? source.size : 0;
  
  // QUALITY PRESERVATION: Skip compression for files under 1.5MB
  // This maintains 100% diamond clarity and depth
  if (
    source instanceof File && 
    originalSize <= CATALOG_MEDIA_CONFIG.skipCompressionThreshold && 
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
 * Compress image to WebP format for optimal file size (keeps original dimensions)
 */
export const compressToWebP = async (
  source: string | File,
  quality: number = 0.85,
  maxDimension: number = 2000
): Promise<{ blob: Blob; format: string }> => {
  const img = await loadImage(source);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Keep original dimensions but cap at maxDimension
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
 * Process video file - basic validation and optimization hints
 * Note: Full video transcoding requires server-side processing
 */
export const processVideoForCatalog = async (
  file: File
): Promise<{
  file: File;
  isOptimized: boolean;
  needsTranscoding: boolean;
  sizeOk: boolean;
  formatOk: boolean;
}> => {
  const maxSizeBytes = CATALOG_MEDIA_CONFIG.maxVideoSizeMB * 1024 * 1024;
  const sizeOk = file.size <= maxSizeBytes;
  const formatOk = ['video/mp4', 'video/webm'].includes(file.type);
  
  // For now, we can only do basic validation client-side
  // Full transcoding would require FFmpeg.wasm or server-side processing
  return {
    file,
    isOptimized: formatOk && sizeOk,
    needsTranscoding: !formatOk,
    sizeOk,
    formatOk,
  };
};

/**
 * Get video duration and dimensions
 */
export const getVideoMetadata = (file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    
    video.onerror = () => reject(new Error('Failed to load video metadata'));
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Check if file is a video based on extension or MIME type
 */
export const isVideoFile = (file: File | string): boolean => {
  if (typeof file === 'string') {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
    const ext = file.toLowerCase().substring(file.lastIndexOf('.'));
    return videoExtensions.includes(ext);
  }
  return file.type.startsWith('video/');
};

/**
 * Check if file is an image based on extension or MIME type
 */
export const isImageFile = (file: File | string): boolean => {
  if (typeof file === 'string') {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];
    const ext = file.toLowerCase().substring(file.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  }
  return file.type.startsWith('image/');
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate thumbnail from video
 */
export const generateVideoThumbnail = (file: File, seekTime: number = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(seekTime, video.duration / 2);
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        },
        'image/jpeg',
        0.85
      );
    };
    
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
};
