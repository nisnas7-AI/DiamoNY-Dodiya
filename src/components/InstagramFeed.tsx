import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Instagram } from "lucide-react";
import { useInView } from "react-intersection-observer";

interface InstagramPost {
  id: string;
  image_url: string;
  permalink: string;
  caption?: string;
}

interface InstagramConfig {
  username: string;
  access_token: string;
  posts: InstagramPost[];
}

const InstagramFeed = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px",
  });

  const { data: instagramSettings, isLoading } = useQuery({
    queryKey: ["instagram-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_settings_public")
        .select("*")
        .eq("platform", "instagram")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: inView,
  });

  const isEnabled = instagramSettings?.is_enabled;
  const config = instagramSettings?.config as unknown as InstagramConfig | undefined;
  const posts = config?.posts || [];
  const username = config?.username || "";

  // Don't render if disabled or no posts
  if (!isEnabled || posts.length === 0) {
    return <div ref={ref} />;
  }

  // Show max 6 posts
  const displayPosts = posts.slice(0, 6);

  return (
    <section ref={ref} className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Instagram className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-2xl md:text-3xl font-light text-foreground">
              עקבו אחרינו באינסטגרם
            </h2>
          </div>
          {username && (
            <a
              href={`https://instagram.com/${username.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
              dir="ltr"
            >
              {username.startsWith("@") ? username : `@${username}`}
            </a>
          )}
        </div>

        {/* Posts Grid - Lazy loaded */}
        {inView && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
            {displayPosts.map((post, index) => (
              <a
                key={post.id || index}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-sm group"
              >
                <img
                  src={post.image_url}
                  alt={post.caption || `Instagram post ${index + 1}`}
                  width={300}
                  height={300}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Instagram className="h-8 w-8 text-white" />
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Follow CTA */}
        {username && (
          <div className="text-center mt-8">
            <a
              href={`https://instagram.com/${username.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Instagram className="h-5 w-5" />
              עקבו אחרינו
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default InstagramFeed;
