import { useState, useEffect, useRef, useCallback } from "react";
import { SITE_URL } from "@/lib/siteConfig";
import { trackEvent } from "@/lib/analyticsTracker";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import GoldBuyingBanner from "@/components/GoldBuyingBanner";
import DesignAppointmentBanner from "@/components/DesignAppointmentBanner";
import CatalogBreadcrumbs from "@/components/CatalogBreadcrumbs";
import CatalogSidebar from "@/components/catalog/CatalogSidebar";
import CatalogMobileFilters from "@/components/catalog/CatalogMobileFilters";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";

const Catalog = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const engagementFilter = searchParams.get("engagement") === "true";
  const categoryFromQuery = searchParams.get("category");
  const isPearlCollection = location.pathname === "/collections/pearl-jewelry";

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isPageTransition, setIsPageTransition] = useState(false);

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const collectionRef = useRef<HTMLElement>(null);

  const stockFilter = searchParams.get("stock")?.split(",").filter(Boolean) || [];
  const metalFilter = searchParams.get("metal")?.split(",").filter(Boolean) || [];

  const {
    categoryTree,
    flatCategories,
    getCategoryBySlug,
    getAllDescendantIds,
    isActiveCategory,
    isCategoryHidden,
    hiddenCategoryIds,
    loading: categoriesLoading,
  } = useCategories();

  const effectiveCategorySlug = categorySlug || categoryFromQuery;
  const currentCategory = effectiveCategorySlug ? getCategoryBySlug(effectiveCategorySlug) : null;
  const categoryIdsToFilter = currentCategory ? getAllDescendantIds(currentCategory.id) : null;

  // Auto-expand parent categories
  useEffect(() => {
    if (currentCategory?.parent_id) {
      const parent = flatCategories.find((c) => c.id === currentCategory.parent_id);
      if (parent) {
        setExpandedCategories((prev) => new Set([...prev, parent.id]));
      }
    }
  }, [currentCategory, flatCategories]);

  // H-2: Server-side paginated fetch
  const { products, totalCount, totalPages, isLoading } = useCatalogProducts({
    categoryIdsToFilter,
    engagementFilter,
    isPearlCollection,
    hiddenCategoryIds,
    stockFilter,
    metalFilter,
    page: currentPage,
    categoriesLoading,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage > 1) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("page");
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, stockFilter.join(","), metalFilter.join(",")]);

  const scrollToCollection = useCallback(() => {
    if (collectionRef.current) {
      const headerOffset = 100;
      const elementPosition = collectionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setIsPageTransition(true);
      const newParams = new URLSearchParams(searchParams);
      if (page === 1) newParams.delete("page");
      else newParams.set("page", page.toString());
      setSearchParams(newParams, { replace: false });
      setTimeout(() => {
        scrollToCollection();
        setIsPageTransition(false);
      }, 50);
    },
    [totalPages, searchParams, setSearchParams, scrollToCollection]
  );

  // --- Filter handlers ---
  const toggleStockFilter = (value: string) => {
    const newFilter = stockFilter.includes(value)
      ? stockFilter.filter((v) => v !== value)
      : [...stockFilter, value];
    const newParams = new URLSearchParams(searchParams);
    if (newFilter.length > 0) newParams.set("stock", newFilter.join(","));
    else newParams.delete("stock");
    setSearchParams(newParams, { replace: true });
  };

  const toggleMetalFilter = (value: string) => {
    const newFilter = metalFilter.includes(value)
      ? metalFilter.filter((v) => v !== value)
      : [...metalFilter, value];
    const newParams = new URLSearchParams(searchParams);
    if (newFilter.length > 0) newParams.set("metal", newFilter.join(","));
    else newParams.delete("metal");
    setSearchParams(newParams, { replace: true });
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) newSet.delete(categoryId);
      else newSet.add(categoryId);
      return newSet;
    });
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (searchParams.get("engagement")) newParams.set("engagement", "true");
    setSearchParams(newParams, { replace: true });
    navigate("/catalog");
  };

  const handleCategoryClick = (slug: string | null) => {
    if (slug) navigate(`/catalog/${slug}`);
    else navigate("/catalog");
    setIsMobileFilterOpen(false);
  };

  const hasActiveFilters = !!categorySlug || stockFilter.length > 0 || metalFilter.length > 0;

  // Track category view
  useEffect(() => {
    if (effectiveCategorySlug) trackEvent("category_view", effectiveCategorySlug);
  }, [effectiveCategorySlug]);

  // --- SEO ---
  const pageTitle = isPearlCollection
    ? "תכשיטי פנינים | DiamoNY"
    : currentCategory?.name
      ? `${currentCategory.name} | DiamoNY`
      : "קטלוג תכשיטים | DiamoNY";

  const pageDescription = isPearlCollection
    ? "קולקציית תכשיטי פנינים מעוצבים - תכשיטים יוקרתיים בעיצוב אישי מבית DiamoNY"
    : currentCategory?.description ||
      (currentCategory?.name
        ? `קולקציית ${currentCategory.name} - תכשיטים יוקרתיים בעיצוב אישי מבית DiamoNY`
        : "קטלוג התכשיטים המלא שלנו - טבעות, עגילים, שרשראות וצמידים בעיצוב אישי");

  const pageH1 = isPearlCollection ? "תכשיטי פנינים" : currentCategory?.name || "הקולקציה שלנו";

  const pageSubtitle = isPearlCollection
    ? "תכשיטי פנינים מעוצבים בעבודת יד - אלגנטיות על-זמנית"
    : currentCategory?.description || "כל תכשיט מיוצר בעבודת יד בישראל עם תשומת לב לפרטים הקטנים";

  const canonicalUrl = isPearlCollection
    ? `${SITE_URL}/collections/pearl-jewelry`
    : `${SITE_URL}/catalog${categorySlug ? `/${categorySlug}` : ""}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isPearlCollection ? "תכשיטי פנינים" : currentCategory?.name || "קטלוג תכשיטים",
    description: pageDescription,
    url: canonicalUrl,
    numberOfItems: totalCount,
    provider: { "@type": "Organization", name: "DiamoNY", url: SITE_URL },
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {effectiveCategorySlug && isCategoryHidden(effectiveCategorySlug) ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center" dir="rtl">
            <div className="max-w-md space-y-6">
              <h1 className="font-heading text-2xl md:text-3xl font-light tracking-wide">
                קולקציה זו מתעדכנת כרגע ותחזור בקרוב
              </h1>
              <p className="text-muted-foreground text-sm">
                אנו עובדים על עדכון הקולקציה. בינתיים, מזמינים אתכם לעיין בקולקציות האחרות שלנו.
              </p>
              <Button onClick={() => navigate("/catalog")} className="gap-2" variant="outline">
                חזרה לקולקציות
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="container-luxury page-top-section pb-0">
              <CatalogBreadcrumbs />
            </div>

            <section className="border-b border-border py-2 md:py-3">
              <div className="container-luxury text-center">
                <span className="text-accent font-light text-xs tracking-[0.3em] uppercase mb-1 block">
                  {isPearlCollection
                    ? "PEARL COLLECTION"
                    : currentCategory
                      ? currentCategory.name_en?.toUpperCase() || "COLLECTION"
                      : "JEWELRY COLLECTION"}
                </span>
                <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-light mb-1 tracking-[0.12em]">
                  {pageH1}
                </h1>
                <p className="text-muted-foreground max-w-xl mx-auto text-xs md:text-sm mb-0">
                  {pageSubtitle}
                </p>
              </div>
            </section>

            <section ref={collectionRef} id="collection" className="py-4 md:py-5 lg:py-6">
              <div className="container-luxury px-3 md:px-4 lg:px-6">
                <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
                  <CatalogSidebar
                    categoryTree={categoryTree}
                    categorySlug={categorySlug}
                    expandedCategories={expandedCategories}
                    stockFilter={stockFilter}
                    metalFilter={metalFilter}
                    hasActiveFilters={hasActiveFilters}
                    isActiveCategory={isActiveCategory}
                    onCategoryClick={handleCategoryClick}
                    onToggleCategoryExpand={toggleCategoryExpand}
                    onToggleStockFilter={toggleStockFilter}
                    onToggleMetalFilter={toggleMetalFilter}
                    onClearAllFilters={clearAllFilters}
                  />

                  <CatalogMobileFilters
                    isOpen={isMobileFilterOpen}
                    onOpenChange={setIsMobileFilterOpen}
                    categoryTree={categoryTree}
                    categorySlug={categorySlug}
                    stockFilter={stockFilter}
                    metalFilter={metalFilter}
                    hasActiveFilters={hasActiveFilters}
                    totalProducts={totalCount}
                    isActiveCategory={isActiveCategory}
                    onCategoryClick={handleCategoryClick}
                    onToggleStockFilter={toggleStockFilter}
                    onToggleMetalFilter={toggleMetalFilter}
                    onClearAllFilters={clearAllFilters}
                  />

                  <div className="flex-1 min-w-0 lg:pr-2">
                    <CatalogGrid
                      products={products}
                      totalCount={totalCount}
                      totalPages={totalPages}
                      currentPage={currentPage}
                      isLoading={isLoading || categoriesLoading}
                      isPageTransition={isPageTransition}
                      hasActiveFilters={hasActiveFilters}
                      categoryName={currentCategory?.name}
                      onPageChange={handlePageChange}
                      onClearAllFilters={clearAllFilters}
                    />
                  </div>
                </div>
              </div>
            </section>

            {currentCategory && currentCategory.mto_story && (
              <section className="bg-secondary/10 py-12 md:py-16">
                <div className="container-luxury">
                  <div className="max-w-3xl mx-auto text-center">
                    <h2 className="font-heading text-2xl md:text-3xl font-light mb-6 flex items-center justify-center gap-3">
                      <span>✨</span>
                      <span>אמנות היצירה</span>
                    </h2>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {currentCategory.mto_story}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
      <WhatsAppButton />
      <GoldBuyingBanner />
      <DesignAppointmentBanner />
    </>
  );
};

export default Catalog;
