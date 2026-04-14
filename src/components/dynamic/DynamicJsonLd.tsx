import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useBrandSettings } from "@/contexts/BrandSettingsContext";
import { buildArticleSchema, buildFaqSchema } from "@/lib/seoSchemas";
import type { ContentBlocks, FaqBlockData } from "./types";

interface DynamicJsonLdProps {
  page: {
    slug: string;
    seo_title: string | null;
    meta_description: string | null;
    h1_title: string | null;
    updated_at: string;
    created_at: string;
  };
  contentBlocks: ContentBlocks | null;
}

const DynamicJsonLd = ({ page, contentBlocks }: DynamicJsonLdProps) => {
  const brand = useBrandSettings();

  const schemas = useMemo(() => {
    const result: object[] = [];

    result.push(
      buildArticleSchema({
        headline: page.h1_title || page.seo_title || brand.brand_name,
        description: page.meta_description || "",
        url: `${brand.site_url}/page/${page.slug}`,
        datePublished: page.created_at,
        dateModified: page.updated_at,
        lang: "he-IL",
        brand: { name: brand.brand_name, url: brand.site_url, logoUrl: `${brand.site_url}/favicon.png` },
      })
    );

    if (contentBlocks?.blocks) {
      const allFaqItems: { question: string; answer: string }[] = [];
      for (const block of contentBlocks.blocks) {
        if (block.type === "faq") {
          const faqData = block.data as FaqBlockData;
          if (faqData.items) allFaqItems.push(...faqData.items);
        }
      }
      if (allFaqItems.length > 0) {
        result.push(buildFaqSchema(allFaqItems));
      }
    }

    return result;
  }, [page, contentBlocks, brand]);

  if (schemas.length === 0) return null;

  return (
    <Helmet>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default DynamicJsonLd;
