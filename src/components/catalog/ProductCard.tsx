import { useState, useEffect, useCallback, useRef, TouchEvent } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PriceDisplay from "@/components/ui/PriceDisplay";
import OptimizedImage, { getOptimizedUrl } from "@/components/ui/OptimizedImage";
import { generateProductImageAlt, generateThumbnailAlt } from "@/lib/imageAltUtils";
import { useVip } from "@/contexts/VipContext";
import { useVipRules } from "@/contexts/VipRulesContext";
import { type Product } from "@/types";
import WishlistHeart from "./WishlistHeart";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  animationDelay?: number;
}

const ProductCard = ({ product, onClick, animationDelay = 0 }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedImage, setDisplayedImage] = useState<string>("");
  const [imageError, setImageError] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const { isVip } = useVip();
  const { getRule } = useVipRules();
  const vipRule = isVip ? getRule(product.id) : undefined;
  
  const isMadeToOrder = product.stockStatus === 'made_to_order' || !product.stockStatus;
  
  // Get all images - main image + gallery images
  const allImages = product.images.length > 0 
    ? product.images 
    : [{ url: product.image, alt: product.name }];
  
  // Thumbnails to show (max 4)
  const thumbnails = allImages.slice(0, 4);
  
  // Current image URL
  const currentImage = allImages[activeImageIndex]?.url || product.image;
  
  // Initialize displayed image
  useEffect(() => {
    if (!displayedImage && currentImage) {
      setDisplayedImage(currentImage);
    }
  }, [currentImage, displayedImage]);

  // Preload gallery images on first hover (not mount) to save bandwidth
  const preloadedRef = useRef(false);
  const preloadGalleryImages = useCallback(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    thumbnails.forEach((img) => {
      const preloadImg = new Image();
      preloadImg.src = img.url;
    });
  }, [thumbnails]);

  // Smooth image transition handler
  const transitionToImage = useCallback((newIndex: number) => {
    if (newIndex === activeImageIndex || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Short fade out
    setTimeout(() => {
      setActiveImageIndex(newIndex);
      setDisplayedImage(allImages[newIndex]?.url || product.image);
      
      // Fade in after image swap
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  }, [activeImageIndex, isTransitioning, allImages, product.image]);

  const getWhatsAppLink = () => {
    const message = encodeURIComponent(
      `היי, אני מעוניין/ת לברר לגבי: ${product.name}`
    );
    return `https://wa.me/972523456789?text=${message}`;
  };

  const handleThumbnailClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    transitionToImage(index);
  };

  const handleThumbnailHover = (index: number) => {
    transitionToImage(index);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smooth reset to first image
    if (activeImageIndex !== 0) {
      transitionToImage(0);
    }
  };

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
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > minSwipeDistance;
    
    if (isSwipe) {
      if (distance > 0) {
        // Swipe left - next image
        const nextIndex = activeImageIndex < allImages.length - 1 ? activeImageIndex + 1 : 0;
        transitionToImage(nextIndex);
      } else {
        // Swipe right - previous image
        const prevIndex = activeImageIndex > 0 ? activeImageIndex - 1 : allImages.length - 1;
        transitionToImage(prevIndex);
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const productUrl = `/product/${product.slug}`;

  return (
    <Link
      to={productUrl}
      className="group cursor-pointer animate-fade-in product-card block"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
      onMouseEnter={() => { setIsHovered(true); preloadGalleryImages(); }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Image Area - Floating Card Style, no background visible */}
      <div className="relative rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-all duration-300 overflow-hidden hover:shadow-[0_15px_50px_rgba(0,0,0,0.08)]">
        {/* Image Container - STRICT 1:1 aspect ratio to prevent CLS, object-cover ensures no letterboxing */}
        <div 
          className="relative aspect-square overflow-hidden rounded-t-2xl cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Primary Image with blur-up LQIP and responsive srcset */}
          <OptimizedImage
            src={displayedImage || currentImage}
            alt={generateProductImageAlt(product.name, activeImageIndex, allImages.length)}
            width={800}
            height={800}
            aspectRatio="1/1"
            blurUp
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`
              w-full h-full object-cover 
              transition-all duration-300 ease-out
              ${isTransitioning ? '!opacity-0 scale-[1.02]' : 'scale-100'}
            `}
          />

          {/* WhatsApp CTA - appears on hover for Made to Order */}
          {isMadeToOrder && (
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-3 left-3 flex items-center gap-2 
                bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-medium 
                hover:bg-green-700 transition-all duration-300 ease-in-out whitespace-nowrap 
                shadow-[0_4px_15px_rgba(0,0,0,0.1)] z-10
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              התאם אישית
            </a>
          )}
          
          {/* VIP Badge */}
          {isVip && vipRule && (
            <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0 rounded-full text-[10px] font-bold z-10 shadow-md">
              VIP
            </Badge>
          )}

          {/* Wishlist Heart */}
          <div className="absolute top-3 left-3 z-10">
            <WishlistHeart
              productId={product.id}
              className="bg-black/30 backdrop-blur-sm hover:bg-black/50"
            />
          </div>
          
          {/* Mobile swipe indicator dots */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
              {allImages.slice(0, 4).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`
                    w-1.5 h-1.5 rounded-full transition-all duration-200
                    ${idx === activeImageIndex 
                      ? 'bg-white scale-125 shadow-sm' 
                      : 'bg-white/50'
                    }
                  `}
                />
              ))}
            </div>
          )}
        </div>

        {/* Micro-Gallery Thumbnails - Desktop only */}
        {thumbnails.length > 1 && (
          <div className="hidden md:flex gap-1.5 p-2 bg-background/80 backdrop-blur-sm rounded-b-2xl">
            {thumbnails.map((image, index) => (
              <button
                key={index}
                onClick={(e) => handleThumbnailClick(e, index)}
                onMouseEnter={() => handleThumbnailHover(index)}
                className={`
                  relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0
                  border-2 transition-all duration-200 ease-out
                  ${activeImageIndex === index 
                    ? 'border-accent ring-2 ring-accent/40 scale-110 shadow-md' 
                    : 'border-transparent hover:border-accent/50 hover:scale-105'
                  }
                `}
              >
                <OptimizedImage
                  src={image.url}
                  alt={generateThumbnailAlt(product.name, index)}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Made to Order Badge - Gold palette */}
      {isMadeToOrder && (
        <div className="flex justify-center -mt-3 relative z-10">
          <Badge 
            variant="secondary" 
            className="bg-accent text-white text-[9px] font-medium tracking-widest uppercase px-4 py-1 shadow-md border-0"
          >
            Made to Order
          </Badge>
        </div>
      )}

      {/* Product Info - Premium typography */}
      <div className="pt-3 pb-1.5 space-y-0.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block font-body font-medium">
          {product.category}
        </span>
        <h3 className="font-heading text-base md:text-lg font-semibold group-hover:text-accent transition-colors line-clamp-2 tracking-wide text-foreground mb-0">
          {product.name}
        </h3>
        {(product.price || (product.priceFrom && product.priceTo)) && (
          <div className="pt-0.5 mb-0">
            {isVip && vipRule && vipRule.discount_percentage > 0 && product.price ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground line-through text-xs">
                  ₪{product.price}
                </span>
                <span className="text-accent font-bold">
                  ₪{Math.round(Number(product.price.replace(/,/g, '')) * (1 - Number(vipRule.discount_percentage) / 100)).toLocaleString("he-IL")}
                </span>
              </div>
            ) : (
              <PriceDisplay
                price={product.price}
                priceFrom={product.priceFrom}
                priceTo={product.priceTo}
                isDiamondJewelry={product.isDiamondJewelry}
                size="md"
                forcePrefix
              />
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
