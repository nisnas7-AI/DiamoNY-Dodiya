import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  image_url?: string | null;
}

interface CategoryWithChildren extends Category {
  children: Category[];
}

const CategoryDropdown = () => {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      // Organize into parent-child structure
      const parentCategories = data.filter((cat) => !cat.parent_id);
      const childCategories = data.filter((cat) => cat.parent_id);

      const organized: CategoryWithChildren[] = parentCategories.map((parent) => ({
        ...parent,
        children: childCategories.filter((child) => child.parent_id === parent.id),
      }));

      // Find featured image from first category with image
      const categoryWithImage = data.find(cat => cat.image_url);
      if (categoryWithImage?.image_url) {
        setFeaturedImage(categoryWithImage.image_url);
      }

      setCategories(organized.length > 0 ? organized : data.map(cat => ({ ...cat, children: [] })));
      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <span className="text-foreground font-medium text-base">התכשיטים שלנו</span>
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger Button */}
      <button 
        className="flex items-center gap-1.5 text-foreground hover:text-accent font-medium text-base transition-colors py-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>התכשיטים שלנו</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Animated Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 bg-background border border-border shadow-xl rounded-sm overflow-hidden min-w-[600px] z-50"
            dir="rtl"
          >
            <div className="flex">
              {/* Categories Column */}
              <div className="flex-1 p-6">
                {/* View All Collections Link */}
                <Link
                  to="/catalog"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 mb-4 bg-secondary/50 rounded-md text-foreground hover:bg-accent/10 hover:text-accent transition-all duration-300 group"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="font-heading font-medium">צפה בכל הקולקציות</span>
                </Link>
                
                <div className="border-t border-border/50 pt-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {categories.map((category) => (
                      <div key={category.id} className="relative group/item py-2">
                        {category.children.length > 0 ? (
                          <div className="relative">
                            <div className="flex items-center justify-between">
                              <Link
                                to={`/catalog/${category.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="font-heading text-base text-foreground hover:text-accent transition-colors duration-300"
                              >
                                {category.name}
                              </Link>
                              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground group-hover/item:text-accent transition-colors" />
                            </div>
                            {/* Submenu on hover */}
                            <div className="absolute right-full top-0 mr-2 invisible group-hover/item:visible opacity-0 group-hover/item:opacity-100 transition-all duration-300 bg-background border border-border shadow-lg rounded-md min-w-[180px] z-50">
                              <ul className="p-3 space-y-1">
                                <li>
                                  <Link
                                    to={`/catalog/${category.slug}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/10 hover:text-accent rounded-sm transition-colors duration-300"
                                  >
                                    כל ה{category.name}
                                  </Link>
                                </li>
                                <li className="border-t border-border/50 my-1.5" />
                                {category.children.map((child) => (
                                  <li key={child.id}>
                                    <Link
                                      to={`/catalog/${child.slug}`}
                                      onClick={() => setIsOpen(false)}
                                      className="block px-3 py-2 text-sm text-muted-foreground hover:bg-accent/10 hover:text-accent rounded-sm transition-colors duration-300"
                                    >
                                      {child.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={`/catalog/${category.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="block font-heading text-base text-foreground hover:text-accent transition-colors duration-300"
                          >
                            {category.name}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Featured Image Column */}
              {featuredImage && (
                <div className="w-56 p-4 border-r border-border/50">
                  <Link to="/catalog" onClick={() => setIsOpen(false)} className="block group">
                    <div className="relative aspect-square rounded-md overflow-hidden bg-secondary">
                      <img
                        src={featuredImage}
                        alt="הקולקציה החדשה"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 right-3 left-3">
                        <span className="text-xs text-white/80 tracking-[0.2em] uppercase">NEW</span>
                        <p className="text-white font-heading text-sm mt-0.5">הקולקציה החדשה</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryDropdown;