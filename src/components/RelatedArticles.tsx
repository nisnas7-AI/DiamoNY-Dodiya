import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  source: "blog" | "page";
}

const RelatedArticles = () => {
  const [api, setApi] = useState<CarouselApi>();

  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["related-articles-latest-6"],
    queryFn: async (): Promise<ArticleItem[]> => {
      const [blogRes, pagesRes] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("id, title, slug, featured_image_url, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(6),
        supabase
          .from("pages")
          .select("id, slug, seo_title, h1_title, content_blocks, created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const blogItems: ArticleItem[] = (blogRes.data || []).map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        image: p.featured_image_url,
        source: "blog" as const,
      }));

      const pageItems: ArticleItem[] = (pagesRes.data || []).map((p) => {
        const blocks = p.content_blocks as any[] | null;
        const heroBlock = blocks?.find((b: any) => b.type === "hero");
        const imgBlock = blocks?.find((b: any) => b.type === "image_text");
        const image = heroBlock?.data?.image_url || imgBlock?.data?.image_url || null;
        return {
          id: p.id,
          title: p.h1_title || p.seo_title || p.slug,
          slug: p.slug,
          image,
          source: "page" as const,
        };
      });

      return [...blogItems, ...pageItems].slice(0, 6);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Re-init embla when articles data changes
  useEffect(() => {
    if (api && articles.length > 0) {
      // Small delay to let DOM update with new slides
      const timer = setTimeout(() => {
        api.reInit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [api, articles]);

  if (!isLoading && articles.length === 0) return null;

  return (
    <section className="relative py-12 md:py-16 bg-secondary/30" dir="rtl">
      <div className="container-luxury">
        <div className="text-center mb-8 md:mb-10">
          <span className="text-accent font-light text-xs tracking-[0.3em] uppercase mb-2 block">
            DIAMONY JOURNAL
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-light text-foreground tracking-wide">
            מגזין DiamoNY – המדריך המושלם עבורך
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-sm" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
                direction: "rtl",
                slidesToScroll: 1,
              }}
              plugins={[autoplayPlugin.current]}
              className="w-full"
            >
              <CarouselContent className="-mr-4 ml-0">
                {articles.map((article) => {
                  const href =
                    article.source === "blog"
                      ? `/blog/${article.slug}`
                      : `/${article.slug}`;

                  return (
                    <CarouselItem
                      key={article.id}
                      className="pr-4 pl-0 min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3"
                    >
                      <article className="group">
                        <Link to={href} className="block">
                          <div className="overflow-hidden rounded-sm aspect-[4/3] bg-muted">
                            {article.image ? (
                              <img
                                src={article.image}
                                alt={article.title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-sm">
                                DiamoNY
                              </div>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold mt-4 text-foreground group-hover:text-accent transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <span className="inline-block mt-2 text-sm text-accent font-medium border-b border-transparent group-hover:border-accent transition-colors">
                            קרא עוד
                          </span>
                        </Link>
                      </article>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 bg-background/80 backdrop-blur-sm border-border hover:bg-accent hover:text-accent-foreground" />
              <CarouselNext className="hidden md:flex -right-4 bg-background/80 backdrop-blur-sm border-border hover:bg-accent hover:text-accent-foreground" />
            </Carousel>
          </div>
        )}

        {/* Floating "See All" button */}
        <div className="flex justify-center mt-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            לכל המאמרים
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RelatedArticles;
