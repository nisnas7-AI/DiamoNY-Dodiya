import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Youtube, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";

interface YouTubeConfig {
  channel_url: string;
  featured_video_id: string;
  video_ids: string[];
}

const YouTubeSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px",
  });

  const { data: youtubeSettings } = useQuery({
    queryKey: ["youtube-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_settings_public")
        .select("*")
        .eq("platform", "youtube")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: inView,
  });

  const isEnabled = youtubeSettings?.is_enabled;
  const config = youtubeSettings?.config as unknown as YouTubeConfig | undefined;
  const featuredVideoId = config?.featured_video_id || "";
  const videoIds = config?.video_ids || [];
  const channelUrl = config?.channel_url || "";

  // Extract video ID from URL if needed
  const extractVideoId = (input: string) => {
    if (!input) return "";
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = input.match(regex);
    return match ? match[1] : input;
  };

  const cleanFeaturedId = extractVideoId(featuredVideoId);

  // Don't render if disabled or no featured video
  if (!isEnabled || !cleanFeaturedId) {
    return <div ref={ref} />;
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % videoIds.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + videoIds.length) % videoIds.length);
  };

  return (
    <section ref={ref} className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Youtube className="h-6 w-6 text-red-600" />
            <h2 className="font-heading text-2xl md:text-3xl font-light text-foreground">
              צפו בעולם של DiamoNY
            </h2>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            צפו בסרטונים על תהליכי יצירה, הסברים על יהלומים וטיפים לבחירת התכשיט המושלם
          </p>
        </div>

        {/* Featured Video - Lazy loaded */}
        {inView && cleanFeaturedId && (
          <div className="max-w-4xl mx-auto mb-10">
            <div className="relative aspect-video rounded-sm overflow-hidden shadow-xl">
              <iframe
                src={`https://www.youtube.com/embed/${cleanFeaturedId}?rel=0&modestbranding=1`}
                title="Featured Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Video Slider */}
        {videoIds.length > 0 && inView && (
          <div className="relative max-w-5xl mx-auto">
            <h3 className="text-lg font-medium text-center mb-6 text-foreground">
              סרטונים נוספים
            </h3>
            
            <div className="relative">
              {/* Navigation Arrows */}
              {videoIds.length > 3 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4 bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-4 bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Videos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-8">
                {videoIds.slice(currentSlide, currentSlide + 3).map((videoId, index) => {
                  const cleanId = extractVideoId(videoId);
                  return (
                    <a
                      key={cleanId + index}
                      href={`https://youtube.com/watch?v=${cleanId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-video rounded-sm overflow-hidden group shadow-md hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`}
                        alt={`Video ${index + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Dots Indicator */}
            {videoIds.length > 3 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.ceil(videoIds.length / 3) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index * 3)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      Math.floor(currentSlide / 3) === index
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscribe CTA */}
        {channelUrl && (
          <div className="text-center mt-10">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Youtube className="h-5 w-5" />
              הירשמו לערוץ
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default YouTubeSection;
