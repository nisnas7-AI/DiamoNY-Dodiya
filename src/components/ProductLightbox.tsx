import { useState, useEffect, useRef, useCallback, TouchEvent } from "react";
import { X, ChevronRight, ChevronLeft, MessageCircle, Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import MetalSelector, { type MetalType, METAL_CONFIGS } from "@/components/catalog/MetalSelector";
import { useProductVariants } from "@/hooks/useProductVariants";
import { generateProductImageAlt, generateThumbnailAlt, generateVideoThumbnailAlt } from "@/lib/imageAltUtils";
import { type ProductImage, type StockStatus } from "@/types";

// Extended product interface for lightbox (includes display-specific fields)
interface ProductDetails {
  id: string | number;
  name: string;
  price?: string;
  priceFrom?: string;
  priceTo?: string;
  category?: string;
  description?: string;
  shortDescription?: string;
  fullDescription?: string;
  goldType?: string;
  stoneType?: string;
  stoneWeight?: string;
  images: ProductImage[];
  videoUrl?: string;
  mtoStory?: string;
  stockStatus?: StockStatus;
  isDiamondJewelry?: boolean;
  sku?: string;
}

interface ProductLightboxProps {
  product: ProductDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper to convert YouTube/Vimeo URLs to embed URLs
const getEmbedUrl = (url: string): { embedUrl: string; type: 'youtube' | 'vimeo' | 'direct' } | null => {
  if (!url) return null;
  
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`, type: 'youtube' };
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, type: 'vimeo' };
  }
  
  // Direct video link
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return { embedUrl: url, type: 'direct' };
  }
  
  return null;
};

const ProductLightbox = ({ product, isOpen, onClose }: ProductLightboxProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState<MetalType>('yellow');
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Fetch product variants
  const productId = product?.id ? String(product.id) : null;
  const { 
    variants, 
    getImagesForMetal, 
    getVideosForMetal,
    hasImagesForMetal,
    getVariantByMetal,
    getVideoForMetal,
    hasVideoForMetal,
    isLoading: variantsLoading 
  } = useProductVariants(productId);

  // Determine if variants are enabled
  const hasVariants = variants.length > 0;

  // Get images based on selected metal variant (including gallery videos with media_type)
  const getDisplayImages = (): ProductImage[] => {
    if (!product) return [];
    
    if (hasVariants && hasImagesForMetal(selectedMetal)) {
      // Get variant-specific images
      const images = getImagesForMetal(selectedMetal).map(vi => ({
        url: vi.image_url,
        alt: vi.alt_text || `${product.name} - ${METAL_CONFIGS[selectedMetal].label}`,
        mediaType: 'image' as const,
      }));
      
      // Add variant-specific gallery videos
      const videos = getVideosForMetal(selectedMetal).map(vi => ({
        url: vi.image_url,
        alt: vi.alt_text || `וידאו - ${product.name}`,
        mediaType: 'video' as const,
      }));
      
      return [...images, ...videos];
    }
    
    // Fall back to default product images
    return product.images.length > 0 
      ? product.images.map(img => ({ ...img, mediaType: 'image' }))
      : [{ url: "", alt: product.name, mediaType: 'image' }];
  };

  // Get video URL based on selected metal variant (with fallback to main product video)
  const getDisplayVideoUrl = (): string | undefined => {
    if (!product) return undefined;
    
    // First check if the selected metal variant has a video
    if (hasVariants && hasVideoForMetal(selectedMetal)) {
      return getVideoForMetal(selectedMetal) || undefined;
    }
    
    // Fall back to main product video
    return product.videoUrl;
  };

  const images = getDisplayImages();
  const currentVideoUrl = getDisplayVideoUrl();
  const hasVideo = !!currentVideoUrl;
  const displayedIndex = hoveredIndex !== null ? hoveredIndex : activeImageIndex;
  
  // Check if rose gold has no images (show notice)
  const showRoseGoldNotice = hasVariants && selectedMetal === 'rose' && !hasImagesForMetal('rose');

  // Get current variant SKU
  const currentVariant = getVariantByMetal(selectedMetal);
  const displaySku = hasVariants && currentVariant?.sku ? currentVariant.sku : product?.sku;

  // All useCallback hooks MUST be before any conditional returns
  const changeImage = useCallback((newIndex: number) => {
    if (newIndex === activeImageIndex || isTransitioning) return;
    setIsTransitioning(true);
    setPreviousIndex(activeImageIndex);
    setHoveredIndex(null);
    setTimeout(() => {
      setActiveImageIndex(newIndex);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  }, [activeImageIndex, isTransitioning]);

  const handleThumbnailHover = useCallback((index: number) => {
    if (index !== displayedIndex) {
      setHoveredIndex(index);
    }
  }, [displayedIndex]);

  const handleThumbnailLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const goToPrevious = useCallback(() => {
    const newIndex = activeImageIndex === 0 ? images.length - 1 : activeImageIndex - 1;
    changeImage(newIndex);
  }, [activeImageIndex, images.length, changeImage]);

  const goToNext = useCallback(() => {
    const newIndex = activeImageIndex === images.length - 1 ? 0 : activeImageIndex + 1;
    changeImage(newIndex);
  }, [activeImageIndex, images.length, changeImage]);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setPreviousIndex(0);
      setHoveredIndex(null);
      setShowVideo(false);
      // Default to yellow gold or detect from product's gold_type
      if (product.goldType) {
        const goldTypeLower = product.goldType.toLowerCase();
        if (goldTypeLower.includes('לבן') || goldTypeLower.includes('white')) {
          setSelectedMetal('white');
        } else if (goldTypeLower.includes('רוז') || goldTypeLower.includes('rose')) {
          setSelectedMetal('rose');
        } else {
          setSelectedMetal('yellow');
        }
      } else {
        setSelectedMetal('yellow');
      }
    }
  }, [product?.id]);

  // Preload all gallery images for instant switching
  useEffect(() => {
    if (product && product.images.length > 0) {
      product.images.forEach((img) => {
        const preloadImg = new Image();
        preloadImg.src = img.url;
      });
    }
  }, [product]);

  // Early return AFTER all hooks
  if (!product) return null;

  const currentImage = images[displayedIndex];
  const videoData = currentVideoUrl ? getEmbedUrl(currentVideoUrl) : null;

  // Mobile swipe handlers
  const minSwipeDistance = 50;

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || showVideo) return;
    
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > minSwipeDistance;
    
    if (isSwipe) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const priceDisplay = product.priceFrom && product.priceTo 
    ? `₪${product.priceFrom} - ₪${product.priceTo}`
    : product.price 
      ? `₪${product.price}` 
      : null;

  const specs = [
    { label: "סוג זהב", value: product.goldType },
    { label: "סוג אבן", value: product.stoneType },
    { label: "משקל אבן", value: product.stoneWeight ? `החל מ- ${product.stoneWeight}` : undefined },
  ].filter(spec => spec.value);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background">
        <VisuallyHidden>
          <DialogTitle>{product.name}</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image/Video Section - Floating Card Style, no background visible */}
          <div className="relative m-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Main Media Area - Flexible height, object-cover ensures no letterboxing */}
            <div 
              ref={imageContainerRef}
              className="relative min-h-[300px] max-h-[70vh] flex items-center justify-center overflow-hidden rounded-t-2xl cursor-default"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {showVideo && videoData ? (
                // Video Player
                <div className="w-full h-full bg-black flex items-center justify-center">
                  {videoData.type === 'direct' ? (
                    <video
                      src={videoData.embedUrl}
                      controls
                      autoPlay
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  ) : (
                    <iframe
                      src={videoData.embedUrl}
                      className="w-full aspect-video max-h-[70vh]"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : (
                <>
                  {/* Background image for smooth transition */}
                  {images[previousIndex]?.mediaType !== 'video' && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500 ease-out"
                      style={{ 
                        backgroundImage: `url(${images[previousIndex]?.url})`,
                        opacity: isTransitioning ? 1 : 0,
                        transform: isTransitioning ? 'scale(1.05)' : 'scale(1)',
                      }}
                    />
                  )}
                  
                  {/* Rose Gold Notice Overlay */}
                  {showRoseGoldNotice && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="bg-background/95 backdrop-blur-sm px-6 py-4 rounded-xl border shadow-lg text-center">
                        <div 
                          className="w-12 h-12 rounded-full mx-auto mb-3 border-2 border-primary/50"
                          style={{ background: METAL_CONFIGS.rose.gradient }}
                        />
                        <p className="text-lg font-medium text-foreground mb-1">זהב אדום זמין בהזמנה</p>
                        <p className="text-sm text-muted-foreground">צרו קשר לפרטים נוספים</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Main media - check mediaType for video or image */}
                  {currentImage?.mediaType === 'video' ? (
                    // Inline video from gallery
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      {currentImage.url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                        <video
                          key={`video-${displayedIndex}-${selectedMetal}`}
                          src={currentImage.url}
                          controls
                          className={`
                            max-w-full max-h-[70vh] object-contain 
                            transition-all duration-500 ease-out
                            ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                          `}
                        />
                      ) : (
                        <iframe
                          key={`iframe-${displayedIndex}-${selectedMetal}`}
                          src={getEmbedUrl(currentImage.url)?.embedUrl || currentImage.url}
                          className="w-full aspect-video max-h-[70vh]"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </div>
                  ) : (
                    // Main image
                    <img
                      key={`${displayedIndex}-${selectedMetal}`}
                      src={currentImage?.url || ""}
                      alt={generateProductImageAlt(
                        product.name,
                        displayedIndex,
                        images.length,
                        hasVariants ? METAL_CONFIGS[selectedMetal].label : undefined
                      )}
                      className={`
                        max-w-full max-h-[70vh] object-contain 
                        transition-all duration-500 ease-out
                        ${isTransitioning 
                          ? 'opacity-0 scale-95' 
                          : showRoseGoldNotice 
                            ? 'opacity-30 scale-100'
                            : 'opacity-100 scale-100'
                        }
                      `}
                    />
                  )}
                </>
              )}
              
              {/* Navigation Arrows - only show when not in video mode */}
              {!showVideo && images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:scale-110 transition-all duration-200"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:scale-110 transition-all duration-200"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery - Rounded bottom, subtle background */}
            {(images.length > 1 || videoData) && (
              <div className="p-4 flex gap-2 overflow-x-auto bg-background/80 backdrop-blur-sm rounded-b-2xl">
                {/* Image/Video thumbnails from gallery */}
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setShowVideo(false);
                      changeImage(index);
                    }}
                    onMouseEnter={() => {
                      setShowVideo(false);
                      handleThumbnailHover(index);
                    }}
                    onMouseLeave={handleThumbnailLeave}
                    className={`
                      relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden
                      transition-all duration-300 ease-out border-2
                      ${image.mediaType === 'video' ? 'bg-black' : ''}
                      ${!showVideo && displayedIndex === index 
                        ? 'border-accent ring-2 ring-accent/40 scale-110 shadow-lg' 
                        : 'border-transparent hover:border-accent/50 hover:scale-105'
                      }
                    `}
                  >
                    {image.mediaType === 'video' ? (
                      // Video thumbnail
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-accent/80 flex items-center justify-center">
                            <Play className="h-4 w-4 text-white fill-current" />
                          </div>
                        </div>
                        <span className="absolute bottom-1 left-0 right-0 text-[10px] text-white text-center">וידאו</span>
                      </>
                    ) : (
                      // Image thumbnail
                      <img
                        src={image.url}
                        alt={generateThumbnailAlt(product.name, index)}
                        className="w-full h-full object-cover transition-transform duration-300"
                      />
                    )}
                  </button>
                ))}
                
                {/* External Video thumbnail (from variant video_url or product videoUrl) */}
                {videoData && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={`
                      relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden
                      transition-all duration-300 ease-out border-2 bg-black
                      ${showVideo 
                        ? 'border-accent ring-2 ring-accent/30 scale-110 shadow-lg' 
                        : 'border-transparent hover:border-accent/50 hover:scale-105'
                      }
                    `}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <Play className="h-4 w-4 text-white fill-current" />
                      </div>
                    </div>
                    <span className="absolute bottom-1 left-0 right-0 text-[10px] text-white text-center">וידאו</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 md:p-8 flex flex-col">
            {/* Category Badge */}
            {product.category && (
              <Badge variant="secondary" className="w-fit mb-3">
                {product.category}
              </Badge>
            )}

            {/* Product Name */}
            <h2 className="font-heading text-2xl md:text-3xl font-medium mb-4">
              {product.name}
            </h2>

            {/* Price */}
            {priceDisplay && (
              <p className="text-xl md:text-2xl text-accent font-medium mb-4">
                {((product as any).isDiamondJewelry || product.stoneWeight) && (
                  <span className="text-muted-foreground font-normal text-base mr-2">החל מ-</span>
                )}
                {priceDisplay}
              </p>
            )}

            {/* Metal Selector - Premium UI */}
            {hasVariants && (
              <div className="mb-6 pb-6 border-b">
                <MetalSelector
                  variants={variants.map(v => ({
                    id: v.id,
                    variant_value: v.variant_value as MetalType,
                    sku: v.sku || undefined,
                    is_available: v.is_available,
                    has_images: hasImagesForMetal(v.variant_value as MetalType),
                  }))}
                  selectedMetal={selectedMetal}
                  onSelect={(metal) => {
                    setSelectedMetal(metal);
                    setActiveImageIndex(0);
                    setPreviousIndex(0);
                  }}
                  showLabels={true}
                />
              </div>
            )}

            {/* Description - Short description with Read More popover */}
            {(product.shortDescription || product.fullDescription || product.description) && (
              <div className="mb-6">
                {/* Display short description or fallback to full description (truncated) */}
                <p className="text-muted-foreground leading-relaxed" style={{ lineHeight: '1.6' }}>
                  {(product.shortDescription || product.fullDescription || product.description || '')
                    .replace(/\{\{product_name\}\}/g, product.name)}
                </p>
                
                {/* Read More - only show if fullDescription exists and differs from shortDescription */}
                {product.fullDescription && 
                 product.fullDescription !== product.shortDescription && 
                 product.fullDescription !== product.description && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-accent text-sm hover:underline mt-2 font-medium">
                        קרא עוד ←
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      side="left" 
                      align="start"
                      sideOffset={8}
                      className="w-80 max-h-72 overflow-y-auto p-0"
                    >
                      <div className="relative p-4">
                        <button 
                          className="absolute top-2 left-2 p-1 rounded-full hover:bg-secondary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Close popover by clicking the trigger again
                            const trigger = document.querySelector('[data-state="open"]');
                            if (trigger) (trigger as HTMLElement).click();
                          }}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <p className="text-sm leading-relaxed text-muted-foreground pt-4" style={{ lineHeight: '1.7' }}>
                          {product.fullDescription.replace(/\{\{product_name\}\}/g, product.name)}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            {/* Specifications */}
            {specs.length > 0 && (
              <div className="border-t border-b py-6 mb-6 space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground mb-4">מפרט טכני</h4>
                {specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between">
                    <span className="text-muted-foreground">{spec.label}</span>
                    <span className="font-medium">
                      {spec.label === "סוג זהב" && hasVariants 
                        ? METAL_CONFIGS[selectedMetal].label 
                        : spec.value
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* MTO Story - The Art of Creation */}
            {product.mtoStory && (
              <div className="bg-secondary/20 rounded-lg p-5 mb-6 border border-secondary/30">
                <h4 className="font-heading text-lg mb-3 flex items-center gap-2">
                  <span>✨</span>
                  <span>אמנות היצירה</span>
                </h4>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
                  {product.mtoStory}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto space-y-3">
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={() => {
                  const metalLabel = hasVariants ? ` | ${METAL_CONFIGS[selectedMetal].label}` : '';
                  const skuPart = displaySku ? ` (מק״ט: ${displaySku})` : '';
                  const message = `היי, אשמח לקבל מידע נוסף על: ${product.name}${metalLabel}${skuPart}`;
                  window.open(`https://wa.me/972500000000?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <MessageCircle className="h-5 w-5" />
                שלח הודעה בוואטסאפ
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                כל התכשיטים ניתנים להתאמה אישית
              </p>
              
              {/* SKU Reference - Certificate-style serial number */}
              {displaySku && (
                <p 
                  className="text-center select-all cursor-text pt-2"
                  style={{ 
                    fontSize: '10px',
                    color: '#A0A0A0',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '0.5px'
                  }}
                >
                  מק״ט: {displaySku}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductLightbox;
