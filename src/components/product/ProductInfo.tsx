import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PriceDisplay from "@/components/ui/PriceDisplay";
import MetalSelector, { type MetalType } from "@/components/catalog/MetalSelector";
import ProductReviewCard from "@/components/ProductReviewCard";
import ProductStoryEditorial from "@/components/product/ProductStoryEditorial";

interface ProductStoryData {
  title: string;
  content_body: string | null;
  specs: { label: string; value: string }[] | null;
  pull_quote: string | null;
  story_part_1: string | null;
  story_part_2: string | null;
  story_images: { url: string; alt_text: string; linked_section: string }[] | null;
}

interface ProductInfoProps {
  product: any;
  category: { id: string; name: string; slug: string } | null;
  productStory: ProductStoryData | null;
  specs: { label: string; value: string | undefined }[];
  displaySku: string | null;
  priceDisplay: string | null;
  isMadeToOrder: boolean;
  hasVariants: boolean;
  variants: any[];
  selectedMetal: MetalType;
  onMetalSelect: (metal: MetalType) => void;
  hasImagesForMetal: (metal: MetalType) => boolean;
}

const ProductInfo = ({
  product,
  category,
  productStory,
  specs,
  displaySku,
  priceDisplay,
  isMadeToOrder,
  hasVariants,
  variants,
  selectedMetal,
  onMetalSelect,
  hasImagesForMetal,
}: ProductInfoProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const hasStructuredStory = productStory && (productStory.story_part_1 || productStory.story_part_2 || (productStory.specs && productStory.specs.length > 0));

  return (
    <div className="flex flex-col justify-start py-2 lg:py-4 gap-0">
      {category && (
        <Link to={`/catalog/${category.slug}`} className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors mb-2">
          {category.name}
        </Link>
      )}

      <h1 className="font-body text-[clamp(1.5rem,4vw,2.5rem)] font-bold tracking-[0.05em] mb-3 md:mb-4 leading-[1.15]">
        {product.name}
      </h1>

      {isMadeToOrder && (
        <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs font-medium tracking-widest uppercase px-4 py-1.5 mb-3 w-fit border-0">
          Made to Order
        </Badge>
      )}

      {priceDisplay && (
        <div className="mb-6">
          <PriceDisplay
            price={product.price ? product.price.toLocaleString("he-IL") : undefined}
            priceFrom={product.price_from ? product.price_from.toLocaleString("he-IL") : undefined}
            priceTo={product.price_to ? product.price_to.toLocaleString("he-IL") : undefined}
            isDiamondJewelry={product.is_diamond_jewelry ?? false}
            hasVariants={hasVariants}
            isCustomizable={product.is_customizable ?? false}
            size="lg"
            forcePrefix
          />
        </div>
      )}

      {hasVariants && (
        <div className="mb-6 pb-6 border-b border-border">
          <MetalSelector
            variants={variants.map((v) => ({
              id: v.id,
              variant_value: v.variant_value as MetalType,
              sku: v.sku || undefined,
              is_available: v.is_available,
              has_images: hasImagesForMetal(v.variant_value as MetalType),
            }))}
            selectedMetal={selectedMetal}
            onSelect={onMetalSelect}
            showLabels={true}
          />
        </div>
      )}

      {/* Description */}
      <section aria-labelledby="product-description" className="mt-4">
        <h2 id="product-description" className="sr-only">תיאור המוצר</h2>
        {(product.short_description || product.description) && (
          <p className="text-muted-foreground leading-[1.7] text-[15px] tracking-[0.01em] mb-4 font-normal">
            {product.short_description
              ? product.short_description.replace(/\{\{product_name\}\}/g, product.name)
              : product.description?.substring(0, 200).replace(/\{\{product_name\}\}/g, product.name) + "..."}
          </p>
        )}
      </section>

      {/* Read More */}
      {(product.description || product.mto_story || productStory?.content_body || hasStructuredStory) &&
        (product.description?.length > 200 || product.mto_story || productStory?.content_body || hasStructuredStory) && (
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="flex items-center gap-2 text-accent hover:text-accent/80 mb-3 transition-colors"
            aria-expanded={isDescriptionExpanded}
            aria-controls="expanded-description"
          >
            <span className="text-sm font-medium">{isDescriptionExpanded ? "הסתר פרטים" : "קרא עוד"}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDescriptionExpanded ? "rotate-180" : ""}`} />
          </button>
        )}

      <div
        id="expanded-description"
        className={`transition-[max-height,opacity] duration-[400ms] ease-in-out overflow-hidden ${isDescriptionExpanded ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"}`}
        aria-hidden={!isDescriptionExpanded}
      >
        {product.description &&
          (() => {
            const fullDesc = product.description.replace(/\{\{product_name\}\}/g, product.name);
            const shortDesc = product.short_description?.replace(/\{\{product_name\}\}/g, product.name) || "";
            let uniqueContent = "";
            if (product.short_description) {
              if (fullDesc.startsWith(shortDesc)) uniqueContent = fullDesc.substring(shortDesc.length).trim();
              else if (fullDesc !== shortDesc) uniqueContent = fullDesc;
            } else {
              uniqueContent = product.description.length > 200 ? fullDesc.substring(200).trim() : "";
            }
            return uniqueContent ? (
              <div className="mb-6">
                <p className="text-muted-foreground leading-[1.6] text-[15px] tracking-[0.01em] whitespace-pre-line font-normal">{uniqueContent}</p>
              </div>
            ) : null;
          })()}

        {product.mto_story && (
          <section className="bg-secondary/30 rounded-xl p-4 mb-6" aria-labelledby="creation-process">
            <h2 id="creation-process" className="font-heading font-normal text-lg mb-2 flex items-center gap-2">
              <span>✨</span> תהליך היצירה
            </h2>
            <p className="text-sm text-muted-foreground leading-[1.6] whitespace-pre-line font-normal">{product.mto_story}</p>
          </section>
        )}

        {/* New structured editorial story layout */}
        {hasStructuredStory && productStory && (
          <ProductStoryEditorial story={productStory} productName={product.name} />
        )}

        {/* Fallback: legacy content_body only if no structured story */}
        {!hasStructuredStory && productStory?.content_body && (
          <section className="bg-secondary/20 rounded-xl p-5 mb-6 border border-secondary/30" aria-labelledby="product-story-full">
            <h2 id="product-story-full" className="font-heading font-normal text-lg mb-3">
              {productStory.title || "הסיפור שלנו"}
            </h2>
            <div className="text-sm text-muted-foreground leading-[1.6] whitespace-pre-line font-normal">
              {productStory.content_body.replace(/\{\{product_name\}\}/g, product.name)}
            </div>
          </section>
        )}
      </div>

      {/* Specs */}
      {specs.length > 0 && (
        <section aria-labelledby="product-specifications" className="mb-4">
          <h2 id="product-specifications" className="font-heading text-lg font-normal mb-3">המפרט לתכשיט</h2>
          <dl className="space-y-2 pb-4 border-b border-border">
            {specs.map((spec, index) => (
              <div key={index} className="flex justify-between text-sm">
                <dt className="text-muted-foreground font-normal">{spec.label}</dt>
                <dd className="font-medium">{spec.value}</dd>
              </div>
            ))}
            {displaySku && (
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground font-normal">מק״ט</dt>
                <dd className="font-mono text-xs">{displaySku}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <ProductReviewCard reviewId={(product as any).featured_review_id} />
    </div>
  );
};

export default ProductInfo;
