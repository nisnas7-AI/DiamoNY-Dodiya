import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

const GOLD = "#D4AF37";

/* ── 4Cs Icons ── */
const CutIcon = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <polygon points="20,4 36,16 30,36 10,36 4,16" stroke={GOLD} strokeWidth="1.5" fill="none" />
    <line x1="20" y1="4" x2="10" y2="36" stroke={GOLD} strokeWidth="1" opacity="0.5" />
    <line x1="20" y1="4" x2="30" y2="36" stroke={GOLD} strokeWidth="1" opacity="0.5" />
    <line x1="4" y1="16" x2="36" y2="16" stroke={GOLD} strokeWidth="1" opacity="0.5" />
    <line x1="10" y1="36" x2="36" y2="16" stroke={GOLD} strokeWidth="0.8" opacity="0.3" />
    <line x1="30" y1="36" x2="4" y2="16" stroke={GOLD} strokeWidth="0.8" opacity="0.3" />
  </svg>
);

const ColorIcon = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <polygon points="20,2 38,20 20,38 2,20" stroke={GOLD} strokeWidth="1.5" fill="none" />
    <defs>
      <linearGradient id="sidebarColorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={GOLD} stopOpacity="0.1" />
        <stop offset="50%" stopColor={GOLD} stopOpacity="0.3" />
        <stop offset="100%" stopColor={GOLD} stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <polygon points="20,8 32,20 20,32 8,20" fill="url(#sidebarColorGrad)" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
    <line x1="14" y1="14" x2="26" y2="26" stroke={GOLD} strokeWidth="0.6" opacity="0.4" />
    <line x1="26" y1="14" x2="14" y2="26" stroke={GOLD} strokeWidth="0.6" opacity="0.4" />
  </svg>
);

const ClarityIcon = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <circle cx="18" cy="18" r="10" stroke={GOLD} strokeWidth="1.5" fill="none" />
    <line x1="25" y1="25" x2="36" y2="36" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
    <polygon points="18,12 22,18 18,22 14,18" stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.6" />
  </svg>
);

const CaratIcon = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <polygon points="20,6 34,18 28,34 12,34 6,18" stroke={GOLD} strokeWidth="1.5" fill="none" />
    <polygon points="20,6 26,18 20,14 14,18" stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.5" />
    <line x1="6" y1="18" x2="34" y2="18" stroke={GOLD} strokeWidth="1" opacity="0.4" />
    <line x1="14" y1="18" x2="12" y2="34" stroke={GOLD} strokeWidth="0.6" opacity="0.3" />
    <line x1="26" y1="18" x2="28" y2="34" stroke={GOLD} strokeWidth="0.6" opacity="0.3" />
    <line x1="8" y1="38" x2="32" y2="38" stroke={GOLD} strokeWidth="1" opacity="0.4" />
    <line x1="12" y1="36" x2="12" y2="38" stroke={GOLD} strokeWidth="0.8" opacity="0.4" />
    <line x1="20" y1="36" x2="20" y2="38" stroke={GOLD} strokeWidth="0.8" opacity="0.4" />
    <line x1="28" y1="36" x2="28" y2="38" stroke={GOLD} strokeWidth="0.8" opacity="0.4" />
  </svg>
);

const FOUR_CS_DATA = [
  { key: "4cs-cut-link", label: "Cut", icon: <CutIcon />, title: "חיתוך", text: "איכות החיתוך קובעת את רמת הברק והניצנוץ של היהלום. חיתוך מדויק מאפשר החזרת אור מקסימלית." },
  { key: "4cs-color-link", label: "Color", icon: <ColorIcon />, title: "צבע", text: "דירוג הצבע נע בין D (שקוף לחלוטין) ל-Z. יהלומים חסרי צבע נחשבים נדירים ויקרים יותר." },
  { key: "4cs-clarity-link", label: "Clarity", icon: <ClarityIcon />, title: "ניקיון", text: "מדד לניקיון הפנימי והחיצוני של היהלום. דרגות כמו VVS1 מעידות על ניקיון גבוה ביותר." },
  { key: "4cs-carat-link", label: "Carat", icon: <CaratIcon />, title: "קראט", text: "יחידת המידה למשקל היהלום. קראט אחד שווה 0.2 גרם. גודל היהלום תלוי גם באיכות החיתוך. (CT)" },
];

/* ── Monthly random seed ── */
const getMonthSeed = () => {
  const d = new Date();
  return d.getFullYear() * 100 + d.getMonth();
};

