import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import RelatedArticles from "@/components/RelatedArticles";
import ProductCard from "@/components/catalog/ProductCard";
import ProductCardSkeleton from "@/components/catalog/ProductCardSkeleton";
import { type Product, transformDbProductToProduct } from "@/types";
import { useBrandSettings } from "@/contexts/BrandSettingsContext";

/** Configuration for each specialized category page */
export interface SpecializedCategoryConfig {
  /** React Query key */
  queryKey: string;
  /** DB boolean field to filter on (e.g. 'is_engagement_ring') */
  filterField: string;
  /** Optional: require a specific category slug via compound query */
  categorySlug?: string;
  /** Hebrew page title */
  title: string;
  /** English label for hero badge */
  titleEn: string;
  /** Hebrew subtitle */
  subtitle: string;
  /** Meta description */
  metaDescription: string;
  /** SEO title suffix */
  seoTitle: string;
  /** Canonical path (e.g. /category/engagement-rings) */
  canonicalPath: string;
  /** Breadcrumb items before the final one */
  breadcrumbs: { label: string; href: string }[];
  /** Show related articles section */
  showRelatedArticles?: boolean;
}

interface Props {
  config: SpecializedCategoryConfig;
}

const SpecializedCategoryPage = ({ config }: Props) => {
  const brand = useBrandSettings();

  // For compound queries (e.g., pearl necklaces need category + trait)
  const { data: resolvedCategoryId } = useQuery({
    queryKey: [`${config.queryKey}-category`, getBrandId(), config.categorySlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", config.categorySlug!)
        .single();
      return data?.id || null;
    },
    enabled: !!config.categorySlug,
    staleTime: 1000 * 60 * 30,
  });

  const needsCategory = !!config.categorySlug;
  const categoryReady = !needsCategory || !!resolvedCategoryId;

  const { data: products = [], isLoading } = useQuery({
    queryKey: [config.queryKey, getBrandId(), resolvedCategoryId],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from("products")
        .select("*, product_images(*)") as any;
      
      query = query
        .eq("is_active", true)
        .eq(config.filterField, true)
        .order("display_order", { ascending: true });

      if (resolvedCategoryId) {
        query = query.eq("category_id", resolvedCategoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((p: any) => transformDbProductToProduct(p, p.product_images));
    },
    enabled: categoryReady,
  });

  const siteUrl = brand.site_url;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "דף הבית", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "קולקציות", item: `${siteUrl}/catalog` },
      ...config.breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 3,
        name: b.label,
        item: `${siteUrl}${b.href}`,
      })),
      { "@type": "ListItem", position: config.breadcrumbs.length + 3, name: config.title },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.title,
    description: config.subtitle,
    url: `${siteUrl}${config.canonicalPath}`,
    numberOfItems: products.length,
    provider: { "@type": "Organization", name: brand.brand_name, url: siteUrl },
  };

  return (
    <>
      <Helmet>
        <title>{`${config.seoTitle} | ${brand.brand_name}`}</title>
        <meta name="description" content={config.metaDescription} />
        <link rel="canonical" href={`${siteUrl}${config.canonicalPath}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="container-luxury page-top-section pb-0">
          <nav aria-label="Breadcrumb" dir="rtl">
            <ol className="flex items-center gap-1.5 text-[13px] font-body text-muted-foreground flex-wrap">
              <li className="flex items-center gap-1.5">
                <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>דף הבית</span>
                </Link>
                <ChevronLeft className="w-3 h-3 text-muted-foreground/60" />
              </li>
              <li className="flex items-center gap-1.5">
                <Link to="/catalog" className="hover:text-foreground transition-colors">קולקציות</Link>
                <ChevronLeft className="w-3 h-3 text-muted-foreground/60" />
              </li>
              {config.breadcrumbs.map((b) => (
                <li key={b.href} className="flex items-center gap-1.5">
                  <Link to={b.href} className="hover:text-foreground transition-colors">{b.label}</Link>
                  <ChevronLeft className="w-3 h-3 text-muted-foreground/60" />
                </li>
              ))}
              <li>
                <span className="text-foreground font-medium" aria-current="page">{config.title}</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="border-b border-border py-2 md:py-3">
          <div className="container-luxury text-center">
            <span className="text-accent font-light text-xs tracking-[0.3em] uppercase mb-1 block">
              {config.titleEn}
            </span>
            <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-light mb-1 tracking-[0.12em]">
              {config.title}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-xs md:text-sm mb-0">
              {config.subtitle}
            </p>
          </div>
        </section>

        {/* Products */}
        <section className="py-4 md:py-5 lg:py-6">
          <div className="container-luxury px-3 md:px-4 lg:px-6">
            <div className="flex items-center justify-between mb-4" dir="rtl">
              <p className="text-sm text-muted-foreground font-body">
                {isLoading ? "טוען..." : `${products.length} מוצרים ב${config.title}`}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} animationDelay={i * 60} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  הקולקציה מתעדכנת בימים אלו – חזרו בקרוב.
                </p>
              </div>
            )}
          </div>
        </section>

        {config.showRelatedArticles && <RelatedArticles />}
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  );
};

export default SpecializedCategoryPage;
