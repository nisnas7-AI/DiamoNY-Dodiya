import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { Calendar, ArrowRight, Clock, Share2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { BlogAdminToolbar } from "./BlogAdminToolbar";

import { BlogJsonLd } from "./BlogJsonLd";
import { Blog4CsBanner } from "./Blog4CsBanner";
import { BlogAuthorBio } from "./BlogAuthorBio";
import { Json } from "@/integrations/supabase/types";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { sanitizeHtml } from "@/lib/sanitize";

const isHtmlContent = (content: string): boolean => {
  return /<(h[1-6]|p|div|ul|ol|li|blockquote|img|a|strong|em|br|hr)[^>]*>/i.test(content);
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
  featured_media_type?: string | null;
  is_published: boolean | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  faq_data?: Json | null;
}

const getEmbedUrl = (url: string): string | null => {
  const yt = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
};
const isEmbedUrl = (url: string): boolean => getEmbedUrl(url) !== null;

const processEntityLinks = (text: string): string => {
  const entityMap: Record<string, string> = {
    "זהב 18K": "/catalog?gold_type=18k",
    "זהב 14K": "/catalog?gold_type=14k",
    "זהב צהוב": "/catalog?gold_type=yellow",
    "זהב לבן": "/catalog?gold_type=white",
    "זהב רוזה": "/catalog?gold_type=rose",
    "יהלום": "/catalog?category=diamonds",
    "יהלומים": "/catalog?category=diamonds",
    "טבעת אירוסין": "/catalog/engagement-rings",
    "טבעות אירוסין": "/catalog/engagement-rings",
    "שרשרת": "/catalog/necklaces",
    "עגילים": "/catalog/earrings",
    "צמיד": "/catalog/bracelets",
  };
  let processed = text;
  Object.entries(entityMap).forEach(([keyword, url]) => {
    const regex = new RegExp(`(?<!\\[)${keyword}(?!\\])`, "g");
    processed = processed.replace(regex, `[${keyword}](${url})`);
  });
  return processed;
};

const calculateReadingTime = (content: string): number => {
  const wordCount = content?.split(/\s+/).length || 0;
  return Math.max(1, Math.ceil(wordCount / 200));
};

/* ── Executive Summary (AEO) ── */
const ExecutiveSummary = ({ content, title }: { content: string; title: string }) => {
  const summary = content
    .replace(/<[^>]*>/g, "")
    .split(/\s+/)
    .slice(0, 60)
    .join(" ")
    .replace(/[.,]$/, "");

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-3 md:mb-4 rounded-xl py-3 px-5 md:py-4 md:px-6"
      style={{
        borderRight: "3px solid #D4AF37",
        background: "#FDFBF7",
      }}
      role="note"
      aria-label="סיכום מנהלים"
      itemScope
      itemType="https://schema.org/Answer"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4" style={{ color: "#856404" }} />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#856404" }}>
          Executive Summary
        </span>
      </div>
      <blockquote className="font-body text-lg md:text-xl leading-relaxed italic text-foreground/85" itemProp="text">
        "{summary}."
      </blockquote>
      <div className="hidden">
        <span itemProp="name">{title}</span>
      </div>
    </motion.aside>
  );
};

/* ── Inject 4Cs banner after 2nd paragraph in HTML content ── */
const injectBannerIntoHtml = (html: string): { before: string; after: string } => {
  let count = 0;
  let splitIdx = -1;
  const regex = /<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    count++;
    if (count === 2) {
      splitIdx = match.index + match[0].length;
      break;
    }
  }
  if (splitIdx === -1) return { before: html, after: "" };
  return { before: html.substring(0, splitIdx), after: html.substring(splitIdx) };
};

interface BlogArticleTemplateProps {
  post: BlogPost;
}

