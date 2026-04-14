import SpecializedCategoryPage from "@/components/SpecializedCategoryPage";
import type { SpecializedCategoryConfig } from "@/components/SpecializedCategoryPage";

const config: SpecializedCategoryConfig = {
  queryKey: "engagement-rings",
  filterField: "is_engagement_ring",
  title: "טבעות אירוסין",
  titleEn: "ENGAGEMENT RINGS",
  subtitle: "קולקציית טבעות האירוסין הבלתי מתפשרת",
  metaDescription: "קולקציית טבעות אירוסין בלעדית – יהלומים טבעיים, זהב 14K ו-18K, עיצוב אישי בהתאמה מלאה.",
  seoTitle: "טבעות אירוסין – קולקציית יהלומים",
  canonicalPath: "/category/engagement-rings",
  breadcrumbs: [{ label: "טבעות", href: "/catalog/rings" }],
  showRelatedArticles: true,
};

const EngagementRings = () => <SpecializedCategoryPage config={config} />;
export default EngagementRings;
