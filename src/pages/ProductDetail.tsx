import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { SITE_URL } from "@/lib/siteConfig";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { trackDwellTime } from "@/lib/analyticsTracker";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductBreadcrumbs from "@/components/ProductBreadcrumbs";
import { Button } from "@/components/ui/button";
import { type MetalType, METAL_CONFIGS } from "@/components/catalog/MetalSelector";
import { useProductVariants } from "@/hooks/useProductVariants";
import { type ProductImage } from "@/types";
import ProductAeoJsonLd from "@/components/ProductAeoJsonLd";
import VaultLoginModal from "@/components/VaultLoginModal";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductActions from "@/components/product/ProductActions";
import DiamondExcellence from "@/components/product/DiamondExcellence";
import FourCsQuickGuide from "@/components/product/FourCsQuickGuide";
import { buildBreadcrumbSchema, buildLocalBusinessSchema } from "@/lib/seoSchemas";

const Testimonials = lazy(() => import("@/components/Testimonials"));

// Helper to convert YouTube/Vimeo URLs to embed URLs
const getEmbedUrl = (url: string) => {
  if (!url) return null;
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) return { embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`, type: "youtube" as const };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, type: "vimeo" as const };
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return { embedUrl: url, type: "direct" as const };
  return null;
};

const ProductDetail = () => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const navigate = useNavigate();
  const [selectedMetal, setSelectedMetal] = useState<MetalType>("yellow");
  const [showVaultLogin, setShowVaultLogin] = useState(false);

  useEffect(() => {
    if (!productSlug) return;
    return trackDwellTime("product_dwell", productSlug);
  }, [productSlug]);

  const { data: productRaw, isLoading, error } = useQuery({
    queryKey: ["product-detail", productSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, categories(id, name, slug), product_stories(id, title, content_body, specs, pull_quote, story_part_1, story_part_2, story_images), product_images(id, image_url, alt_text, display_order, media_type, product_id)`)
        .eq("slug", productSlug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productSlug,
  });

  const product = productRaw ? (() => { const { product_images: _imgs, ...rest } = productRaw as any; return rest; })() : null;
  const productImages = (productRaw as any)?.product_images?.sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)) || [];

  const { variants, getImagesForMetal, getVideosForMetal, hasImagesForMetal, getVariantByMetal, getVideoForMetal, hasVideoForMetal } = useProductVariants(product?.id || null);
  const hasVariants = variants.length > 0;

  const getDisplayImages = useCallback((): ProductImage[] => {
    if (!product) return [];
    if (hasVariants && hasImagesForMetal(selectedMetal)) {
      const images = getImagesForMetal(selectedMetal).map((vi) => ({ url: vi.image_url, alt: vi.alt_text || `${product.name} - ${METAL_CONFIGS[selectedMetal].label}`, mediaType: "image" as const }));
      const videos = getVideosForMetal(selectedMetal).map((vi) => ({ url: vi.image_url, alt: vi.alt_text || `וידאו - ${product.name}`, mediaType: "video" as const }));
      return [...images, ...videos];
    }
    const allImages: ProductImage[] = [];
    if (product.main_image_url) allImages.push({ url: product.main_image_url, alt: product.name, mediaType: "image" });
    productImages?.forEach((img: any) => { if (img.image_url !== product.main_image_url) allImages.push({ url: img.image_url, alt: img.alt_text || product.name, mediaType: img.media_type || "image" }); });
    return allImages.length > 0 ? allImages : [{ url: "/placeholder.svg", alt: product.name, mediaType: "image" }];
  }, [product, productImages, hasVariants, selectedMetal, getImagesForMetal, getVideosForMetal, hasImagesForMetal]);

  const getDisplayVideoUrl = useCallback((): string | undefined => {
    if (!product) return undefined;
    if (hasVariants && hasVideoForMetal(selectedMetal)) return getVideoForMetal(selectedMetal) || undefined;
    return product.video_url || undefined;
  }, [product, hasVariants, selectedMetal, hasVideoForMetal, getVideoForMetal]);

  // Reset metal on product change
  useEffect(() => {
    if (product) {
      window.scrollTo(0, 0);
      if (product.gold_type) {
        const gt = product.gold_type.toLowerCase();
        if (gt.includes("לבן") || gt.includes("white")) setSelectedMetal("white");
        else if (gt.includes("רוז") || gt.includes("rose")) setSelectedMetal("rose");
        else setSelectedMetal("yellow");
      } else setSelectedMetal("yellow");
    }
  }, [product?.id]);

  const images = getDisplayImages();
  const currentVideoUrl = getDisplayVideoUrl();
  const videoData = currentVideoUrl ? getEmbedUrl(currentVideoUrl) : null;
  const showRoseGoldNotice = hasVariants && selectedMetal === "rose" && !hasImagesForMetal("rose");
  const currentVariant = getVariantByMetal(selectedMetal);
  const displaySku = hasVariants && currentVariant?.sku ? currentVariant.sku : product?.sku;

  if (isLoading) {
    return (<><Header /><main className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="טוען מוצר..." /></main><Footer /></>);
  }

  if (error || !product) {
    return (<><Header /><main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"><h1 className="text-2xl font-heading">המוצר לא נמצא</h1><p className="text-muted-foreground">מצטערים, המוצר שחיפשת אינו קיים או שהוסר מהמערכת.</p><Button onClick={() => navigate("/catalog")}>חזרה לקטלוג</Button></main><Footer /></>);
  }

  const category = product.categories as { id: string; name: string; slug: string } | null;
  const productStory = product.product_stories as {
    id: string; title: string; content_body: string | null;
    specs: { label: string; value: string }[] | null;
    pull_quote: string | null;
    story_part_1: string | null; story_part_2: string | null;
    story_images: { url: string; alt_text: string; linked_section: string }[] | null;
  } | null;
  const priceDisplay = product.price_from && product.price_to ? `₪${product.price_from.toLocaleString("he-IL")} - ₪${product.price_to.toLocaleString("he-IL")}` : product.price ? `₪${product.price.toLocaleString("he-IL")}` : null;
  const specs = [
    { label: "סוג זהב", value: product.gold_type },
    { label: "סוג אבן", value: product.stone_type },
    { label: "משקל אבן", value: product.stone_weight ? `החל מ- ${product.stone_weight}` : undefined },
  ].filter((s) => s.value);
  const isMadeToOrder = product.stock_status === "made_to_order" || !product.stock_status;
  const metaDescription = product.short_description || product.description?.slice(0, 155) || `${product.name} - תכשיט יוקרתי בעיצוב אישי מבית DiamoNY`;
  const canonicalUrl = `${SITE_URL}/product/${product.slug}`;

  const siteUrl = SITE_URL;
  const breadcrumbItems = [
    { name: "דף הבית", url: `${siteUrl}/` },
    { name: "קולקציות", url: `${siteUrl}/catalog` },
    ...(category ? [{ name: category.name, url: `${siteUrl}/catalog/${category.slug}` }] : []),
    { name: product.name, url: canonicalUrl },
  ];

  return (
    <>
      <Helmet>
        <title>{product.name} | DiamoNY</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${product.name} | DiamoNY`} />
        <meta property="og:description" content={metaDescription} />
        {product.main_image_url && <meta property="og:image" content={product.main_image_url} />}
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="product" />
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema(breadcrumbItems))}</script>
        <script type="application/ld+json">{JSON.stringify(buildLocalBusinessSchema())}</script>
      </Helmet>

      <ProductAeoJsonLd
        productId={product.id}
        productName={product.name}
        productNameEn={product.name_en}
        productSlug={product.slug}
        mainImageUrl={product.main_image_url}
        price={product.price}
        sku={product.sku}
        categoryName={category?.name}
        stockStatus={product.stock_status}
        description={product.description || product.short_description || metaDescription}
        images={images}
      />

      <Header />

      <main className="min-h-screen bg-background">
        <ProductBreadcrumbs category={category} productName={product.name} />

        <article className="container-luxury pb-16 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-8">
            <div>
              <ProductGallery
                productId={product.id}
                productName={product.name}
                images={images}
                videoData={videoData}
                selectedMetal={selectedMetal}
                hasVariants={hasVariants}
                showRoseGoldNotice={showRoseGoldNotice}
                onRequestVaultLogin={() => setShowVaultLogin(true)}
              />
              <div className="hidden lg:block">
                <FourCsQuickGuide />
              </div>
            </div>

            <div>
              <ProductInfo
                product={product}
                category={category}
                productStory={productStory}
                specs={specs}
                displaySku={displaySku}
                priceDisplay={priceDisplay}
                isMadeToOrder={isMadeToOrder}
                hasVariants={hasVariants}
                variants={variants}
                selectedMetal={selectedMetal}
                onMetalSelect={(metal) => setSelectedMetal(metal)}
                hasImagesForMetal={hasImagesForMetal}
              />

              <ProductActions
                productName={product.name}
                displaySku={displaySku}
                hasVariants={hasVariants}
                selectedMetal={selectedMetal}
                category={category}
              />

              <div className="lg:hidden">
                <FourCsQuickGuide />
              </div>

              <DiamondExcellence productId={product.id} />
            </div>
          </div>
        </article>

        <Suspense fallback={null}>
          <Testimonials />
        </Suspense>
      </main>

      <Footer />
      <WhatsAppButton />
      <VaultLoginModal isOpen={showVaultLogin} onClose={() => setShowVaultLogin(false)} />
    </>
  );
};

export default ProductDetail;
