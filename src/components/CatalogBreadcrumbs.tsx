import { Link, useParams } from "react-router-dom";
import { SITE_URL } from "@/lib/siteConfig";
import { ChevronLeft, Home } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useCategories } from "@/hooks/useCategories";

interface BreadcrumbItem {
  name: string;
  url: string;
  isCurrentPage?: boolean;
}

const CatalogBreadcrumbs = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const { flatCategories, getCategoryBySlug, getParentCategory } = useCategories();

  // Build breadcrumb trail with recursive parent traversal
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { name: "דף הבית", url: "/" },
      { name: "קולקציות", url: "/catalog" },
    ];

    if (!categorySlug) {
      breadcrumbs[breadcrumbs.length - 1].isCurrentPage = true;
      return breadcrumbs;
    }

    const currentCategory = getCategoryBySlug(categorySlug);
    if (!currentCategory) {
      return breadcrumbs;
    }

    // Recursively build parent trail (deepest ancestor first)
    const trail: typeof flatCategories = [];
    let current: typeof currentCategory | undefined = currentCategory;
    while (current) {
      trail.unshift(current);
      current = getParentCategory(current.id);
    }

    // Add all parents (except the last one which is the current category)
    trail.slice(0, -1).forEach(cat => {
      breadcrumbs.push({
        name: cat.name,
        url: `/catalog/${cat.slug}`,
      });
    });

    // Add current category as the final item
    breadcrumbs.push({
      name: currentCategory.name,
      url: `/catalog/${currentCategory.slug}`,
      isCurrentPage: true,
    });

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  // JSON-LD Schema for SEO
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  // Get parent for mobile back navigation
  const getParentBreadcrumb = () => {
    if (breadcrumbs.length >= 2) {
      return breadcrumbs[breadcrumbs.length - 2];
    }
    return null;
  };

  const parentBreadcrumb = getParentBreadcrumb();

  return (
    <>
      {/* JSON-LD Schema */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchema)}
        </script>
      </Helmet>

      {/* Desktop Breadcrumbs */}
      <nav 
        aria-label="Breadcrumb" 
        className="hidden md:block opacity-50 hover:opacity-100 transition-opacity duration-300"
      >
        <ol className="flex items-center gap-1 text-xs">
          {breadcrumbs.map((item, index) => (
            <li key={item.url} className="flex items-center">
              {index > 0 && (
                <ChevronLeft className="w-3 h-3 mx-2 text-muted-foreground/50" />
              )}
              {item.isCurrentPage ? (
                <span className="text-foreground font-medium">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="text-muted-foreground hover:text-accent transition-colors duration-300 flex items-center gap-1"
                >
                  {index === 0 && <Home className="w-3 h-3" />}
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Mobile Back Navigation */}
      {parentBreadcrumb && (
        <nav 
          aria-label="Back navigation" 
          className="md:hidden opacity-50 hover:opacity-100 transition-opacity duration-300"
        >
          <Link
            to={parentBreadcrumb.url}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors duration-300"
          >
            <ChevronLeft className="w-3 h-3 rotate-180" />
            <span>חזרה ל{parentBreadcrumb.name}</span>
          </Link>
        </nav>
      )}
    </>
  );
};

export default CatalogBreadcrumbs;