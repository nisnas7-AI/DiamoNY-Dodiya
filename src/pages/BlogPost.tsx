import { useQuery } from "@tanstack/react-query";
import { SITE_URL } from "@/lib/siteConfig";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import GoldBuyingBanner from "@/components/GoldBuyingBanner";
import DesignAppointmentBanner from "@/components/DesignAppointmentBanner";
import { BlogArticleTemplate } from "@/components/blog/BlogArticleTemplate";
import { BlogStickySidebar } from "@/components/blog/BlogStickySidebar";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, content, excerpt, featured_image_url, featured_media_type, is_published, published_at, meta_title, meta_description, created_at, updated_at, author_id, custom_json_ld, faq_data")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen" dir="rtl">
        <Header />
        <main className="py-16 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-4xl font-light text-foreground mb-4">המאמר לא נמצא</h1>
            <Link to="/blog" className="inline-flex items-center gap-2 text-accent font-medium">
              <ArrowRight className="h-4 w-4" />
              חזרה לבלוג
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} | DiamoNY</title>
        <meta name="description" content={post.meta_description || post.excerpt || post.content?.substring(0, 160)} />
        <link rel="canonical" href={`${SITE_URL}/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt || ""} />
        {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
        <meta property="og:url" content={`${SITE_URL}/blog/${post.slug}`} />
        <meta property="og:site_name" content="DiamoNY" />
        <meta property="og:locale" content="he_IL" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.meta_title || post.title} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt || ""} />
        {post.featured_image_url && <meta name="twitter:image" content={post.featured_image_url} />}
        <meta property="article:published_time" content={post.published_at || post.created_at} />
        <meta property="article:modified_time" content={post.updated_at} />
        <meta property="article:author" content="ניצן יעקובי" />
      </Helmet>

      <div className="min-h-screen bg-background" dir="rtl">
        <Header />

        <main className="pt-2 pb-10 md:pt-4 md:pb-16">
          <div className="container mx-auto px-4 flex gap-10">
            {/* Main article area */}
            <div className="flex-1 min-w-0">
              <BlogArticleTemplate post={post} />
            </div>

            {/* Desktop sticky sidebar */}
            <BlogStickySidebar />
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

export default BlogPost;
