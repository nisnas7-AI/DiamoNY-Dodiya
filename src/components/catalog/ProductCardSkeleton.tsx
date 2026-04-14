import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProductCardSkeleton - Pixel-perfect skeleton matching ProductCard structure
 * Used for CLS prevention in product grids during loading states.
 * 
 * Structure matches:
 * - 4:5 aspect ratio image with rounded-2xl corners
 * - Thumbnail row on desktop (hidden on mobile)
 * - Badge height reservation
 * - Text info with category, title, price
 */
const ProductCardSkeleton = () => {
  return (
    <div className="product-card-skeleton w-full">
      {/* Main card container matching ProductCard shadow/rounding */}
      <div className="relative rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Image Container - STRICT 1:1 aspect ratio to prevent CLS */}
        <div className="aspect-square w-full">
          <Skeleton className="w-full h-full rounded-t-2xl" />
        </div>
        
        {/* Desktop thumbnail row placeholder - hidden on mobile */}
        <div className="hidden md:flex gap-1.5 p-2 bg-muted/30 rounded-b-2xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-10 h-10 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Badge height reservation - matches "Made to Order" badge spacing */}
      <div className="h-4 -mt-3 relative z-10 flex justify-center">
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      {/* Text info matching ProductCard padding: pt-3 pb-1.5 space-y-0.5 */}
      <div className="pt-3 pb-1.5 space-y-1">
        {/* Category - text-[10px] */}
        <Skeleton className="h-2.5 w-16" />
        {/* Title - text-base md:text-lg */}
        <Skeleton className="h-5 w-full" />
        {/* Price - text-base md:text-lg */}
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
