import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import categoryRings from "@/assets/category-rings.jpg";
import categoryEarrings from "@/assets/category-earrings.jpg";
import categoryPendants from "@/assets/category-pendants.jpg";
import categoryBracelets from "@/assets/category-bracelets.jpg";
import { ArrowLeft, Loader2, Clock } from "lucide-react";
import { useSectionSettings, getSectionStyle, getSectionClasses } from "@/hooks/useSectionSettings";
import { sanitizeHtml } from "@/lib/sanitize";
import { useIsMobile } from "@/hooks/use-mobile";

// Fallback static categories with SEO-friendly slugs
const staticCategories = [
  { name: "טבעות", image: categoryRings, slug: "rings", link_url: "/catalog/rings" },
  { name: "עגילים", image: categoryEarrings, slug: "earrings", link_url: "/catalog/earrings" },
  { name: "תליונים ושרשראות", image: categoryPendants, slug: "pendants", link_url: "/catalog/pendants" },
  { name: "צמידים", image: categoryBracelets, slug: "bracelets", link_url: "/catalog/bracelets" },
];

// Map slugs to fallback images
const fallbackImages: Record<string, string> = {
  rings: categoryRings,
  earrings: categoryEarrings,
  pendants: categoryPendants,
  bracelets: categoryBracelets,
};

// Map for aria-label descriptions
const ariaLabels: Record<string, string> = {
  rings: "לחץ לצפייה בקולקציית הטבעות שלנו",
  earrings: "לחץ לצפייה בקולקציית העגילים שלנו",
  pendants: "לחץ לצפייה בקולקציית התליונים והשרשראות שלנו",
  bracelets: "לחץ לצפייה בקולקציית הצמידים שלנו",
};

interface CategoryItem {
  name: string;
  image: string;
  slug: string;
  link_url: string;
  productCount?: number;
  isUpdatingSoon?: boolean;
}

const Categories = () => {
  const { data: settings } = useSectionSettings("categories");
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Realtime: auto-refresh when categories.is_updating_soon changes
  useEffect(() => {
    const channel = supabase
      .channel('categories-updating-soon')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'categories',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["category-updating-soon-status"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
  // Fetch categories from database
  const { data: dbCategories, isLoading } = useQuery({
    queryKey: ["homepage-categories-display"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch is_updating_soon status from categories table
  const { data: categoryStatuses } = useQuery({
    queryKey: ["category-updating-soon-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("slug, is_updating_soon")
        .eq("is_active", true);
      if (error) throw error;
      const map: Record<string, boolean> = {};
      for (const c of data || []) {
        map[c.slug] = c.is_updating_soon;
      }
      return map;
    },
    staleTime: 1000 * 30,
  });

  // Fetch product counts via lightweight DB function (no full product rows transferred)
  const { data: productCounts } = useQuery({
    queryKey: ["category-product-counts-rpc"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_category_product_counts");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.category_slug] = Number(row.product_count);
      }
      return counts;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Use database categories if available, otherwise fallback to static
  const categories: CategoryItem[] = dbCategories && dbCategories.length > 0
    ? dbCategories.map(cat => {
        const slug = cat.category_slug || cat.name.toLowerCase();
        return {
          name: cat.name,
          image: cat.image_url || fallbackImages[slug] || categoryRings,
          slug,
          link_url: cat.link_url || `/catalog/${slug}`,
          productCount: productCounts?.[slug] || 0,
          isUpdatingSoon: categoryStatuses?.[slug] || false,
        };
      })
    : staticCategories.map(cat => ({
        ...cat,
        productCount: productCounts?.[cat.slug] || 0,
        isUpdatingSoon: categoryStatuses?.[cat.slug] || false,
      }));

  const sectionStyle = getSectionStyle(settings as any);
  const sectionClasses = getSectionClasses(settings as any);

  // Get content from section settings
  const sectionContent = (settings as any)?.content || {};
  const subtitle = sectionContent?.description || "כל יצירה היא סיפור של אהבה ודיוק";

  return (
    <section 
      className={`px-4 md:px-8 ${sectionClasses}`}
      style={{
        ...sectionStyle,
        backgroundColor: '#F9F9F9',
        paddingTop: '48px',
        paddingBottom: '60px',
      }}
    >
      <div className="container-luxury">
        {/* Tight heading-to-content spacing */}
        <div className="text-center mb-5">
          <h2 
            className="font-heading text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] font-normal mb-1.5 leading-tight"
            style={{ color: '#2D2D2D' }}
          >
            {(settings as any)?.title || "הקולקציות שלנו"}
          </h2>
          {/* Check if subtitle contains HTML */}
          {subtitle.includes('<') ? (
            <div 
              className="font-body text-[14px] md:text-[15px] max-w-xl mx-auto mb-0"
              style={{ color: '#2D2D2D' }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(subtitle) }}
            />
          ) : (
            <p 
              className="font-body text-[14px] md:text-[15px] max-w-xl mx-auto mb-0"
              style={{ color: '#2D2D2D' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => {
              const isEmptyCategory = category.isUpdatingSoon || category.productCount === 0;
              const ariaLabel = ariaLabels[category.slug] || `לחץ לצפייה בקולקציית ${category.name}`;
              
              return (
                <Link
                  key={category.name}
                  to={category.link_url}
                  className="group relative aspect-square overflow-hidden"
                  aria-label={ariaLabel}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    transition: 'all 0.4s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                  }}
                >
                  <img
                    src={category.image}
                    alt={`קולקציית ${category.name} - תכשיטים בעיצוב אישי`}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ borderRadius: '12px' }}
                    loading="lazy"
                  />
                  {/* Mobile: Gradient overlay covering full card, Desktop: Glass panel at bottom */}
                  {isMobile ? (
                    <>
                      {/* Mobile gradient overlay - full coverage */}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%)',
                          borderRadius: '12px',
                        }}
                      />
                      {/* Mobile content positioned at bottom */}
                      <div 
                        className="absolute bottom-0 right-0 left-0 p-4 flex flex-col items-start"
                        style={{ paddingBottom: '15px' }}
                      >
                        <h3 
                          className="font-body text-[1.1rem] font-semibold text-white mb-1.5 leading-tight uppercase"
                          style={{ 
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            letterSpacing: '0.1em',
                          }}
                        >
                          {category.name}
                        </h3>
                        {isEmptyCategory ? (
                          <span 
                            className="inline-flex items-center gap-2 text-amber-300/90 text-[13px] font-body font-medium"
                            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            קולקציה זו תתחדש בקרוב
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-2 text-white/90 text-[13px] font-body font-medium group-hover:gap-3 transition-all"
                            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                          >
                            גלה עוד
                            <ArrowLeft className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Desktop: Glass panel at bottom */
                    <div 
                      className="absolute bottom-3 right-3 left-3 md:bottom-4 md:right-4 md:left-4 p-3 md:p-4 glass-title-container"
                      style={{
                        background: 'rgba(0, 0, 0, 0.50)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <h3 
                        className="font-body text-[18px] md:text-[20px] font-semibold text-white mb-1.5 leading-tight"
                        style={{ 
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {category.name}
                      </h3>
                      {isEmptyCategory ? (
                        <span 
                          className="inline-flex items-center gap-2 text-amber-300/90 text-[13px] font-body font-medium"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          קולקציה זו תתחדש בקרוב
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center gap-2 text-white/90 text-[13px] font-body font-medium group-hover:gap-3 transition-all"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                        >
                          גלה עוד
                          <ArrowLeft className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;
