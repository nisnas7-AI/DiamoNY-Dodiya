import SpecializedCategoryPage from "@/components/SpecializedCategoryPage";
import type { SpecializedCategoryConfig } from "@/components/SpecializedCategoryPage";

const config: SpecializedCategoryConfig = {
  queryKey: "mens-pendants",
  filterField: "is_mens_pendant",
  title: "תליונים לגברים",
  titleEn: "MEN'S PENDANTS",
  subtitle: "קולקציית תליוני הגברים הבלעדית",
  metaDescription: "קולקציית תליונים לגברים – עיצובים ייחודיים בזהב 14K ו-18K, התאמה אישית מלאה.",
  seoTitle: "תליונים לגברים – קולקציית תכשיטים",
  canonicalPath: "/category/mens-pendants",
  breadcrumbs: [],
};

const MensPendants = () => <SpecializedCategoryPage config={config} />;
export default MensPendants;
