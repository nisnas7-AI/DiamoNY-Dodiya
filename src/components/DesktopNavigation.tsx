import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Sparkles, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories, CategoryWithChildren } from "@/hooks/useCategories";
import MegaMenuSection from "@/components/navigation/MegaMenuSection";
import type { CuratedColumn } from "@/components/navigation/MegaMenuSection";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  image_url?: string | null;
}

interface NavItem {
  label: string;
  href: string;
  isExternal: boolean;
}

interface DesktopNavigationProps {
  navItems: NavItem[];
  isScrolled?: boolean;
}

/** Hebrew keyword used to identify men's categories */
const MEN_KEYWORD = "גבר";

const DesktopNavigation = ({ navItems, isScrolled = false }: DesktopNavigationProps) => {
  const { categoryTree, flatCategories, loading } = useCategories();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<CategoryWithChildren | null>(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState<Category | null>(null);
  const location = useLocation();

  // Categories to hide from the women's mega-menu (handled via curated/extra items)
  const hiddenWomenSlugs = useMemo(() => new Set(["מחרוזת-פנינים"]), []);

  // Split categories into women's and men's
  // Men's categories to hide from the mega menu (handled elsewhere)
  const hiddenMenNames = useMemo(() => new Set(["תליוני גברים", "טבעות גברים"]), []);

  // Force these categories into women's section even if they have men's children
  const forceWomenNames = useMemo(() => new Set(["תליונים"]), []);

  const { womenCategories, menCategories } = useMemo(() => {
    const isMen = (cat: CategoryWithChildren): boolean =>
      cat.name.includes(MEN_KEYWORD) ||
      (cat.children ?? []).some((c) => c.name.includes(MEN_KEYWORD));

    const women: CategoryWithChildren[] = [];
    const men: CategoryWithChildren[] = [];

    categoryTree.forEach((cat) => {
      if (forceWomenNames.has(cat.name)) {
        // Clone without men-specific children for women's section
        const womenCopy: CategoryWithChildren = {
          ...cat,
          children: (cat.children ?? []).filter((c) => !c.name.includes(MEN_KEYWORD)),
        };
        women.push(womenCopy);
      } else if (isMen(cat)) {
        if (!hiddenMenNames.has(cat.name)) {
          men.push(cat);
        }
      } else if (!hiddenWomenSlugs.has(cat.slug)) {
        women.push(cat);
      }
    });
    return { womenCategories: women, menCategories: men };
  }, [categoryTree, hiddenWomenSlugs, hiddenMenNames, forceWomenNames]);

  // Curated columns for women's section – resolve slugs from DB when possible
  const womenCuratedColumns = useMemo((): CuratedColumn[] => {
    const ringItems: { name: string; overrideSlug?: string }[] = [
      { name: "טבעת אירוסין", overrideSlug: "/category/engagement-rings" },
      { name: "טבעת יהלומים" },
      { name: "טבעת פנינים" },
      { name: "טבעת אבני חן", overrideSlug: "/category/gemstone-rings" },
      { name: "טבעת זהב" },
    ];

    const braceletItems: { label: string; dbName?: string; overrideSlug?: string }[] = [
      { label: "צמיד טניס", dbName: "צמידי טניס" },
      { label: "צמיד יהלומים" },
      { label: "צמיד זהב", dbName: "צמידי זהב" },
      { label: "צמיד פנינים", dbName: "צמיד פנינים" },
    ];

    return [
      {
        title: "טבעות",
        items: ringItems.map(({ name, overrideSlug }) => {
          if (overrideSlug) return { label: name, slug: overrideSlug, isAbsolute: true };
          const cat = flatCategories.find((c) => c.name === name);
          return { label: name, slug: cat?.slug || "" };
        }),
      },
      {
        title: "צמידים",
        items: braceletItems.map(({ label, dbName, overrideSlug }) => {
          if (overrideSlug) return { label, slug: overrideSlug, isAbsolute: true };
          const cat = flatCategories.find((c) => c.name === (dbName || label));
          return { label, slug: cat?.slug || "", isEmpty: !cat };
        }),
      },
    ];
  }, [flatCategories]);

  // Extra items to inject into specific DB category columns
  const womenExtraItems = useMemo((): Record<string, { label: string; slug: string; isAbsolute?: boolean }[]> => ({
    "תליונים": [
      { label: "מחרוזת פנינים", slug: "/category/pearl-necklaces", isAbsolute: true },
    ],
  }), []);

  // Men's section: only allow these specific children
  const menAllowedChildren = useMemo(() => new Set(["טבעת לגבר", "טבעת יהלום לגבר"]), []);

  const handleMenuEnter = (menuId: string) => {
    setActiveMenuId(menuId);
    if (categoryTree.length > 0) {
      const categoryWithImage = categoryTree.find((cat) => cat.image_url) || categoryTree[0];
      setHoveredCategory(categoryWithImage);
    }
  };

  const handleMenuLeave = () => {
    setActiveMenuId(null);
    setHoveredCategory(null);
    setHoveredSubCategory(null);
  };

  const handleNavClick = (href: string) => {
    if (href.startsWith("/#") && location.pathname === "/") {
      const element = document.querySelector(href.substring(1));
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinkClass =
    "text-foreground hover:text-accent transition-all duration-300 font-body text-[15px] font-normal uppercase tracking-[0.12em] leading-tight";

  const renderNavLink = (item: NavItem) => {
    const isHashLink = item.href.startsWith("/#");
    if (isHashLink && location.pathname === "/") {
      return (
        <a
          href={item.href.substring(1)}
          onClick={(e) => {
            e.preventDefault();
            handleNavClick(item.href);
          }}
          className={navLinkClass}
        >
          {item.label}
        </a>
      );
    }
    return (
      <Link to={item.href} onClick={() => handleNavClick(item.href)} className={navLinkClass}>
        {item.label}
      </Link>
    );
  };

  const handleCategoryHover = (category: CategoryWithChildren) => {
    setHoveredCategory(category);
    setHoveredSubCategory(null);
  };

  const handleSubCategoryHover = (subCategory: Category, parentCategory: CategoryWithChildren) => {
    setHoveredCategory(parentCategory);
    setHoveredSubCategory(subCategory);
  };

  // Featured image logic
  const getFeaturedImage = () => {
    if (hoveredSubCategory?.image_url) return hoveredSubCategory.image_url;
    if (hoveredCategory?.image_url) return hoveredCategory.image_url;
    return categoryTree.find((c) => c.image_url)?.image_url || null;
  };
  const getFeaturedName = () => {
    if (hoveredSubCategory) return hoveredSubCategory.name;
    if (hoveredCategory) return hoveredCategory.name;
    return categoryTree.find((c) => c.image_url)?.name || "הקולקציה שלנו";
  };
  const getFeaturedSlug = () => {
    if (hoveredSubCategory) return hoveredSubCategory.slug;
    if (hoveredCategory) return hoveredCategory.slug;
    return "";
  };

  const closeMegaMenu = () => setActiveMenuId(null);

  // Expected men's columns (show placeholders for missing ones)
  const menExpectedColumns = ["טבעות גברים", "צמידי גברים", "עגילי גברים"];

  return (
    <nav className="hidden lg:flex items-center gap-10">
      <ul className="flex items-center gap-10">
        {/* Category Mega Menu Trigger */}
        <li className="relative" onMouseEnter={() => handleMenuEnter("categories")} onMouseLeave={handleMenuLeave}>
          <button className={`flex items-center gap-1.5 ${navLinkClass} py-2`}>
            <span>התכשיטים שלנו</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenuId === "categories" ? "rotate-180" : ""}`} />
          </button>

          {/* Invisible bridge */}
          <div className={`absolute top-full left-0 right-0 h-4 ${activeMenuId === "categories" ? "" : "pointer-events-none"}`} />

          {/* Mega Menu Panel */}
          <div
            className={`
              fixed left-0 right-0 bg-background shadow-elegant z-50
              transition-all duration-300 ease-in-out
              ${activeMenuId === "categories" && !loading ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"}
            `}
            style={{ position: "fixed", left: 0, right: 0, top: "auto", marginTop: "16px" }}
            aria-hidden={activeMenuId !== "categories"}
            dir="rtl"
          >
            <div className="h-px bg-border" />

            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-12">
                {/* Categories Column (left 8 cols) */}
                <div className="col-span-8">
                  {/* Women's Section */}
                  <MegaMenuSection
                    title="קולקציית זהב ויהלומים לנשים"
                    categories={womenCategories}
                    curatedColumns={womenCuratedColumns}
                    extraItems={womenExtraItems}
                    hoveredCategory={hoveredCategory}
                    hoveredSubCategory={hoveredSubCategory}
                    onCategoryHover={handleCategoryHover}
                    onSubCategoryHover={handleSubCategoryHover}
                    onClose={closeMegaMenu}
                  />

                  {/* Men's Section */}
                  <MegaMenuSection
                    title="קולקציית זהב ויהלומים לגברים"
                    categories={menCategories}
                    expectedColumns={menExpectedColumns}
                    allowedChildNames={menAllowedChildren}
                    hoveredCategory={hoveredCategory}
                    hoveredSubCategory={hoveredSubCategory}
                    onCategoryHover={handleCategoryHover}
                    onSubCategoryHover={handleSubCategoryHover}
                    onClose={closeMegaMenu}
                    showTopBorder
                  />
                </div>

                {/* Featured Image Column */}
                <div className="col-span-4 relative overflow-hidden min-h-[420px]">
                  <div className="absolute left-0 top-8 bottom-8 w-px bg-border" />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={hoveredSubCategory?.id || hoveredCategory?.id || "default"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      {getFeaturedImage() ? (
                        <div className="relative h-full p-6">
                          <div className="relative h-full overflow-hidden">
                            <img src={getFeaturedImage()!} alt={getFeaturedName()} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                            <div
                              className="absolute bottom-4 left-4 right-4 p-4"
                              style={{
                                background: "rgba(255, 255, 255, 0.15)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: "8px",
                                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                              }}
                            >
                              <p className="font-body text-[12px] uppercase tracking-[0.2em] mb-2 text-white/90" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                                {hoveredSubCategory ? "Sub-Collection" : "Featured"}
                              </p>
                              <h3
                                className="font-body text-[20px] font-semibold mb-3 text-white"
                                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)", letterSpacing: "0.05em" }}
                              >
                                {getFeaturedName()}
                              </h3>
                              <Link
                                to={`/catalog/${getFeaturedSlug()}`}
                                onClick={closeMegaMenu}
                                className="inline-flex items-center gap-2 font-body text-[14px] tracking-wide text-white/90 hover:gap-3 transition-all duration-300"
                                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                              >
                                <span className="border-b border-white/40 pb-0.5">גלו עוד</span>
                                <ArrowLeft className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="h-full flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 40%, #C5A059 70%, #8B6914 100%)',
                            borderRadius: '8px',
                          }}
                        >
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <p className="font-body text-[18px] font-semibold text-white mb-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{getFeaturedName()}</p>
                            <p className="font-body text-[13px] text-white/80">גלו את הקולקציה</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />
          </div>
        </li>

        {/* Other Nav Items */}
        {navItems.map((item) => (
          <li key={item.label} className="relative py-2">
            {renderNavLink(item)}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default DesktopNavigation;