/* ── Hybrid Tooltip/Popover for a single 4C card ── */
const FourCCard = ({
  c,
  linkUrl,
  isMobile,
}: {
  c: (typeof FOUR_CS_DATA)[number];
  linkUrl: string;
  isMobile: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Outside-click dismiss for mobile
  useEffect(() => {
    if (!open || !isMobile) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open, isMobile]);

  return (
    <div
      ref={ref}
      className="relative text-center p-3 rounded-lg border border-transparent cursor-pointer transition-all duration-200 hover:border-[#D4AF37]/40 hover:shadow-sm"
      style={{ background: "linear-gradient(135deg, #F5F0E6 0%, #FDFBF7 100%)" }}
      onMouseEnter={() => !isMobile && setOpen(true)}
      onMouseLeave={() => !isMobile && setOpen(false)}
      onClick={() => isMobile && setOpen((p) => !p)}
    >
      <div className="flex justify-center mb-1">{c.icon}</div>
      <span className="text-xs font-medium text-foreground">{c.label}</span>

      {/* Floating popover */}
      {open && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3.5 rounded-xl border shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            background: "#F9F7F2",
            borderColor: "rgba(212, 175, 55, 0.25)",
            boxShadow: "0 8px 30px -8px rgba(201, 169, 110, 0.25)",
          }}
        >
          <p className="text-xs font-semibold font-body mb-1" style={{ color: "#856404" }}>
            {c.title}
          </p>
          <p className="text-xs font-body leading-relaxed text-foreground/80 mb-2">
            {c.text}
          </p>
          {linkUrl && linkUrl !== "/blog" && (
            <Link
              to={linkUrl}
              className="inline-block text-[10px] font-semibold tracking-wide uppercase transition-colors hover:opacity-80"
              style={{ color: "#C9A96E" }}
              onClick={(e) => e.stopPropagation()}
            >
              למדו עוד ←
            </Link>
          )}
          {/* Caret */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #F9F7F2",
            }}
          />
        </div>
      )}
    </div>
  );
};

export const BlogStickySidebar = () => {
  const whatsappUrl =
    "https://wa.me/972546290534?text=%D7%94%D7%99%D7%99%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A9%D7%95%D7%97%D7%97%20%D7%A2%D7%9D%20%D7%9E%D7%95%D7%9E%D7%97%D7%94";

  const isMobile = useIsMobile();

  const [featuredProduct, setFeaturedProduct] = useState<{
    name: string;
    image: string;
    slug: string;
  } | null>(null);

  // Fetch 4C's links from site_content
  const { data: linksData } = useQuery({
    queryKey: ["4cs-links"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("key, content")
        .in("key", FOUR_CS_DATA.map((c) => c.key));
      const map: Record<string, string> = {};
      data?.forEach((r) => (map[r.key] = r.content || "/blog"));
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const fetchRandom = async () => {
      const { data } = await supabase
        .from("products")
        .select("name, main_image_url, slug")
        .eq("is_active", true)
        .not("main_image_url", "is", null);

      if (data && data.length > 0) {
        const seed = getMonthSeed();
        const idx = seed % data.length;
        const p = data[idx];
        setFeaturedProduct({ name: p.name, image: p.main_image_url!, slug: p.slug });
      }
    };
    fetchRandom();
  }, []);

  const links = linksData || {};

  return (
    <aside className="hidden lg:block w-[260px] shrink-0">
      <div className="sticky top-28 space-y-6">
        {/* Featured Piece */}
        <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: "#FDFBF7" }}>
          <Link
            to={featuredProduct ? `/product/${featuredProduct.slug}` : "/catalog?is_featured=true"}
            className="block"
          >
            <div
              className="aspect-square flex items-center justify-center overflow-hidden"
              style={{ background: "linear-gradient(135deg, #F5F0E6 0%, #FDFBF7 100%)" }}
            >
              {featuredProduct?.image ? (
                <img
                  src={featuredProduct.image}
                  alt={featuredProduct.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={300}
                  height={300}
                />
              ) : (
                <svg width="64" height="64" viewBox="0 0 40 40" fill="none">
                  <polygon points="20,4 36,16 30,36 10,36 4,16" stroke={GOLD} strokeWidth="1.5" fill="none" opacity="0.6" />
                </svg>
              )}
            </div>
            <div className="p-4 text-center">
              <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#856404" }}>
                Featured Piece
              </p>
              <p className="text-sm font-body text-muted-foreground">תכשיט הנבחר החודש</p>
            </div>
          </Link>
        </div>

        {/* WhatsApp Chat */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border/30 p-4 transition-all hover:shadow-md"
          style={{ background: "#FDFBF7" }}
        >
          <div className="p-2 rounded-lg" style={{ background: "linear-gradient(135deg, #D4AF37, #C5A059)" }}>
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">שוחח עם מומחה</p>
            <p className="text-xs text-muted-foreground">WhatsApp Chat</p>
          </div>
        </a>

        {/* 4Cs Quick Guide */}
        <div className="rounded-xl border border-border/30 p-5" style={{ background: "#FDFBF7" }}>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4 text-center"
            style={{ color: "#856404" }}
          >
            מדריך 4C&apos;s מהיר
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FOUR_CS_DATA.map((c) => (
              <FourCCard
                key={c.label}
                c={c}
                linkUrl={links[c.key] || "/blog"}
                isMobile={isMobile}
              />
            ))}
          </div>
          <Link
            to="/catalog?category=diamonds"
            className="block mt-4 text-center text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "#856404" }}
          >
            צפה בקולקציה המלאה ←
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default BlogStickySidebar;
