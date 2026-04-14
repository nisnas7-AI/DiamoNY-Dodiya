import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
}

interface ProductBreadcrumbsProps {
  category?: Category | null;
  productName: string;
}

/**
 * ProductBreadcrumbs - Displays full hierarchical breadcrumb trail on product pages
 * Recursively traverses parent categories to build: Home > Collections > Parent > Child > Product
 */
const ProductBreadcrumbs = ({ category, productName }: ProductBreadcrumbsProps) => {
  const { getParentCategory, flatCategories } = useCategories();

  // Build full category trail by recursively traversing parents
  const buildCategoryTrail = (): Category[] => {
    if (!category) return [];
    
    const trail: Category[] = [];
    let current: Category | undefined = category;
    
    while (current) {
      trail.unshift(current);
      // Find parent from flatCategories
      const parent = flatCategories.find(c => c.id === current?.parent_id);
      current = parent as Category | undefined;
    }
    
    return trail;
  };

  const categoryTrail = buildCategoryTrail();

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="container-luxury py-2 md:py-3 opacity-60 hover:opacity-100 transition-opacity"
    >
      <ol className="flex items-center gap-2 text-xs flex-wrap">
        {/* Home */}
        <li>
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-accent transition-colors"
          >
            דף הבית
          </Link>
        </li>
        
        <li><ChevronLeft className="w-3 h-3 text-muted-foreground/50" /></li>
        
        {/* Collections */}
        <li>
          <Link 
            to="/catalog" 
            className="text-muted-foreground hover:text-accent transition-colors"
          >
            קולקציות
          </Link>
        </li>
        
        {/* Category hierarchy */}
        {categoryTrail.map((cat) => (
          <li key={cat.id} className="flex items-center gap-2">
            <ChevronLeft className="w-3 h-3 text-muted-foreground/50" />
            <Link 
              to={`/catalog/${cat.slug}`} 
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              {cat.name}
            </Link>
          </li>
        ))}
        
        {/* Current product */}
        <li className="flex items-center gap-2">
          <ChevronLeft className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {productName}
          </span>
        </li>
      </ol>
    </nav>
  );
};

export default ProductBreadcrumbs;
