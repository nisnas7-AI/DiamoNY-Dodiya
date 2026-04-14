import ProductCard from "@/components/catalog/ProductCard";
import ProductCardSkeleton from "@/components/catalog/ProductCardSkeleton";
import CatalogPagination from "@/components/catalog/CatalogPagination";
import { VipRulesProvider } from "@/contexts/VipRulesContext";
import { type Product } from "@/types";

interface CatalogGridProps {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  isPageTransition: boolean;
  hasActiveFilters: boolean;
  categoryName?: string;
  onPageChange: (page: number) => void;
  onClearAllFilters: () => void;
}

const CatalogGrid = ({
  products,
  totalCount,
  totalPages,
  currentPage,
  isLoading,
  isPageTransition,
  hasActiveFilters,
  categoryName,
  onPageChange,
  onClearAllFilters,
}: CatalogGridProps) => {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4 justify-items-center product-grid-stable"
        style={{ minHeight: "800px" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">
          {hasActiveFilters ? "לא נמצאו מוצרים התואמים לסינון" : "לא נמצאו מוצרים"}
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearAllFilters}
            className="text-accent text-sm mt-3 hover:underline"
          >
            נקה את כל הסינונים
          </button>
        )}
      </div>
    );
  }

  return (
    <VipRulesProvider>
      <p className="text-xs text-muted-foreground mb-3 tracking-wide">
        {totalCount} מוצרים
        {categoryName && ` ב${categoryName}`}
        {totalPages > 1 && ` • עמוד ${currentPage} מתוך ${totalPages}`}
      </p>
      <div
        className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4 justify-items-center product-grid-stable transition-opacity duration-200 ${
          isPageTransition ? "opacity-50" : "opacity-100"
        }`}
        style={{ minHeight: "600px" }}
      >
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} animationDelay={index * 50} />
        ))}
      </div>

      <CatalogPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </VipRulesProvider>
  );
};

export default CatalogGrid;
