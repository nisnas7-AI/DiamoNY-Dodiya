import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import { useState, useEffect } from "react";

const DEFAULT_LOGO_IMAGE = "/lovable-uploads/diamony-hero-logo.png";

type Position = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

type VideoFormat = '1:1' | '16:9' | '9:16' | 'custom';

interface HeroMetadata {
  video_size?: number;
  video_position?: Position;
  video_format?: VideoFormat;
  video_custom_width?: number;
  video_custom_height?: number;
  overlay_image_url?: string | null;
  overlay_position?: Position;
  overlay_size?: number;
  logo_url?: string | null;
  show_logo?: boolean;
  video_loop?: boolean;
  video_playback_speed?: number;
  video_overlay_opacity?: number;
  video_poster_image?: string | null;
}

const getPositionClasses = (position: Position): string => {
  const positionMap: Record<Position, string> = {
    'top-left': 'items-start justify-end',
    'top-center': 'items-start justify-center',
    'top-right': 'items-start justify-start',
    'center-left': 'items-center justify-end',
    'center': 'items-center justify-center',
    'center-right': 'items-center justify-start',
    'bottom-left': 'items-end justify-end',
    'bottom-center': 'items-end justify-center',
    'bottom-right': 'items-end justify-start',
  };
  return positionMap[position] || positionMap['center'];
};

const getAspectRatioStyles = (format: VideoFormat, size: number, customWidth?: number, customHeight?: number) => {
  switch (format) {
    case '1:1':
      return {
        height: `${size}vh`,
        width: `${size}vh`,
        maxHeight: `${size * 8}px`,
        maxWidth: `${size * 8}px`,
      };
    case '16:9':
      return {
        height: `${size}vh`,
        width: `${size * (16/9)}vh`,
        maxHeight: `${size * 8}px`,
        maxWidth: `${size * (16/9) * 8}px`,
      };
    case '9:16':
      return {
        height: `${size}vh`,
        width: `${size * (9/16)}vh`,
        maxHeight: `${size * 8}px`,
        maxWidth: `${size * (9/16) * 8}px`,
      };
    case 'custom':
      return {
        width: `${customWidth || 50}vw`,
        height: `${customHeight || 50}vh`,
        maxWidth: '90vw',
        maxHeight: '90vh',
      };
    default:
      return {
        height: `${size}vh`,
        width: `${size}vh`,
        maxHeight: `${size * 8}px`,
        maxWidth: `${size * 8}px`,
      };
  }
};

// Luxury Shimmer Bar Component
const ShimmerBar = ({ width, delay = 0 }: { width: string; delay?: number }) => (
  <div 
    className="h-3 rounded-full overflow-hidden"
    style={{ 
      width,
      animationDelay: `${delay}ms`,
      background: 'linear-gradient(90deg, hsl(45 10% 85%) 0%, hsl(45 15% 92%) 50%, hsl(45 10% 85%) 100%)',
    }}
  >
    <div 
      className="h-full w-full animate-shimmer"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, hsl(45 20% 96% / 0.8) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animationDelay: `${delay}ms`,
      }}
    />
  </div>
);

// Diamond Pulse Component - glowing circle
const DiamondPulse = () => (
  <div className="relative flex items-center justify-center">
    {/* Outer glow rings */}
    <div 
      className="absolute w-24 h-24 rounded-full animate-ping opacity-20"
      style={{
        background: 'radial-gradient(circle, hsl(45 30% 90%) 0%, transparent 70%)',
        animationDuration: '2s',
      }}
    />
    <div 
      className="absolute w-20 h-20 rounded-full animate-ping opacity-30"
      style={{
        background: 'radial-gradient(circle, hsl(45 25% 88%) 0%, transparent 70%)',
        animationDuration: '2s',
        animationDelay: '0.3s',
      }}
    />
    {/* Core diamond pulse */}
    <div 
      className="relative w-12 h-12 rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(45 40% 95%) 0%, hsl(45 20% 85%) 100%)',
        boxShadow: '0 0 30px hsl(45 30% 90% / 0.6), 0 0 60px hsl(45 20% 85% / 0.3)',
        animation: 'diamondPulse 2s ease-in-out infinite',
      }}
    />
  </div>
);

