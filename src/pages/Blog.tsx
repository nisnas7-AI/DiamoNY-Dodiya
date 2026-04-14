import { useQuery } from "@tanstack/react-query";
import { SITE_URL } from "@/lib/siteConfig";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import GoldBuyingBanner from "@/components/GoldBuyingBanner";
import DesignAppointmentBanner from "@/components/DesignAppointmentBanner";
import { BlogMagazineGrid } from "@/components/blog/BlogMagazineGrid";

const Blog = () => {
  // Fetch blog posts
  const { data: blogPosts, isLoading: blogLoading } = useQuery({
    queryKey: ["published-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch published dynamic pages (articles)
  const { data: dynamicPages, isLoading: pagesLoading } = useQuery({
    queryKey: ["published-dynamic-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("is_published", true);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = blogLoading || pagesLoading;

  // Merge blog posts and dynamic pages into a unified feed
  const posts = (() => {
    const blogItems = (blogPosts || []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content,
      excerpt: p.excerpt,
      featured_image_url: p.featured_image_url,
      featured_media_type: p.featured_media_type,
      is_published: p.is_published,
      published_at: p.published_at,
      created_at: p.created_at,
      source: "blog" as const,
    }));

    const pageItems = (dynamicPages || []).map((p) => ({
      id: p.id,
      title: p.h1_title || p.seo_title || p.slug,
      slug: p.slug,
      content: null as string | null,
      excerpt: p.meta_description,
      featured_image_url: null as string | null,
      featured_media_type: "image" as string | null,
      is_published: p.is_published,
      published_at: p.updated_at,
      created_at: p.created_at,
      source: "page" as const,
    }));

    return [...blogItems, ...pageItems].sort((a, b) => {
      const da = new Date(a.published_at || a.created_at).getTime();
      const db = new Date(b.published_at || b.created_at).getTime();
      return db - da;
    });
  })();

  // JSON-LD for Blog listing page
  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "בלוג DiamoNY - מדריכים לתכשיטים ויהלומים",
    "description": "מדריכים מקצועיים על יהלומים, זהב, טבעות אירוסין ותכשיטים. טיפים לבחירת תכשיטים וידע מקצועי.",
    "url": `${SITE_URL}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": "DiamoNY",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/diamony-logo-email.png`
      }
    },
    "blogPost": posts.slice(0, 10).map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "url": post.source === "page" ? `${SITE_URL}/${post.slug}` : `${SITE_URL}/blog/${post.slug}`,
      "datePublished": post.published_at || post.created_at,
      "image": post.featured_image_url
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "בית",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "בלוג",
        "item": `${SITE_URL}/blog`
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>בלוג תכשיטים | DiamoNY - מדריכים וטיפים מקצועיים</title>
        <meta
          name="description"
          content="בלוג DiamoNY - מדריכים מקצועיים על יהלומים, זהב, טבעות אירוסין ותכשיטים. טיפים לבחירת תכשיטים, טרנדים וידע מקצועי מצורף."
        />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="בלוג תכשיטים | DiamoNY" />
        <meta property="og:description" content="מדריכים מקצועיים על יהלומים, זהב ותכשיטים" />
        <meta property="og:url" content={`${SITE_URL}/blog`} />
        <meta property="og:site_name" content="DiamoNY" />
        <meta property="og:locale" content="he_IL" />
        
        {/* JSON-LD Schemas */}
        <script type="application/ld+json">
          {JSON.stringify(blogListSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background" dir="rtl">
        <Header />

        <main className="py-10 md:py-14">
          <div className="container-luxury">
            {/* Premium Header */}
            <header className="text-center mb-10 md:mb-14">
              <span className="text-accent font-light text-sm tracking-[0.3em] uppercase mb-2 block">
                DIAMONY JOURNAL
              </span>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-4">
                מגזין התכשיטים
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                מדריכים מקצועיים, טיפים מומחים וסיפורי השראה מעולם היהלומים והזהב
              </p>
            </header>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-xl mb-2">אין מאמרים להצגה כרגע</p>
                <p className="text-sm">בקרוב נוסיף תוכן חדש ומרתק</p>
              </div>
            ) : (
              <BlogMagazineGrid posts={posts} />
            )}
          </div>
        </main>

        <Footer />
        <WhatsAppButton />
        <GoldBuyingBanner />
        <DesignAppointmentBanner />
      </div>
    </>
  );
};

export default Blog;
