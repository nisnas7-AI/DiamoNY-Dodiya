import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CategoryNode {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  children: CategoryNode[];
}

interface CatalogSidebarProps {
  categoryTree: CategoryNode[];
  categorySlug?: string;
  expandedCategories: Set<string>;
  stockFilter: string[];
  metalFilter: string[];
  hasActiveFilters: boolean;
  isActiveCategory: (slug: string, currentSlug?: string) => boolean;
  onCategoryClick: (slug: string | null) => void;
  onToggleCategoryExpand: (categoryId: string) => void;
  onToggleStockFilter: (value: string) => void;
  onToggleMetalFilter: (value: string) => void;
  onClearAllFilters: () => void;
}

const CatalogSidebar = ({
  categoryTree,
  categorySlug,
  expandedCategories,
  stockFilter,
  metalFilter,
  hasActiveFilters,
  isActiveCategory,
  onCategoryClick,
  onToggleCategoryExpand,
  onToggleStockFilter,
  onToggleMetalFilter,
  onClearAllFilters,
}: CatalogSidebarProps) => {
  return (
    <aside className="hidden lg:block w-44 xl:w-48 flex-shrink-0">
      <div className="sticky top-24 space-y-8">
        {/* Categories */}
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground mb-3 pb-2 border-b border-border font-body">
            קטגוריות
          </h3>
          <nav className="space-y-1" dir="rtl">
            <button
              onClick={() => onCategoryClick(null)}
              className={`w-full flex items-center justify-start gap-1.5 py-2 text-[16px] font-body transition-colors leading-tight ${
                !categorySlug
                  ? "text-accent font-semibold"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              <span>כל המוצרים</span>
            </button>

            {categoryTree.map((category) => (
              <div key={category.id}>
                <div className="flex items-center justify-start gap-1.5 w-full">
                  <button
                    onClick={() => onCategoryClick(category.slug)}
                    className={`py-2 text-[16px] font-body transition-colors leading-tight ${
                      isActiveCategory(category.slug, categorySlug)
                        ? "text-accent font-semibold"
                        : "text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    {category.name}
                  </button>
                  {category.children.length > 0 && (
                    <button
                      onClick={() => onToggleCategoryExpand(category.id)}
                      className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          expandedCategories.has(category.id) ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {category.children.length > 0 && (
                  <div
                    className={`
                      pr-4 space-y-0.5 border-r border-border/40 mr-0
                      overflow-hidden transition-all duration-200
                      ${expandedCategories.has(category.id) ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}
                    `}
                    aria-hidden={!expandedCategories.has(category.id)}
                  >
                    {category.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onCategoryClick(child.slug)}
                        tabIndex={expandedCategories.has(category.id) ? 0 : -1}
                        className={`w-full text-right py-1.5 text-[15px] font-body transition-colors leading-tight ${
                          categorySlug === child.slug
                            ? "text-accent font-semibold"
                            : "text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Availability Filter */}
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground mb-4 pb-2 border-b border-border font-body">
            זמינות
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={stockFilter.includes("in_stock")}
                onCheckedChange={() => onToggleStockFilter("in_stock")}
                className="border-muted-foreground/50"
              />
              <span className="text-[14px] font-body text-muted-foreground group-hover:text-foreground transition-colors">
                במלאי
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={stockFilter.includes("made_to_order")}
                onCheckedChange={() => onToggleStockFilter("made_to_order")}
                className="border-muted-foreground/50"
              />
              <span className="text-[14px] font-body text-muted-foreground group-hover:text-foreground transition-colors">
                בהזמנה מיוחדת
              </span>
            </label>
          </div>
        </div>

        {/* Metal Type Filter */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground mb-4 pb-2 border-b border-border">
            סוג מתכת
          </h3>
          <div className="space-y-3">
            {["זהב צהוב", "זהב לבן", "זהב רוזה", "פלטינה"].map((metal) => (
              <label key={metal} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={metalFilter.includes(metal)}
                  onCheckedChange={() => onToggleMetalFilter(metal)}
                  className="border-muted-foreground/50"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {metal}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearAllFilters}
            className="w-full py-2 text-sm text-accent hover:text-accent/80 transition-colors text-right"
          >
            נקה את כל הסינונים
          </button>
        )}
      </div>
    </aside>
  );
};

export default CatalogSidebar;