// Luxury Skeleton Loader Component
const HeroSkeleton = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    {/* Metallic gradient background */}
    <div 
      className="absolute inset-0 z-10"
      style={{
        background: 'linear-gradient(135deg, hsl(45 10% 92%) 0%, hsl(45 15% 96%) 25%, hsl(45 10% 90%) 50%, hsl(45 15% 95%) 75%, hsl(45 10% 92%) 100%)',
      }}
    >
      {/* Subtle shimmer overlay */}
      <div 
        className="absolute inset-0 animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(45 30% 98% / 0.4) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
    
    {/* Video placeholder with aspect ratio preservation */}
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 md:p-8">
      <div 
        className="relative rounded-2xl overflow-hidden"
        style={{
          height: '85vh',
          width: '85vh',
          maxHeight: '680px',
          maxWidth: '680px',
          background: 'linear-gradient(135deg, hsl(45 8% 88%) 0%, hsl(45 12% 92%) 100%)',
          boxShadow: '0 25px 50px -12px hsl(0 0% 0% / 0.1)',
        }}
      >
        <div 
          className="absolute inset-0 animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, hsl(45 20% 96% / 0.5) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </div>

    {/* Centered Diamond Pulse */}
    <div className="relative z-30 flex flex-col items-center justify-center gap-8 pt-4 md:pt-6 lg:pt-8">
      <DiamondPulse />
      
      {/* Text shimmer bars - matching headline position */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <ShimmerBar width="280px" delay={0} />
        <ShimmerBar width="220px" delay={100} />
        <ShimmerBar width="180px" delay={200} />
      </div>
    </div>

  </section>
);

