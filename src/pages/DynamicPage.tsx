import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { DynamicSection } from "@/components/dynamic";
import DynamicJsonLd from "@/components/dynamic/DynamicJsonLd";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ContentBlocks } from "@/components/dynamic/types";

/**
 * Premium skeleton loader for dynamic pages
 */
const PageSkeleton = () => (
  <div className="min-h-screen bg-background" dir="rtl">
    <Header />
    <main className="pt-8 pb-16">
      <Skeleton className="h-[60vh] w-full mb-12" />
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-1/3 mx-auto" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-[4/5] rounded-lg" />
          <div className="space-y-4 py-8">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-32 mt-6" />
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

/**
 * Elegant 404 component with brand styling
 */
const PageNotFound = () => (
  <div className="min-h-screen bg-background" dir="rtl">
    <Header />
    <main className="flex flex-col items-center justify-center py-24 px-4">
      <div className="w-16 h-16 mb-8 text-muted-foreground/30">
        <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
          <path d="M20 4L4 16L20 36L36 16L20 4Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-4 text-center">
        העמוד לא נמצא
      </h1>
      <p className="text-muted-foreground text-lg mb-8 text-center max-w-md">
        מצטערים, העמוד שחיפשת אינו קיים או שהוסר מהאתר.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לדף הבית
      </Link>
    </main>
    <Footer />
  </div>
);

/**
 * Error state component for network failures
 */
const ErrorState = () => (
  <div className="min-h-screen bg-background" dir="rtl">
    <Header />
    <main className="flex flex-col items-center justify-center py-24 px-4">
      <RefreshCw className="w-12 h-12 mb-6 text-muted-foreground/50" />
      <h1 className="font-heading text-2xl md:text-3xl font-light text-foreground mb-4 text-center">
        שגיאה בטעינת העמוד
      </h1>
      <p className="text-muted-foreground text-lg mb-8 text-center max-w-md">
        אירעה שגיאה בטעינת התוכן. אנא נסו שוב מאוחר יותר.
      </p>
      <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        נסה שוב
      </Button>
    </main>
    <Footer />
  </div>
);

/**
 * Dynamic CMS page component — Semantic article wrapper with AEO/GEO JSON-LD
 */
const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["cms-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState />;
  if (!page) return <PageNotFound />;

  const contentBlocks = page.content_blocks as unknown as ContentBlocks | null;
  const firstBlockIsHero = contentBlocks?.blocks?.[0]?.type === "hero";

  const pageTitle = page.seo_title || page.h1_title || "";
  const fullTitle = pageTitle ? `${pageTitle}` : "";

  return (
    <>
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={page.meta_description || ""} />
        <link rel="canonical" href={`https://diamony.me/page/${page.slug}`} />
        <meta property="og:title" content={page.seo_title || page.h1_title || ""} />
        <meta property="og:description" content={page.meta_description || ""} />
        <meta property="og:url" content={`https://diamony.me/page/${page.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="he_IL" />
      </Helmet>

      {/* Dynamic Article + FAQPage JSON-LD */}
      <DynamicJsonLd page={page} contentBlocks={contentBlocks} />

      <div className="min-h-screen bg-background" dir="rtl">
        <Header />

        {/* Semantic article wrapper for GEO/AEO crawlers */}
        <article id="main-content" role="main">
          {/* Strict H1 — always present, sr-only when hero block leads */}
          <h1
            className={
              firstBlockIsHero
                ? "sr-only"
                : "font-heading text-4xl md:text-5xl font-light text-foreground text-center py-12 px-6"
            }
          >
            {page.h1_title || page.seo_title || ""}
          </h1>

          {/* Dynamic content blocks — each wrapped in <section> */}
          <DynamicSection
            blocks={page.content_blocks}
            onValidationError={(errors) => {
              console.error("Content validation failed:", errors);
            }}
          />
        </article>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default DynamicPage;
