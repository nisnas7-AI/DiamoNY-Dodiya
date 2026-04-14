import SpecializedCategoryPage from "@/components/SpecializedCategoryPage";
import type { SpecializedCategoryConfig } from "@/components/SpecializedCategoryPage";

const config: SpecializedCategoryConfig = {
  queryKey: "mens-jewelry",
  filterField: "is_mens_jewelry",
  title: "תכשיטים לגברים",
  titleEn: "MEN'S JEWELRY",
  subtitle: "קולקציית תכשיטי הגברים הבלעדית",
  metaDescription: "קולקציית תכשיטים לגברים – עיצובים ייחודיים בזהב 14K ו-18K, התאמה אישית מלאה.",
  seoTitle: "תכשיטים לגברים – קולקציית תכשיטים",
  canonicalPath: "/category/mens-jewelry",
  breadcrumbs: [],
};

const MensJewelry = () => <SpecializedCategoryPage config={config} />;
export default MensJewelry;
