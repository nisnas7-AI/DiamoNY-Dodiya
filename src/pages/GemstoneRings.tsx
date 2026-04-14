import SpecializedCategoryPage from "@/components/SpecializedCategoryPage";
import type { SpecializedCategoryConfig } from "@/components/SpecializedCategoryPage";

const config: SpecializedCategoryConfig = {
  queryKey: "gemstone-rings",
  filterField: "is_gemstone_ring",
  title: "טבעות אבני חן",
  titleEn: "GEMSTONE RINGS",
  subtitle: "קולקציית אבני החן הייחודית",
  metaDescription: "קולקציית טבעות אבני חן בלעדית – אבני חן טבעיות, זהב 14K ו-18K, עיצוב אישי בהתאמה מלאה.",
  seoTitle: "טבעות אבני חן – קולקציית תכשיטים",
  canonicalPath: "/category/gemstone-rings",
  breadcrumbs: [{ label: "טבעות", href: "/catalog/rings" }],
};

const GemstoneRings = () => <SpecializedCategoryPage config={config} />;
export default GemstoneRings;
