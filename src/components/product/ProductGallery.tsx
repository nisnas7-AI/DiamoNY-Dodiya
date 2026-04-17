import { useState, useRef, useCallback, TouchEvent, MouseEvent } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronRight, ChevronLeft, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WishlistHeart from "@/components/catalog/WishlistHeart";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { type MetalType, METAL_CONFIGS } from "@/components/catalog/MetalSelector";
import { generateProductImageAlt, generateThumbnailAlt, generateVideoThumbnailAlt } from "@/lib/imageAltUtils";
import { type ProductImage } from "@/types";

interface VideoData {
  embedUrl: string;
  type: "youtube" | "vimeo" | "direct";
}

interface ProductGalleryProps {
  productId: string;
  productName: string;
  images: ProductImage[];
  videoData: VideoData | null;
  selectedMetal: MetalType;
  hasVariants: boolean;
  showRoseGoldNotice: boolean;
  onRequestVaultLogin: () => void;
}

const ProductGallery = ({
  productId,
  productName,
  images,
  videoData,
  selectedMetal,
  hasVariants,
  showRoseGoldNotice,
  onRequestVaultLogin,
}: ProductGalleryProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleImageMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  }, [isMobile]);

  const handleImageMouseEnter = useCallback(() => { if (!isMobile) setIsZooming(true); }, [isMobile]);
  const handleImageMouseLeave = useCallback(() => { setIsZooming(false); setZoomPos({ x: 50, y: 50 }); }, []);

  const displayedIndex = hoveredIndex !== null ? hoveredIndex : activeImageIndex;
  const currentImage = images[displayedIndex];

  const changeImage = useCallback(
    (newIndex: number) => {
      if (newIndex === activeImageIndex || isTransitioning) return;
      setIsTransitioning(true);
      setPreviousIndex(activeImageIndex);
      setHoveredIndex(null);
      setTimeout(() => {
        setActiveImageIndex(newIndex);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    },
    [activeImageIndex, isTransitioning]
  );

  const goToPrevious = useCallback(() => {
    changeImage(activeImageIndex === 0 ? images.length - 1 : activeImageIndex - 1);
  }, [activeImageIndex, images.length, changeImage]);

  const goToNext = useCallback(() => {
    changeImage(activeImageIndex === images.length - 1 ? 0 : activeImageIndex + 1);
  }, [activeImageIndex, images.length, changeImage]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || showVideo) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) > 50) distance > 0 ? goToNext() : goToPrevious();
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleGalleryKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") { goToNext(); e.preventDefault(); }
      if (e.key === "ArrowRight") { goToPrevious(); e.preventDefault(); }
    },
    [goToNext, goToPrevious]
  );

  // Reset when images change (metal switch, product switch)
  // Parent should key this component on product id + metal

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div
        className={`
          relative rounded-[20px] bg-background overflow-hidden p-8
          shadow-[0_20px_40px_rgba(0,0,0,0.08),0_10px_20px_rgba(0,0,0,0.05)]
          transition-all duration-500 ease-luxury
          hover:shadow-[0_35px_70px_rgba(0,0,0,0.12),0_15px_30px_rgba(0,0,0,0.08)]
          hover:-translate-y-2
        `}
      >
        <div className="absolute top-4 left-4 z-20">
          <WishlistHeart productId={productId} onRequestVaultLogin={onRequestVaultLogin} />
        </div>

        <div
          ref={imageContainerRef}
          className="relative h-[50vh] lg:h-[60vh] flex items-center justify-center overflow-hidden rounded-[20px]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleGalleryKeyDown}
          tabIndex={0}
          role="region"
          aria-label="גלריית תמונות המוצר"
          aria-roledescription="גלריית תמונות"
        >
          {showVideo && videoData ? (
            <div className="w-full h-full bg-background flex items-center justify-center">
              {videoData.type === "direct" ? (
                <video src={videoData.embedUrl} autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-contain bg-background" />
              ) : (
                <iframe
                  src={`${videoData.embedUrl}?autoplay=1&mute=1&loop=1&controls=0`}
                  className="w-full h-full bg-background"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`סרטון: ${productName}`}
                />
              )}
            </div>
          ) : (
            <>
              {images[previousIndex]?.mediaType !== "video" && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-500 ease-out"
                  style={{
                    backgroundImage: `url(${images[previousIndex]?.url})`,
                    opacity: isTransitioning ? 1 : 0,
                    transform: isTransitioning ? "scale(1.05)" : "scale(1)",
                  }}
                  aria-hidden="true"
                />
              )}

              {showRoseGoldNotice && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="bg-background/95 backdrop-blur-sm px-6 py-4 rounded-xl border shadow-lg text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 border-2 border-primary/50" style={{ background: METAL_CONFIGS.rose.gradient }} />
                    <p className="text-lg font-medium text-foreground mb-1">זהב אדום זמין בהזמנה</p>
                    <p className="text-sm text-muted-foreground">צרו קשר לפרטים נוספים</p>
                  </div>
                </div>
              )}

              {currentImage?.mediaType === "video" ? (
                <div className="w-full h-full bg-background flex items-center justify-center">
                  {currentImage.url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                    <video key={`video-${displayedIndex}-${selectedMetal}`} src={currentImage.url} autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-contain bg-background" />
                  ) : (
                    <iframe
                      key={`iframe-${displayedIndex}-${selectedMetal}`}
                      src={`${currentImage.url}?autoplay=1&mute=1&loop=1&controls=0`}
                      className="w-full h-full bg-background"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`סרטון: ${productName}`}
                    />
                  )}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${displayedIndex}-${selectedMetal}`}
                    className="w-full h-full cursor-zoom-in"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: showRoseGoldNotice ? 0.3 : 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
                    onMouseMove={handleImageMouseMove}
                    onMouseEnter={handleImageMouseEnter}
                    onMouseLeave={handleImageMouseLeave}
                  >
                    <OptimizedImage
                      src={currentImage?.url || "/placeholder.svg"}
                      alt={generateProductImageAlt(productName, displayedIndex, images.length, hasVariants ? METAL_CONFIGS[selectedMetal].label : undefined)}
                      width={1600}
                      height={1600}
                      priority={displayedIndex === 0}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="w-full h-full object-contain select-none transition-transform duration-300 ease-out"
                      style={isZooming ? { transform: "scale(1.8)", transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                    />
                  </motion.div>
                </AnimatePresence>
              )}
            </>
          )}

          {!showVideo && images.length > 1 && (
            <>
              <button onClick={goToPrevious} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all" aria-label="תמונה קודמת">
                <ChevronRight className="h-5 w-5" />
              </button>
              <button onClick={goToNext} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all" aria-label="תמונה הבאה">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {(images.length > 1 || videoData) && (
        <div className="flex justify-center gap-2 overflow-x-auto p-2" role="tablist" aria-label="תמונות ממוזערות">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => { setShowVideo(false); changeImage(index); }}
              onMouseEnter={() => { setShowVideo(false); setHoveredIndex(index !== displayedIndex ? index : null); }}
              onMouseLeave={() => setHoveredIndex(null)}
              role="tab"
              aria-selected={!showVideo && displayedIndex === index}
              aria-label={image.mediaType === "video" ? generateVideoThumbnailAlt(productName) : generateThumbnailAlt(productName, index)}
              className={`
                relative flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden
                transition-all duration-200 ease-out border-2
                ${image.mediaType === "video" ? "bg-muted" : ""}
                ${!showVideo && displayedIndex === index ? "border-accent ring-2 ring-accent/30 scale-105 shadow-md" : "border-transparent opacity-75 hover:opacity-100 hover:scale-103"}
              `}
            >
              {image.mediaType === "video" ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-accent/80 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white fill-current" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 left-0 right-0 text-[10px] text-white text-center">וידאו</span>
                </>
              ) : (
                <OptimizedImage src={image.url} alt={generateThumbnailAlt(productName, index)} width={80} height={80} className="w-full h-full object-cover transition-opacity duration-300" />
              )}
            </button>
          ))}

          {videoData && !images.some((img) => img.mediaType === "video") && (
            <button
              onClick={() => setShowVideo(true)}
              role="tab"
              aria-selected={showVideo}
              aria-label={generateVideoThumbnailAlt(productName)}
              className={`
                relative flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden
                transition-all duration-200 ease-out border-2 bg-muted
                ${showVideo ? "border-accent ring-2 ring-accent/30 scale-105 shadow-md" : "border-transparent opacity-75 hover:opacity-100 hover:scale-103"}
              `}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-accent/80 flex items-center justify-center">
                  <Play className="h-4 w-4 text-white fill-current" />
                </div>
              </div>
              <span className="absolute bottom-1 left-0 right-0 text-[10px] text-white text-center">וידאו</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
