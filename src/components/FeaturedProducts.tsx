import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Lazy fallback images — only resolved if DB returns zero products
const fallbackImageUrl = "/placeholder.svg";
import { Eye } from "lucide-react";
import { useSectionSettings } from "@/hooks/useSectionSettings";
import { sanitizeHtml } from "@/lib/sanitize";
import { Skeleton } from "@/components/ui/skeleton";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { type Product, type ProductImage, transformDbProductToProduct } from "@/types";

import OptimizedImage from "@/components/ui/OptimizedImage";

// Fallback static products (use placeholder — real data comes from DB)
const staticProducts: Product[] = [
  {
    id: "1",
    name: "טבעת סוליטר קלאסית",
    slug: "classic-solitaire-ring",
    price: "12,500",
    image: fallbackImageUrl,
    category: "טבעות",
    description: "טבעת סוליטר קלאסית בעיצוב נצחי, משובצת יהלום מרכזי באיכות גבוהה.",
    goldType: "זהב לבן 18K",
    stoneType: "יהלום",
    stoneWeight: "0.50 קראט",
    images: [
      { url: fallbackImageUrl, alt: "טבעת סוליטר - תצוגה קדמית" },
    ],
    isDiamondJewelry: true,
  },
  {
    id: "2",
    name: "עגילי יהלום סטאד",
    slug: "diamond-stud-earrings",
    price: "8,900",
    image: fallbackImageUrl,
    category: "עגילים",
    description: "עגילי סטאד קלאסיים עם יהלומים נוצצים.",
    goldType: "זהב צהוב 14K",
    stoneType: "יהלום",
    stoneWeight: "0.30 קראט כ\"א",
    images: [{ url: fallbackImageUrl, alt: "עגילי יהלום" }],
    isDiamondJewelry: true,
  },
  {
    id: "3",
    name: "שרשרת יהלום עדינה",
    slug: "delicate-diamond-necklace",
    price: "4,200",
    image: fallbackImageUrl,
    category: "תליונים",
    description: "שרשרת עדינה עם תליון יהלום קטן ומנצנץ.",
    goldType: "זהב רוזגולד 14K",
    stoneType: "יהלום",
    stoneWeight: "0.15 קראט",
    images: [{ url: fallbackImageUrl, alt: "שרשרת יהלום" }],
    isDiamondJewelry: true,
  },
  {
    id: "4",
    name: "טבעת איטרניטי",
    slug: "eternity-ring",
    price: "15,800",
    image: fallbackImageUrl,
    category: "טבעות",
    description: "טבעת איטרניטי מלאה עם יהלומים מסביב.",
    goldType: "זהב לבן 18K",
    stoneType: "יהלום",
    stoneWeight: "1.20 קראט סה\"כ",
    images: [{ url: fallbackImageUrl, alt: "טבעת איטרניטי" }],
    isDiamondJewelry: true,
  },
];

