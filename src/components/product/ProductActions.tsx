import { Link } from "react-router-dom";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MetalType, METAL_CONFIGS } from "@/components/catalog/MetalSelector";
import ProductTrustBadges from "./ProductTrustBadges";
import ArtisanBadge from "./ArtisanBadge";

interface ProductActionsProps {
  productName: string;
  displaySku: string | null;
  hasVariants: boolean;
  selectedMetal: MetalType;
  category: { slug: string } | null;
}

const ProductActions = ({ productName, displaySku, hasVariants, selectedMetal, category }: ProductActionsProps) => {
  const handleWhatsApp = () => {
    const metalLabel = hasVariants ? ` | ${METAL_CONFIGS[selectedMetal].label}` : "";
    const skuPart = displaySku ? ` (מק״ט: ${displaySku})` : "";
    const message = `היי, אשמח לקבל מידע נוסף על: ${productName}${metalLabel}${skuPart}`;
    window.open(`https://wa.me/972546290534?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-3 mt-2">
      <Button
        size="lg"
        className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground hover:scale-[1.02] hover:brightness-110 hover:shadow-lg transition-all duration-300 ease-out"
        onClick={handleWhatsApp}
        aria-label={`שלח הודעה בוואטסאפ בנוגע ל${productName}`}
      >
        <MessageCircle className="h-5 w-5" />
        שלח הודעה בוואטסאפ
      </Button>

      <Link
        to={category ? `/catalog/${category.slug}` : "/catalog"}
        className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 justify-center"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לקולקציה
      </Link>

      <ProductTrustBadges />
      <ArtisanBadge />
    </div>
  );
};

export default ProductActions;
