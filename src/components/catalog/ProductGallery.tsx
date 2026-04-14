import React, { useState, useRef, useEffect, useCallback, TouchEvent } from 'react';
import { Play, Pause } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
}

interface ProductGalleryProps {
  media: MediaItem[];
}

const ProductGallery = ({ media }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Preload all media thumbnails
  useEffect(() => {
    if (media && media.length > 0) {
      media.forEach((item) => {
        if (item.type === 'image') {
          const preloadImg = new Image();
          preloadImg.src = item.url;
        }
        // Also preload thumbnail
        const preloadThumb = new Image();
        preloadThumb.src = item.thumbnail;
      });
    }
  }, [media]);
  
  // Guard against empty media array
  if (!media || media.length === 0) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
        <div className="relative aspect-[4/5] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden flex items-center justify-center bg-muted/30">
          <span className="text-muted-foreground">No media available</span>
        </div>
      </div>
    );
  }
  
  const activeMedia = media[activeIndex];

  const handleMediaClick = () => {
    if (activeMedia?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Smooth transition handler
  const transitionToIndex = useCallback((index: number) => {
    if (index === activeIndex || isTransitioning) return;
    
    // Stop current video if playing
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsPlaying(false);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  }, [activeIndex, isTransitioning, isPlaying]);

  const handleThumbnailClick = (index: number) => {
    transitionToIndex(index);
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
    
    if (isSwipe && media.length > 1) {
      if (distance > 0) {
        // Swipe left - next
        const nextIndex = activeIndex < media.length - 1 ? activeIndex + 1 : 0;
        transitionToIndex(nextIndex);
      } else {
        // Swipe right - previous
        const prevIndex = activeIndex > 0 ? activeIndex - 1 : media.length - 1;
        transitionToIndex(prevIndex);
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* Main Display Area - No zoom, no background visible behind images */}
      <div 
        className="relative aspect-[4/5] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden cursor-default group"
        onClick={handleMediaClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {activeMedia?.type === 'image' ? (
          <img
            src={activeMedia.url}
            alt="Product"
            className={`
              w-full h-full object-cover transition-all duration-300 ease-out
              ${isTransitioning ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'}
            `}
          />
        ) : activeMedia?.type === 'video' ? (
          <div className="relative w-full h-full cursor-pointer">
            <video
              ref={videoRef}
              src={activeMedia.url}
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              loop
              muted
              playsInline
            />
            {/* Play/Pause Overlay Icon - Synced with video state */}
            <div 
              className={`absolute inset-0 flex items-center justify-center transition-colors ${
                isPlaying ? 'bg-transparent' : 'bg-black/5 group-hover:bg-black/10'
              }`}
            >
              <div 
                className={`bg-white/90 p-4 rounded-full shadow-sm transition-opacity ${
                  isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-foreground" />
                ) : (
                  <Play className="w-8 h-8 text-foreground fill-current" />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobile swipe indicator dots */}
      {media.length > 1 && (
        <div className="flex gap-1.5 justify-center md:hidden">
          {media.map((_, idx) => (
            <div 
              key={idx} 
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${idx === activeIndex 
                  ? 'bg-accent scale-125' 
                  : 'bg-muted-foreground/30'
                }
              `}
            />
          ))}
        </div>
      )}

      {/* Thumbnails Navigation - Desktop */}
      {media.length > 1 && (
        <div className="hidden md:flex gap-3 justify-center">
          {media.map((item, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`
                relative w-20 h-20 rounded-xl overflow-hidden border-2 
                transition-all duration-300 ease-out
                ${activeIndex === index 
                  ? 'border-accent ring-2 ring-accent/40 scale-110 shadow-lg' 
                  : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                }
              `}
            >
              <img 
                src={item.thumbnail} 
                className="w-full h-full object-cover" 
                alt={`Thumbnail ${index + 1}`} 
              />
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="w-4 h-4 text-white fill-current" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