const FeaturedProducts = () => {
  // Fetch section settings from database

  // Fetch section settings from database
  const { data: settings } = useSectionSettings("featured_products");
  const sectionContent = (settings as any)?.content || {};

  // Single joined query — eliminates the N+1 waterfall between products and images
  const { data: dbProducts, isLoading } = useQuery({
    queryKey: ["featured-products-joined"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          sku,
          price,
          price_from,
          price_to,
          main_image_url,
          video_url,
          description,
          short_description,
          gold_type,
          stone_type,
          stone_weight,
          is_featured,
          is_diamond_jewelry,
          categories(name),
          product_stories(content_body),
          product_images(id, image_url, alt_text, display_order, media_type)
        `)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  // Transform joined payload — product_images are already embedded, no second round-trip needed
  const transformedProducts: Product[] = dbProducts?.map(p => {
    // Normalise the joined images into the shape transformDbProductToProduct expects
    const joinedImages = (p.product_images as any[] | null)
      ?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map(img => ({
        product_id: p.id,
        image_url: img.image_url,
        alt_text: img.alt_text,
        display_order: img.display_order,
        media_type: img.media_type,
      })) ?? [];

    return transformDbProductToProduct(p, joinedImages, fallbackImageUrl);
  }) || [];

  // Use DB products if available, otherwise use static fallback
  const products = transformedProducts.length > 0 ? transformedProducts : staticProducts;


  // Get titles from settings or use defaults
  const title = (settings as any)?.title || "מוצרים נבחרים";
  const subtitle = (settings as any)?.subtitle || "Ready to Wear";
  const description = sectionContent?.description || "";
  const ctaText = sectionContent?.cta_text || "לכל הקולקציה";
  const ctaUrl = sectionContent?.cta_url || "/catalog";

  return (
    <section 
      id="products" 
      className="px-4 md:px-8 featured-products-section"
      style={{
        backgroundColor: '#121212',
        paddingTop: '80px',
        paddingBottom: '80px',
      }}
    >
      <div className="container-luxury">
        {/* Tight heading-to-content spacing */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 
              className="font-heading text-3xl md:text-4xl font-semibold mb-1"
              style={{ color: '#D4AF37' }}
            >
              {title}
            </h2>
            <p 
              className="tracking-[0.2em] uppercase text-sm mb-0"
              style={{ color: '#FFFFFF' }}
            >
              {subtitle}
            </p>
            {description && description.includes('<') && (
              <div 
                className="mt-2 text-sm max-w-xl"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
              />
            )}
          </div>
          <Link
            to={ctaUrl}
            className="hidden md:inline-flex items-center gap-2 transition-colors link-underline font-medium"
            style={{ color: '#FFFFFF' }}
          >
            {ctaText}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 justify-items-center product-grid-stable">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="product-card-skeleton w-full">
                {/* Image skeleton matching FeaturedProducts card structure */}
                <div className="relative rounded-xl overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                </div>
                {/* Text info */}
                <div className="pt-2.5 px-1 space-y-1">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 justify-items-center">
            {products.map((product, index) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group cursor-pointer animate-fade-in block"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transition: 'all 0.4s ease',
                }}
              >
                <div 
                  className="relative aspect-square overflow-hidden transition-transform duration-300 hover:-translate-y-2"
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(255,255,255,0.05), 0 0 0 1px rgba(212,175,55,0.1)',
                    transition: 'box-shadow 0.4s ease, transform 0.4s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(255,255,255,0.1), 0 0 0 1px rgba(212,175,55,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,255,255,0.05), 0 0 0 1px rgba(212,175,55,0.1)';
                  }}
                >
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    width={800}
                    height={800}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ borderRadius: '12px' }}
                  />
                  {/* Hover Overlay */}
                  <div 
                    className="absolute inset-0 bg-primary/0 group-hover:bg-primary/40 transition-all duration-300 flex items-center justify-center"
                    style={{ borderRadius: '12px' }}
                  >
                    <div className="flex items-center gap-2 text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <Eye className="w-5 h-5" />
                      <span className="font-medium text-sm">צפה בפרטים</span>
                    </div>
                  </div>
                </div>
                {/* Product Info - Tighter spacing */}
                <div className="pt-2.5 px-1">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {product.category}
                  </span>
                  <h3 
                    className="font-heading text-sm md:text-base font-semibold mt-0.5 mb-0.5 transition-colors line-clamp-1 product-title"
                    style={{ color: '#D4AF37' }}
                  >
                    {product.name}
                  </h3>
                  {(product.price || (product.priceFrom && product.priceTo)) && (
                    <div className="mb-0" style={{ color: '#FFFFFF' }}>
                      <PriceDisplay
                        price={product.price}
                        priceFrom={product.priceFrom}
                        priceTo={product.priceTo}
                        isDiamondJewelry={product.isDiamondJewelry}
                        size="sm"
                        colorScheme="light"
                        forcePrefix
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link 
            to={ctaUrl}
            className="inline-block px-6 py-3 rounded-sm font-medium transition-colors"
            style={{ 
              backgroundColor: '#D4AF37', 
              color: '#121212',
            }}
          >
            {ctaText}
          </Link>
        </div>
      </div>

    </section>
  );
};

export default FeaturedProducts;
