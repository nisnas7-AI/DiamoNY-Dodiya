/**
 * Consolidated SEO JSON-LD Schema Utilities
 * Single source of truth for all structured data schemas.
 */

export interface BrandInfo {
  name: string;
  url: string;
  logoUrl?: string;
}

import { SITE_URL } from "./siteConfig";

const DEFAULT_BRAND: BrandInfo = {
  name: "DiamoNY",
  url: SITE_URL,
  logoUrl: `${SITE_URL}/favicon.png`,
};

/* ── Organisation / Publisher ── */
export const buildPublisherSchema = (brand: BrandInfo = DEFAULT_BRAND) => ({
  "@type": "Organization",
  name: brand.name,
  url: brand.url,
  ...(brand.logoUrl
    ? { logo: { "@type": "ImageObject", url: brand.logoUrl } }
    : {}),
});

/* ── BreadcrumbList ── */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const buildBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});

/* ── Article ── */
export interface ArticleSchemaInput {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  imageUrl?: string;
  section?: string;
  lang?: string;
  brand?: BrandInfo;
}

export const buildArticleSchema = (input: ArticleSchemaInput) => {
  const brand = input.brand || DEFAULT_BRAND;
  const publisher = buildPublisherSchema(brand);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    publisher,
    author: { "@type": "Organization", name: brand.name },
    ...(input.section ? { articleSection: input.section } : {}),
    inLanguage: input.lang || "he-IL",
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
  };
};

/* ── FAQPage ── */
export const buildFaqSchema = (
  items: { question: string; answer: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
});

/* ── LocalBusiness (JewelryStore) ── */
export const buildLocalBusinessSchema = (brand: BrandInfo = DEFAULT_BRAND) => ({
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: brand.name,
  url: brand.url,
  telephone: "+972-52-345-6789",
  address: {
    "@type": "PostalAddress",
    addressCountry: "IL",
    addressLocality: "Israel",
  },
  priceRange: "₪₪₪",
  image: brand.logoUrl || `${brand.url}/favicon.png`,
});
