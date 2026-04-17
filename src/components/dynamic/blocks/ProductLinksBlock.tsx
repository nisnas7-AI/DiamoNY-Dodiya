/* rebuild-trigger-v2 */
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { ProductLinksBlockData } from "../types";

interface ProductLinksBlockProps {
  data: ProductLinksBlockData;
}

/**
 * Product links block with balanced grid and strict aspect ratios.
 */
const ProductLinksBlock = memo(({ data }: ProductLinksBlockProps) => {
  const { title, subtitle, product_ids } = data;

  const { data: products, isLoading } = useQuery({
    queryKey: ["product-links-block", product_ids],
    queryFn: async () => {
      if (!product_ids?.length) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, main_image_url, price, price_from, price_to, is_price_range")
        .in("id", product_ids)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: product_ids?.length > 0,
  });

  if (!product_ids?.length) return null;

  return (
    <div className="px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-normal tracking-wide text-center mb-4 text-foreground">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-center text-muted-foreground font-body text-base md:text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: Math.min(product_ids.length, 4) }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products?.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group block"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      אין תמונה
                    </div>
                  )}
                </div>
                <h3 className="font-body text-sm md:text-base font-medium text-foreground group-hover:text-accent transition-colors duration-300 line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <PriceDisplay
                  price={product.price?.toLocaleString("he-IL")}
                  priceFrom={product.price_from?.toLocaleString("he-IL")}
                  priceTo={product.price_to?.toLocaleString("he-IL")}
                  className="mt-1"
                  size="sm"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ProductLinksBlock.displayName = "ProductLinksBlock";
export default ProductLinksBlock;