const Hero = () => {
  const [isContentReady, setIsContentReady] = useState(false);
  
  const { data: heroSection, isLoading, isError, error } = useQuery({
    queryKey: ["homepage-hero", getBrandId()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .eq("key", "hero")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Trigger content ready state after data loads for smooth transition
  useEffect(() => {
    if (!isLoading) {
      // Resolve skeleton even when query fails to avoid permanent loading state.
      const timer = setTimeout(() => {
        setIsContentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isError) {
      console.error("Failed to load homepage hero section", error);
    }
  }, [isError, error]);

  // Show skeleton during loading
  if (isLoading || !isContentReady) {
    return <HeroSkeleton />;
  }

  // Background image from CMS only - no hardcoded fallback
  const backgroundImage = heroSection?.image_url || null;
  const videoUrl = heroSection?.video_url;
  const metadata = heroSection?.metadata as HeroMetadata | null;
  
  // Video settings
  const videoSize = metadata?.video_size || 85;
  const videoPosition = metadata?.video_position || 'center';
  const videoFormat = metadata?.video_format || '1:1';
  const videoCustomWidth = metadata?.video_custom_width || 50;
  const videoCustomHeight = metadata?.video_custom_height || 50;
  const videoLoop = metadata?.video_loop ?? true;
  const videoPlaybackSpeed = metadata?.video_playback_speed ?? 1;
  const videoOverlayOpacity = metadata?.video_overlay_opacity ?? 0;
  const videoPosterImage = metadata?.video_poster_image || null;
  
  // Overlay settings
  const overlayImageUrl = metadata?.overlay_image_url;
  const overlayPosition = metadata?.overlay_position || 'center';
  const overlaySize = metadata?.overlay_size || 30;
  
  // Logo settings - evaluated server-side condition (no flicker)
  const logoUrl = metadata?.logo_url ?? DEFAULT_LOGO_IMAGE;
  const showLogo = metadata?.show_logo ?? true;

  const videoStyles = getAspectRatioStyles(videoFormat, videoSize, videoCustomWidth, videoCustomHeight);
  const videoPositionClasses = getPositionClasses(videoPosition);
  const overlayPositionClasses = getPositionClasses(overlayPosition);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Layer 1 (z-10): Background Image - CMS controlled, with fade-in */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 z-10 animate-fade-in"
          style={{ 
            animationDuration: '0.5s',
            animationTimingFunction: 'ease-in-out',
          }}
        >
          <img 
            alt="צורפות עילית" 
            className="w-full h-full object-cover brightness-100" 
            src={backgroundImage}
            width={1920}
            height={1080}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      )}

      {/* Layer 1.5 (z-15): Overlay Image with fade-in */}
      {overlayImageUrl && (
        <div 
          className={`absolute inset-0 z-[15] flex ${overlayPositionClasses} p-4 md:p-8 animate-fade-in`}
          style={{ 
            animationDuration: '0.5s',
            animationTimingFunction: 'ease-in-out',
            animationDelay: '0.1s',
            animationFillMode: 'both',
          }}
        >
          <img 
            src={overlayImageUrl}
            alt="Overlay"
            width={800}
            height={800}
            className="object-contain drop-shadow-xl"
            loading="lazy"
            style={{ 
              width: `${overlaySize}vw`,
              maxWidth: '80vw',
              maxHeight: '70vh'
            }}
          />
        </div>
      )}

      {/* Layer 2 (z-20): Video with poster image, overlay, and fade-in */}
      {videoUrl && (
        <div 
          className={`absolute inset-0 z-20 flex ${videoPositionClasses} p-4 md:p-8 animate-fade-in`}
          style={{ 
            animationDuration: '0.5s',
            animationTimingFunction: 'ease-in-out',
            animationDelay: '0.15s',
            animationFillMode: 'both',
          }}
        >
          <div 
            className="relative rounded-2xl shadow-2xl overflow-hidden"
            style={videoStyles}
          >
            {/* Video poster image loads instantly to prevent white gap */}
            {videoPosterImage && (
              <img 
                src={videoPosterImage}
                alt="Video poster"
                width={1080}
                height={1080}
                className="absolute inset-0 w-full h-full object-cover z-0"
                loading="eager"
              />
            )}
            <video 
              autoPlay 
              loop={videoLoop}
              muted 
              playsInline
              preload="auto"
              className="w-full h-full object-cover relative z-10"
              poster={videoPosterImage || undefined}
              ref={(el) => {
                if (el && videoPlaybackSpeed !== 1) {
                  el.playbackRate = videoPlaybackSpeed;
                }
              }}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            {/* Video overlay for opacity control */}
            {videoOverlayOpacity > 0 && (
              <div 
                className="absolute inset-0 z-20 bg-black pointer-events-none"
                style={{ opacity: videoOverlayOpacity }}
              />
            )}
          </div>
        </div>
      )}

      {/* Layer 3 (z-30): Transparent Logo with fade-in - Only render if show_logo is true */}
      {showLogo && logoUrl && (
        <div 
          className="relative z-30 flex items-center justify-center pt-4 md:pt-6 lg:pt-8 animate-fade-in"
          style={{ 
            animationDuration: '0.5s',
            animationTimingFunction: 'ease-in-out',
            animationDelay: '0.2s',
            animationFillMode: 'both',
          }}
        >
          <img 
            src={logoUrl}
            alt="DiamoNY - צורפות עילית בעיצוב אישי"
            width={575}
            height={1150}
            className="h-[800px] md:h-[980px] lg:h-[1150px] max-h-[80vh] w-auto drop-shadow-2xl"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      )}
      {/* SEO: single H1 for homepage – visually hidden, crawlable */}
      <h1 className="sr-only">DiamoNY - סטודיו לצורפות עילית ועיצוב תכשיטים</h1>
    </section>
  );
};

export default Hero;
