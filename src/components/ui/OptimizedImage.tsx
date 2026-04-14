// @stable — do not modify without architectural review
import { useState, useCallback, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const SUPABASE_STORAGE_MARKER = "/storage/v1/object/public/";

/**
 * Return a clean Supabase Storage URL (strip any malformed query params).
 * For non-storage sources, returns the URL as-is.
 */
export const getOptimizedUrl = (url: string): string => {
  if (!url) return url;
  if (url.includes(SUPABASE_STORAGE_MARKER)) {
    return url.split("?")[0];
  }
  return url;
};

export interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> {
  /** Original image URL (Supabase Storage or external) */
  src: string;
  /** Alt text – required for a11y */
  alt: string;
  /** Explicit intrinsic width for CLS prevention */
  width?: number;
  /** Explicit intrinsic height for CLS prevention */
  height?: number;
  /** CSS aspect-ratio shorthand, e.g. "1/1" or "4/5" */
  aspectRatio?: string;
  /** Mark as LCP hero image — sets eager + high priority */
  priority?: boolean;
  /** @deprecated No-op, kept for backward compatibility */
  blurUp?: boolean;
  /** Optional sizes hint for responsive selection */
  sizes?: string;
  /** Fallback when image fails */
  fallback?: string;
}

/**
 * OptimizedImage
 *
 * A drop-in image component implementing:
 * - Clean Supabase Storage URLs (no broken transforms)
 * - Native lazy loading with fetchpriority support
 * - CLS prevention via explicit width/height or aspect-ratio
 * - Elegant brand-aligned fallback on error
 */
const OptimizedImage = ({
  src,
  alt,
  width = 800,
  height,
  aspectRatio,
  priority = false,
  blurUp: _blurUp,
  sizes,
  fallback = "/placeholder.svg",
  className,
  style,
  ...rest
}: OptimizedImageProps) => {
  const [error, setError] = useState(false);

  const handleError = useCallback(() => setError(true), []);

  const isSupabase = src?.includes(SUPABASE_STORAGE_MARKER);
  const displaySrc = error
    ? fallback
    : isSupabase
      ? getOptimizedUrl(src)
      : src;

  const imgStyle: React.CSSProperties = {
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style,
  };

  // Elegant fallback when image fails to load
  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/60",
          className,
        )}
        style={{
          ...(aspectRatio ? { aspectRatio } : {}),
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : (width ? `${width}px` : undefined),
          maxWidth: '100%',
          ...style,
        }}
        role="img"
        aria-label={alt}
      >
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-[10px] tracking-widest uppercase font-body">DiamoNY</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      sizes={sizes ?? "(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"}
      alt={alt}
      width={width}
      height={height ?? width}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      onError={handleError}
      draggable={false}
      className={cn(
        "transition-opacity duration-500 ease-out",
        className,
      )}
      style={imgStyle}
      {...rest}
    />
  );
};

export default OptimizedImage;
