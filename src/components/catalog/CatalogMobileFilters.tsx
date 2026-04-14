import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
}

interface CatalogMobileFiltersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categoryTree: CategoryNode[];
  categorySlug?: string;
  stockFilter: string[];
  metalFilter: string[];
  hasActiveFilters: boolean;
  totalProducts: number;
  isActiveCategory: (slug: string, currentSlug?: string) => boolean;
  onCategoryClick: (slug: string | null) => void;
  onToggleStockFilter: (value: string) => void;
  onToggleMetalFilter: (value: string) => void;
  onClearAllFilters: () => void;
}

const CatalogMobileFilters = ({
  isOpen,
  onOpenChange,
  categoryTree,
  categorySlug,
  stockFilter,
  metalFilter,
  hasActiveFilters,
  totalProducts,
  isActiveCategory,
  onCategoryClick,
  onToggleStockFilter,
  onToggleMetalFilter,
  onClearAllFilters,
}: CatalogMobileFiltersProps) => {
  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden flex items-center gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(true)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          סינון{" "}
          {hasActiveFilters &&
            `(${(categorySlug ? 1 : 0) + stockFilter.length + metalFilter.length})`}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAllFilters} className="text-accent">
            נקה הכל
          </Button>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => onOpenChange(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-background p-6 animate-fade-in max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium uppercase tracking-[0.15em]">סינון</h3>
              <button onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">קטגוריות</h4>
              <div className="space-y-2">
                <button
                  onClick={() => onCategoryClick(null)}
                  className={`w-full text-right py-2 text-sm transition-colors ${
                    !categorySlug ? "text-accent font-medium" : "text-muted-foreground"
                  }`}
                >
                  כל המוצרים
                </button>
                {categoryTree.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => onCategoryClick(category.slug)}
                      className={`w-full text-right py-2 text-sm transition-colors ${
                        isActiveCategory(category.slug, categorySlug)
                          ? "text-accent font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {category.name}
                    </button>
                    {category.children.length > 0 &&
                      isActiveCategory(category.slug, categorySlug) && (
                        <div className="pr-4 space-y-1">
                          {category.children.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => onCategoryClick(child.slug)}
                              className={`w-full text-right py-1.5 text-sm transition-colors ${
                                categorySlug === child.slug
                                  ? "text-accent font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="mb-6">
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">זמינות</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={stockFilter.includes("in_stock")}
                    onCheckedChange={() => onToggleStockFilter("in_stock")}
                  />
                  <span className="text-sm">במלאי</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={stockFilter.includes("made_to_order")}
                    onCheckedChange={() => onToggleStockFilter("made_to_order")}
                  />
                  <span className="text-sm">בהזמנה מיוחדת</span>
                </label>
              </div>
            </div>

            {/* Metal Type */}
            <div className="mb-6">
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">סוג מתכת</h4>
              <div className="space-y-3">
                {["זהב צהוב", "זהב לבן", "זהב רוזה", "פלטינה"].map((metal) => (
                  <label key={metal} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={metalFilter.includes(metal)}
                      onCheckedChange={() => onToggleMetalFilter(metal)}
                    />
                    <span className="text-sm">{metal}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={() => onOpenChange(false)} className="w-full btn-primary">
              הצג {totalProducts} מוצרים
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default CatalogMobileFilters;
