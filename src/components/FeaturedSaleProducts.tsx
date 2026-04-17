import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import { Eye, Loader2, Tag, Percent } from "lucide-react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ProductLightbox from "./ProductLightbox";
import { Badge } from "@/components/ui/badge";
import { type SaleProduct, transformDbProductToSaleProduct } from "@/types";

const FeaturedSaleProducts = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Fetch sale products with images joined inline
  const { data: saleProducts, isLoading } = useQuery({
    queryKey: ["sale-products", getBrandId()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          price,
          original_price,
          sale_price,
          sale_badge_text,
          main_image_url,
          video_url,
          description,
          short_description,
          gold_type,
          stone_type,
          stone_weight,
          categories(name),
          product_stories(content_body),
          product_images(id, image_url, alt_text, display_order, media_type, product_id)
        `)
        .eq("is_active", true)
        .eq("is_on_sale", true)
        .order("display_order", { ascending: true })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  // Transform to component format using joined images
  const products: SaleProduct[] = saleProducts?.map(p => {
    const inlineImages = (p as any).product_images || [];
    return transformDbProductToSaleProduct(p, inlineImages);
  }) || [];

  // Don't render if no sale products
  if (!isLoading && products.length === 0) {
    return null;
  }

  const openLightbox = (product: SaleProduct) => {
    setSelectedProduct({
      ...product,
      price: product.salePrice,
    });
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedProduct(null);
  };

  return (
    <section className="px-4 md:px-8 py-8 md:py-10 lg:py-12 bg-gradient-to-b from-destructive/5 to-background">
      <div className="container-luxury">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-5 w-5 text-destructive" />
              <span className="text-destructive font-medium tracking-wide text-sm">SPECIAL OFFERS</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-light">
              מבצעים מיוחדים
            </h2>
          </div>
          <Link
            to="/catalog?sale=true"
            className="hidden md:inline-flex items-center gap-2 text-foreground hover:text-accent transition-colors link-underline font-medium"
          >
            לכל המבצעים
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="group cursor-pointer animate-fade-in"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transition: 'all 0.4s ease',
                }}
                onClick={() => openLightbox(product)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div 
                  className="relative aspect-square overflow-hidden"
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.4s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                  }}
                >
                    <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    width={800}
                    height={800}
                    aspectRatio="1/1"
                    blurUp
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ borderRadius: '12px' }}
                  />
                  
                  {/* Sale Badge */}
                  <Badge 
                    variant="destructive" 
                    className="absolute top-2 right-2 text-xs font-bold shadow-lg"
                    style={{ borderRadius: '6px' }}
                  >
                    {product.saleBadge}
                  </Badge>

                  {/* Discount Badge */}
                  {product.discountPercent > 0 && (
                    <div 
                      className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 flex items-center gap-1"
                      style={{ borderRadius: '6px' }}
                    >
                      <Percent className="h-3 w-3" />
                      {product.discountPercent}-
                    </div>
                  )}

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
                <div className="p-3">
                  <span className="text-xs text-muted-foreground">
                    {product.category}
                  </span>
                  <h3 className="font-heading text-sm md:text-base font-light mt-1 mb-1 group-hover:text-accent transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-destructive font-bold text-sm">
                      ₪{product.salePrice}
                    </span>
                    <span className="text-muted-foreground line-through text-xs">
                      ₪{product.originalPrice}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link to="/catalog?sale=true" className="btn-secondary inline-block">
            לכל המבצעים
          </Link>
        </div>
      </div>

      {/* Product Lightbox */}
      <ProductLightbox
        product={selectedProduct}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
      />
    </section>
  );
};

export default FeaturedSaleProducts;