export const BlogArticleTemplate = ({ post }: BlogArticleTemplateProps) => {
  const { isAdmin } = useAdminAuth();
  const [toolbarSettings, setToolbarSettings] = useState({
    enableFloatingFrames: true,
    fontSize: "lg",
    headerOverlay: false,
  });

  const readingTime = calculateReadingTime(post.content || "");
  const contentIsHtml = useMemo(() => isHtmlContent(post.content || ""), [post.content]);

  // Deduplicate: strip leading content that matches the executive summary
  const deduplicatedContent = useMemo(() => {
    const raw = post.content || "";
    const summaryPlain = (post.excerpt || raw.replace(/<[^>]*>/g, "")).split(/\s+/).slice(0, 60).join(" ").replace(/[.,]$/, "").trim();
    if (!summaryPlain || summaryPlain.length < 20) return raw;

    // Normalize text for comparison
    const normalize = (t: string) => t.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").replace(/[""״׳']/g, "").trim();
    const normSummary = normalize(summaryPlain);

    if (contentIsHtml) {
      // For HTML: try to strip matching leading <p> tags
      const pRegex = /^(\s*<p[^>]*>[\s\S]*?<\/p>\s*)/i;
      let result = raw;
      const firstMatch = result.match(pRegex);
      if (firstMatch) {
        const firstPText = normalize(firstMatch[1]);
        // Check if summary starts with / contains first paragraph or vice versa
        if (normSummary.startsWith(firstPText.substring(0, Math.min(40, firstPText.length))) ||
            firstPText.startsWith(normSummary.substring(0, Math.min(40, normSummary.length)))) {
          result = result.substring(firstMatch[0].length);
        }
      }
      return result;
    } else {
      // For Markdown: strip first paragraph if it matches
      const lines = raw.split("\n");
      let firstParaEnd = -1;
      let firstParaLines: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed && firstParaLines.length > 0) { firstParaEnd = i; break; }
        if (trimmed && !/^[#>*\-\d]/.test(trimmed)) firstParaLines.push(trimmed);
        else if (firstParaLines.length > 0) { firstParaEnd = i; break; }
      }
      if (firstParaLines.length > 0) {
        const firstParaText = normalize(firstParaLines.join(" "));
        if (normSummary.startsWith(firstParaText.substring(0, Math.min(40, firstParaText.length))) ||
            firstParaText.startsWith(normSummary.substring(0, Math.min(40, normSummary.length)))) {
          return lines.slice(firstParaEnd === -1 ? firstParaLines.length : firstParaEnd).join("\n").replace(/^\s+/, "");
        }
      }
      return raw;
    }
  }, [post.content, post.excerpt, contentIsHtml]);

  const processedContent = processEntityLinks(deduplicatedContent);
  const quickAnswer = post.excerpt || (post.content?.replace(/<[^>]*>/g, "").split(/\s+/).slice(0, 50).join(" ") + "...");

  const imageClasses = toolbarSettings.enableFloatingFrames
    ? "rounded-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-border/20"
    : "rounded-lg";

  const fontSizeMap: Record<string, string> = {
    sm: "prose-sm",
    base: "prose-base",
    lg: "prose-lg",
    xl: "prose-xl",
  };

  const htmlParts = contentIsHtml ? injectBannerIntoHtml(deduplicatedContent) : null;

  return (
    <>
      <BlogJsonLd post={post} />

      {isAdmin && (
        <BlogAdminToolbar
          postId={post.id}
          settings={toolbarSettings}
          onSettingsChange={setToolbarSettings}
        />
      )}

      <article className="blog-container" itemScope itemType="https://schema.org/Article">
        {/* Breadcrumbs */}
        <nav className="mb-1" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/" className="hover:text-accent transition-colors" itemProp="item"><span itemProp="name">בית</span></Link>
              <meta itemProp="position" content="1" />
            </li>
            <li className="mx-1">/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/blog" className="hover:text-accent transition-colors" itemProp="item"><span itemProp="name">בלוג</span></Link>
              <meta itemProp="position" content="2" />
            </li>
            <li className="mx-1">/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="text-foreground font-medium truncate max-w-[200px]">{post.title}</span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

        <Link to="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent mb-3 transition-colors group text-sm">
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          חזרה לבלוג
        </Link>

        {/* Pre-Header Insight: Executive Summary */}
        <ExecutiveSummary content={quickAnswer} title={post.title} />

        {/* Article Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
          <time className="flex items-center gap-2" dateTime={post.published_at || post.created_at} itemProp="datePublished">
            <Calendar className="h-4 w-4" />
            {format(new Date(post.published_at || post.created_at), "dd MMMM yyyy", { locale: he })}
          </time>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {readingTime} דקות קריאה
          </span>
          <button
            onClick={() => navigator.share?.({ title: post.title, url: window.location.href })}
            className="flex items-center gap-2 hover:text-accent transition-colors mr-auto"
            aria-label="שתף מאמר"
          >
            <Share2 className="h-4 w-4" />
            שתף
          </button>
        </div>

        {/* The Headline */}
        <header className="mb-6">
          <h1
            className="font-heading text-3xl md:text-5xl text-center mb-3 md:mb-4"
            style={{ color: "#856404", letterSpacing: "-0.02em" }}
            itemProp="headline"
          >
            {post.title}
          </h1>

          {/* excerpt already rendered in Executive Summary above — no duplicate here */}
        </header>

        {/* Featured Media */}
        {post.featured_image_url && (
          <motion.figure
            className={`aspect-video overflow-hidden mb-10 ${imageClasses}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {post.featured_media_type === "video" ? (
              isEmbedUrl(post.featured_image_url) ? (
                <iframe
                  src={getEmbedUrl(post.featured_image_url) || post.featured_image_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={post.title}
                />
              ) : (
                <video src={post.featured_image_url} className="w-full h-full object-cover" controls autoPlay muted loop playsInline itemProp="video" />
              )
            ) : (
              <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" itemProp="image" loading="lazy" width={800} height={450} />
            )}
          </motion.figure>
        )}

        {/* Article Content */}
        {contentIsHtml && htmlParts ? (
          <div className={`blog-prose ${fontSizeMap[toolbarSettings.fontSize] || "prose-lg"} max-w-none`} itemProp="articleBody">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlParts.before) }} />
            <Blog4CsBanner />
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlParts.after) }} />
          </div>
        ) : (
          <div className={`${fontSizeMap[toolbarSettings.fontSize] || "prose-lg"} max-w-none`} itemProp="articleBody">
            <MarkdownRenderer content={processedContent} imageClasses={imageClasses} enableFloatingFrames={toolbarSettings.enableFloatingFrames} />
          </div>
        )}

        {/* Author Bio (EEAT) */}
        <BlogAuthorBio />

        {/* Article Footer Meta */}
        <footer className="mt-8 pt-6 border-t border-border/30">
          <meta itemProp="author" content="ניצן יעקובי" />
          <meta itemProp="dateModified" content={post.updated_at} />
          <div className="hidden" itemScope itemType="https://schema.org/Organization" itemProp="publisher">
            <meta itemProp="name" content="DiamoNY" />
          </div>
        </footer>
      </article>
    </>
  );
};

/* ── Markdown Renderer (extracted) ── */
const MarkdownRenderer = ({
  content,
  imageClasses,
  enableFloatingFrames,
}: {
  content: string;
  imageClasses: string;
  enableFloatingFrames: boolean;
}) => {
  // Split content to inject 4Cs banner after 2nd paragraph
  const lines = content.split("\n");
  let pCount = 0;
  let splitLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() && !/^[#>*\-\d]/.test(lines[i].trim())) {
      pCount++;
      if (pCount === 2) { splitLine = i + 1; break; }
    }
  }

  const beforeBanner = splitLine > 0 ? lines.slice(0, splitLine).join("\n") : content;
  const afterBanner = splitLine > 0 ? lines.slice(splitLine).join("\n") : "";

  const mdComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-4xl md:text-5xl font-heading text-center mb-12 mt-8" style={{ color: "#856404", letterSpacing: "-0.02em" }}>{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl md:text-3xl font-heading font-bold mt-16 mb-6" style={{ color: "#856404", borderRight: "3px solid #856404", paddingRight: "16px" }}>{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-heading font-bold mt-12 mb-5 p-5 rounded-lg" style={{ backgroundColor: "#F9F9F9", color: "#856404", borderRight: "3px solid #856404" }}>{children}</h3>
    ),
    p: ({ children }: any) => (
      <p className="mb-8 leading-relaxed font-body" style={{ color: "#333", lineHeight: "1.8", maxWidth: "75ch" }}>{children}</p>
    ),
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-8 space-y-3 font-body" style={{ color: "#333" }}>{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-8 space-y-3 font-body" style={{ color: "#333" }}>{children}</ol>,
    li: ({ children }: any) => <li className="leading-relaxed" style={{ lineHeight: "1.8" }}>{children}</li>,
    strong: ({ children }: any) => <strong className="font-semibold" style={{ color: "#1a1a1a" }}>{children}</strong>,
    em: ({ children }: any) => <em className="italic" style={{ color: "#856404" }}>{children}</em>,
    blockquote: ({ children }: any) => (
      <blockquote className="my-10 py-6 px-8 italic rounded-lg" style={{ borderRight: "4px solid #856404", backgroundColor: "#FAFAFA", color: "#555" }}>{children}</blockquote>
    ),
    a: ({ href, children }: any) => {
      const isInternal = href?.startsWith("/") || href?.includes("diamony");
      return (
        <a href={href} className="underline underline-offset-4 transition-colors hover:opacity-80" style={{ color: "#856404" }} {...(!isInternal && { target: "_blank", rel: "noopener noreferrer" })}>{children}</a>
      );
    },
    img: ({ src, alt }: any) => (
      <motion.figure
        className={`my-10 ${enableFloatingFrames ? "floating-image" : ""}`}
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <img src={src} alt={alt || ""} className={`w-full ${imageClasses}`} loading="lazy" />
        {alt && <figcaption className="text-center text-sm mt-3 italic" style={{ color: "#666" }}>{alt}</figcaption>}
      </motion.figure>
    ),
    hr: () => <hr className="my-12 border-t" style={{ borderColor: "#856404", opacity: 0.3 }} />,
  };

  return (
    <>
      <ReactMarkdown components={mdComponents}>{beforeBanner}</ReactMarkdown>
      {afterBanner && (
        <>
          <Blog4CsBanner />
          <ReactMarkdown components={mdComponents}>{afterBanner}</ReactMarkdown>
        </>
      )}
    </>
  );
};

export default BlogArticleTemplate;
