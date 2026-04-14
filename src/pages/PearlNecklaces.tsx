import SpecializedCategoryPage from "@/components/SpecializedCategoryPage";
import type { SpecializedCategoryConfig } from "@/components/SpecializedCategoryPage";

const config: SpecializedCategoryConfig = {
  queryKey: "pearl-necklaces",
  filterField: "is_pearl_jewelry",
  categorySlug: "מחרוזת-פנינים",
  title: "מחרוזות פנינים",
  titleEn: "PEARL NECKLACES",
  subtitle: "קולקציית הפנינים הקלאסית",
  metaDescription: "קולקציית מחרוזות פנינים בלעדית – פנינים טבעיות, זהב 14K ו-18K, עיצוב קלאסי ועכשווי.",
  seoTitle: "מחרוזות פנינים – קולקציית תכשיטים",
  canonicalPath: "/category/pearl-necklaces",
  breadcrumbs: [{ label: "שרשראות", href: "/catalog/necklaces" }],
};

const PearlNecklaces = () => <SpecializedCategoryPage config={config} />;
export default PearlNecklaces;
