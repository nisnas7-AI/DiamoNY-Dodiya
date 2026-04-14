import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Plus, Minus, Sparkles } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

interface MobileCategoryMenuProps {
  onNavigate: () => void;
}

const MobileCategoryMenu = ({ onNavigate }: MobileCategoryMenuProps) => {
  const { categoryTree } = useCategories();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleNavigation = () => {
    setIsOpen(false);
    onNavigate();
  };

  return (
    <div className="border-b border-border/50">
      {/* Main toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 font-heading text-lg hover:text-accent transition-colors duration-300"
      >
        <span>התכשיטים שלנו</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Categories accordion */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pr-2 pb-4 space-y-1">
          {/* View All Collections */}
          <Link
            to="/catalog"
            onClick={handleNavigation}
            className="flex items-center gap-2 py-3 px-3 mb-2 bg-secondary/50 rounded-md text-accent hover:bg-accent/10 transition-all duration-300"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">צפה בכל הקולקציות</span>
          </Link>
          
          {categoryTree.map((category) => (
            <div key={category.id} className="border-b border-border/30 last:border-0">
              {category.children.length > 0 ? (
                <>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center justify-between w-full py-3 px-2 text-foreground hover:text-accent transition-colors duration-300"
                  >
                    <span className="font-heading text-base">{category.name}</span>
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-secondary/50">
                      {expandedCategories.has(category.id) ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedCategories.has(category.id) 
                        ? 'max-h-[500px] opacity-100' 
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="pr-4 pb-2 space-y-0.5">
                      <Link
                        to={`/catalog/${category.slug}`}
                        onClick={handleNavigation}
                        className="block py-2.5 px-3 text-sm text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-sm transition-all duration-300"
                      >
                        כל ה{category.name}
                      </Link>
                      {category.children.map((child, index) => (
                        <Link
                          key={child.id}
                          to={`/catalog/${child.slug}`}
                          onClick={handleNavigation}
                          className="block py-2.5 px-3 text-sm text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-sm transition-all duration-300"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to={`/catalog/${category.slug}`}
                  onClick={handleNavigation}
                  className="block py-3 px-2 font-heading text-base text-foreground hover:text-accent transition-colors duration-300"
                >
                  {category.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileCategoryMenu;