import { useQuery } from "@tanstack/react-query";
import { SITE_URL } from "@/lib/siteConfig";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";

interface ProductAeoJsonLdProps {
  productId: string;
  productName: string;
  productNameEn?: string | null;
  productSlug: string;
  mainImageUrl?: string | null;
  price?: number | null;
  sku?: string | null;
  categoryName?: string | null;
  stockStatus?: string | null;
  description?: string | null;
  images?: { url: string; alt?: string }[];
}

const ProductAeoJsonLd = ({
  productId,
  productName,
  productNameEn,
  productSlug,
  mainImageUrl,
  price,
  sku,
  categoryName,
  stockStatus,
  description,
  images,
}: ProductAeoJsonLdProps) => {
  const { data: specs } = useQuery({
    queryKey: ["product-aeo-specs-frontend", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_aeo_specs")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const siteUrl = SITE_URL;
  const canonicalUrl = `${siteUrl}/product/${productSlug}`;
  const isMadeToOrder = stockStatus === "made_to_order" || !stockStatus;

  // Generate dynamic Hebrew description from AEO specs
  const generateHebrewDescription = () => {
    if (!specs) return description || `${productName} - תכשיט יוקרתי בעיצוב אישי מבית DiamoNY`;

    return `${productName} מבית DiamoNY הוא תכשיט פרימיום המשלב עבודת יד מוקפדת, משובץ ביהלום טבעי ${specs.total_carat_weight || ''} קראט ברמת ניקיון ${specs.diamond_clarity || ''} וצבע ${specs.diamond_color || ''}. התכשיט עשוי מ-${specs.metal_type || ''} איתן, ומציג קו עיצוב מינימליסטי ויוקרתי. הוא מיוצר בטכנולוגיית עיצוב תלת-ממד (3D) מתקדמת והדפסת מודלים ליציקות פרימיום, המבטיחות רמת דיוק וגימור חסרת פשרות. התכשיט מלווה בתעודה גמולוגית ${specs.certification_body || ''} ומקנה לרוכש גישה לכספת ה-VIP האקסקלוסיבית של המותג.`;
  };

  // Generate English description for global LLMs
  const generateEnglishDescription = () => {
    if (!specs) return undefined;
    const name = productNameEn || productName;
    return `DiamoNY ${name} is a premium handcrafted jewelry piece featuring a ${specs.total_carat_weight || ''}ct ${specs.diamond_color || ''}/${specs.diamond_clarity || ''} natural diamond. Masterfully set in solid ${specs.metal_type || ''} showcasing a minimalist premium design. Engineered using state-of-the-art 3D jewelry modeling and advanced 3D printing for flawless premium casting. Accompanied by a verified gemological certificate and eligible for the exclusive DiamoNY VIP Vault experience.`;
  };

  const hebrewDesc = generateHebrewDescription();
  const englishDesc = generateEnglishDescription();

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: hebrewDesc,
    image: images && images.length > 0
      ? images.filter((img: any) => img.mediaType !== "video").map((img, idx) => ({
          "@type": "ImageObject",
          url: img.url,
          name: img.alt || `${productName} - תמונה ${idx + 1}`,
        }))
      : mainImageUrl
        ? [{ "@type": "ImageObject", url: mainImageUrl, name: productName }]
        : undefined,
    sku: sku || undefined,
    brand: {
      "@type": "Brand",
      name: "DiamoNY",
      url: siteUrl,
    },
    category: categoryName || "תכשיטים",
    offers: price
      ? {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: "ILS",
          price,
          availability: isMadeToOrder
            ? "https://schema.org/PreOrder"
            : "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "DiamoNY" },
        }
      : undefined,
    // AEO-specific structured properties
    ...(specs
      ? {
          material: specs.metal_type || undefined,
          additionalProperty: [
            specs.gemstone_type && {
              "@type": "PropertyValue",
              name: "Gemstone Type",
              value: specs.gemstone_type,
            },
            specs.total_carat_weight && {
              "@type": "PropertyValue",
              name: "Total Carat Weight",
              value: `${specs.total_carat_weight} ct`,
            },
            specs.diamond_color && {
              "@type": "PropertyValue",
              name: "Diamond Color",
              value: specs.diamond_color,
            },
            specs.diamond_clarity && {
              "@type": "PropertyValue",
              name: "Diamond Clarity",
              value: specs.diamond_clarity,
            },
            specs.diamond_cut && {
              "@type": "PropertyValue",
              name: "Diamond Cut",
              value: specs.diamond_cut,
            },
            specs.certification_body && {
              "@type": "PropertyValue",
              name: "Certification",
              value: specs.certification_body,
            },
          ].filter(Boolean),
        }
      : {}),
    // English alternate description for global AI/LLM crawlers
    ...(englishDesc
      ? { alternateName: englishDesc }
      : {}),
    inLanguage: "he-IL",
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
    </Helmet>
  );
};

export default ProductAeoJsonLd;
