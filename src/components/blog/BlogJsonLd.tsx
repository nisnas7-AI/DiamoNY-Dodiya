import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/siteConfig";
import { Json } from "@/integrations/supabase/types";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/lib/seoSchemas";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  custom_json_ld?: Json | null;
  faq_data?: Json | null;
}

interface BlogJsonLdProps {
  post: BlogPost;
}

interface FAQItem {
  question: string;
  answer: string;
}

const AUTHOR = {
  "@type": "Person" as const,
  name: "ניצן יעקובי",
  jobTitle: "Master Goldsmith & Diamond Expert",
  url: `${SITE_URL}/#organization`,
  worksFor: { "@type": "Organization" as const, name: "DiamoNY" },
};

const isRecord = (value: Json | null | undefined): value is Record<string, Json> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isFaqPageSchema = (value: Json | null | undefined): boolean =>
  isRecord(value) && value["@type"] === "FAQPage";

const parseStoredFaqData = (value: Json | null | undefined): FAQItem[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        const question = typeof item.question === "string" ? item.question.trim() : "";
        const answer = typeof item.answer === "string" ? item.answer.trim() : "";
        return question && answer ? { question, answer } : null;
      })
      .filter((item): item is FAQItem => Boolean(item));
  }

  if (isFaqPageSchema(value)) {
    const schemaRecord = value as Record<string, Json>;
    const mainEntity = schemaRecord["mainEntity"];
    if (!Array.isArray(mainEntity)) return [];

    return mainEntity
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        const record = item as Record<string, Json>;
        const question = typeof record.name === "string" ? record.name.trim() : "";
        const acceptedAnswer =
          record.acceptedAnswer && typeof record.acceptedAnswer === "object" && !Array.isArray(record.acceptedAnswer)
            ? (record.acceptedAnswer as Record<string, Json>)
            : null;
        const answer = acceptedAnswer && typeof acceptedAnswer.text === "string" ? acceptedAnswer.text.trim() : "";
        return question && answer ? { question, answer } : null;
      })
      .filter((item): item is FAQItem => Boolean(item));
  }

  return [];
};

export const BlogJsonLd = ({ post }: BlogJsonLdProps) => {
  const siteUrl = SITE_URL;
  const articleUrl = `${siteUrl}/blog/${post.slug}`;
  const raw = post.content || "";

  const isHtml = /<h[1-6][^>]*>/i.test(raw);
  const isTechnicalGuide =
    /14K|18K|קראט|יהלום|גמולוגי|4C|clarity|carat/i.test(post.title) ||
    /14K|18K|קראט|גמולוגי/i.test(raw.substring(0, 500));

  const generateFAQItemsFromContent = () => {
    const items: FAQItem[] = [];

    if (isHtml) {
      const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
      let match: RegExpExecArray | null;
      const headings: { question: string; end: number }[] = [];

      while ((match = headingRegex.exec(raw)) !== null) {
        const text = match[1].replace(/<[^>]*>/g, "").trim();
        if (text && text.endsWith("?")) {
          headings.push({ question: text, end: match.index + match[0].length });
        }
      }

      headings.slice(0, 8).forEach((entry, i) => {
        const nextHeadingIdx = headings[i + 1] ? raw.indexOf("<h", entry.end + 1) : raw.length;
        const answerHtml = raw.substring(entry.end, nextHeadingIdx > entry.end ? nextHeadingIdx : undefined);
        const answerText = answerHtml.replace(/<[^>]*>/g, "").trim().substring(0, 300);
        items.push({ question: entry.question, answer: answerText || entry.question });
      });
    } else {
      const lines = raw.split("\n");
      for (let i = 0; i < lines.length && items.length < 8; i++) {
        const match = lines[i].match(/^#{2,3}\s+(.+)/);
        if (!match) continue;
        const question = match[1].trim();
        if (!question.endsWith("?")) continue;
        const answerLines: string[] = [];
        for (let j = i + 1; j < lines.length; j++) {
          if (/^#{2,3}\s+/.test(lines[j])) break;
          const line = lines[j].trim();
          if (line) answerLines.push(line);
        }
        const answer = answerLines.join(" ").substring(0, 300);
        items.push({ question, answer: answer || question });
      }
    }

    return items;
  };

  const brand = { name: "DiamoNY", url: siteUrl, logoUrl: `${siteUrl}/diamony-logo-email.png` };

  const plainContent = raw.replace(/<[^>]*>/g, "");
  const abstractText = post.excerpt || plainContent.split(/\s+/).slice(0, 60).join(" ").replace(/[.,]$/, "");
  const descriptionText = post.meta_description || (abstractText.length > 160 ? abstractText.substring(0, 157) + "..." : abstractText);

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": isTechnicalGuide ? "TechArticle" : "BlogPosting",
    headline: post.meta_title || post.title,
    abstract: abstractText,
    description: descriptionText,
    url: articleUrl,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    ...(post.featured_image_url ? { image: post.featured_image_url } : {}),
    publisher: {
      "@type": "Organization",
      name: brand.name,
      url: brand.url,
      logo: { "@type": "ImageObject", url: brand.logoUrl },
    },
    author: AUTHOR,
    articleSection: "תכשיטים ויהלומים",
    inLanguage: "he-IL",
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "בית", url: siteUrl },
    { name: "בלוג", url: `${siteUrl}/blog` },
    { name: post.title, url: articleUrl },
  ]);

  const storedFaqItems = parseStoredFaqData(post.faq_data);
  const fallbackFaqItems = storedFaqItems.length === 0 ? generateFAQItemsFromContent() : [];
  const faqItems = storedFaqItems.length > 0 ? storedFaqItems : fallbackFaqItems;
  const faqSchema = faqItems.length > 0 ? buildFaqSchema(faqItems) : null;
  const customSchema = isFaqPageSchema(post.custom_json_ld) ? null : post.custom_json_ld;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(blogPostingSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      {customSchema && <script type="application/ld+json">{JSON.stringify(customSchema)}</script>}
    </Helmet>
  );
};

export default BlogJsonLd;
