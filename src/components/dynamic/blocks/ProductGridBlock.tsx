import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import OptimizedImage from "@/components/ui/OptimizedImage";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { ProductGridBlockData } from "../types";

interface ProductGridBlockProps {
  data: ProductGridBlockData;
}

interface ProductImage {
  url: string;
  alt?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  price_from: number | null;
  price_to: number | null;
  main_image_url: string | null;
  is_diamond_jewelry: boolean | null;
  category: {
    name: string;
  } | null;
  product_images: {
    image_url: string;
    alt_text: string | null;
  }[];
}

/**
 * Product grid block that fetches products by IDs or category slug.
 * Uses existing ProductCard styling patterns with hover effects.
 */
const ProductGridBlock = memo(({ data }: ProductGridBlockProps) => {
  const {
    title,
    subtitle,
    product_ids,
    category_slug,
    limit = 4,
    columns = 4,
  } = data;

  const { data: products, isLoading } = useQuery({
    queryKey: ['dynamic-products', product_ids, category_slug, limit],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          price_from,
          price_to,
          main_image_url,
          is_diamond_jewelry,
          category:categories(name),
          product_images(image_url, alt_text)
        `)
        .eq('is_active', true)
        .limit(limit);

      if (product_ids && product_ids.length > 0) {
        query = query.in('id', product_ids);
      } else if (category_slug) {
        query = query.eq('category.slug', category_slug);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const columnClasses: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <section className="py-12 md:py-16 lg:py-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10 md:mb-12">
            {title && (
              <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-normal tracking-wide mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground font-body max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className={`grid ${columnClasses[columns] || columnClasses[4]} gap-4 md:gap-6`}>
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/5] rounded-2xl" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && products && products.length > 0 && (
          <div className={`grid ${columnClasses[columns] || columnClasses[4]} gap-4 md:gap-6`}>
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                animationDelay={index * 100}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!products || products.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-body">לא נמצאו מוצרים</p>
          </div>
        )}
      </div>
    </section>
  );
});

ProductGridBlock.displayName = "ProductGridBlock";

/**
 * Simplified product card for the dynamic grid.
 * Based on the main ProductCard component but streamlined.
 */
const ProductCard = memo(({ product, animationDelay = 0 }: { product: Product; animationDelay?: number }) => {
  const mainImage = product.main_image_url || product.product_images?.[0]?.image_url || '/placeholder.svg';
  const categoryName = product.category?.name || '';

  const formatPrice = () => {
    if (product.price_from && product.price_to) {
      return `₪${product.price_from.toLocaleString()} - ₪${product.price_to.toLocaleString()}`;
    }
    if (product.price) {
      return `₪${product.price.toLocaleString()}`;
    }
    return null;
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Image Container - 1:1 aspect ratio for CLS prevention */}
      <div className="relative rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-all duration-300 overflow-hidden hover:shadow-[0_15px_50px_rgba(0,0,0,0.08)] group-hover:-translate-y-2">
        <div className="aspect-square overflow-hidden rounded-2xl">
          <OptimizedImage
            src={mainImage}
            alt={product.name}
            width={800}
            height={1000}
            aspectRatio="1/1"
            blurUp
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="pt-3 pb-1.5 space-y-0.5">
        {categoryName && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block font-body">
            {categoryName}
          </span>
        )}
        <h3 className="font-heading text-sm md:text-base font-normal group-hover:text-accent transition-colors line-clamp-2 tracking-wide text-foreground">
          {product.name}
        </h3>
        {(product.price || (product.price_from && product.price_to)) && (
          <div className="pt-0.5">
            <PriceDisplay
              numericPrice={product.price}
              priceFrom={product.price_from ? product.price_from.toLocaleString('he-IL') : undefined}
              priceTo={product.price_to ? product.price_to.toLocaleString('he-IL') : undefined}
              isDiamondJewelry={product.is_diamond_jewelry ?? false}
              size="sm"
              forcePrefix
            />
          </div>
        )}
      </div>
    </Link>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductGridBlock;
