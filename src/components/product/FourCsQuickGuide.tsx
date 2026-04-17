import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInView } from "react-intersection-observer";
import { Diamond } from "lucide-react";
import { useInteractivePopover } from "@/hooks/useInteractivePopover";

const CUT_ICON = (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
    <polygon points="24,4 44,18 38,44 10,44 4,18" stroke="#C9A96E" strokeWidth="1.5" fill="none" />
    <line x1="24" y1="4" x2="24" y2="44" stroke="#C9A96E" strokeWidth="1" opacity="0.5" />
    <line x1="4" y1="18" x2="44" y2="18" stroke="#C9A96E" strokeWidth="1" opacity="0.5" />
    <line x1="24" y1="4" x2="10" y2="44" stroke="#C9A96E" strokeWidth="0.8" opacity="0.4" />
    <line x1="24" y1="4" x2="38" y2="44" stroke="#C9A96E" strokeWidth="0.8" opacity="0.4" />
  </svg>
);

const COLOR_ICON = (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
    <circle cx="24" cy="24" r="18" stroke="#C9A96E" strokeWidth="1.5" fill="none" />
    <circle cx="24" cy="24" r="12" stroke="#C9A96E" strokeWidth="1" opacity="0.5" fill="none" />
    <circle cx="24" cy="24" r="6" stroke="#C9A96E" strokeWidth="0.8" opacity="0.4" fill="none" />
    <circle cx="24" cy="24" r="2" fill="#C9A96E" opacity="0.6" />
  </svg>
);

const CLARITY_ICON = (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
    <circle cx="24" cy="24" r="18" stroke="#C9A96E" strokeWidth="1.5" fill="none" />
    <path d="M24 6 L24 10 M24 38 L24 42 M6 24 L10 24 M38 24 L42 24" stroke="#C9A96E" strokeWidth="1.2" />
    <circle cx="24" cy="24" r="5" stroke="#C9A96E" strokeWidth="1" fill="none" />
    <line x1="20" y1="20" x2="28" y2="28" stroke="#C9A96E" strokeWidth="0.8" opacity="0.5" />
    <line x1="28" y1="20" x2="20" y2="28" stroke="#C9A96E" strokeWidth="0.8" opacity="0.5" />
  </svg>
);

const CARAT_ICON = (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
    <rect x="12" y="20" width="24" height="16" rx="2" stroke="#C9A96E" strokeWidth="1.5" fill="none" />
    <line x1="12" y1="28" x2="36" y2="28" stroke="#C9A96E" strokeWidth="1" opacity="0.5" />
    <circle cx="24" cy="14" r="4" stroke="#C9A96E" strokeWidth="1.2" fill="none" />
    <line x1="24" y1="18" x2="24" y2="20" stroke="#C9A96E" strokeWidth="1" />
  </svg>
);

const FOUR_CS_DATA = [
  {
    key: "cut",
    label: "חיתוך",
    labelEn: "Cut",
    icon: CUT_ICON,
    summary: "איכות החיתוך קובעת את רמת הברק והניצנוץ של היהלום. חיתוך מדויק מאפשר החזרת אור מקסימלית.",
    linkKey: "4cs-cut-link",
  },
  {
    key: "color",
    label: "צבע",
    labelEn: "Color",
    icon: COLOR_ICON,
    summary: "דירוג הצבע נע בין D (שקוף לחלוטין) ל-Z. יהלומים חסרי צבע נחשבים נדירים ויקרים יותר.",
    linkKey: "4cs-color-link",
  },
  {
    key: "clarity",
    label: "ניקיון",
    labelEn: "Clarity",
    icon: CLARITY_ICON,
    summary: "מדד לניקיון הפנימי והחיצוני של היהלום. דרגות כמו VVS1 מעידות על ניקיון גבוה ביותר.",
    linkKey: "4cs-clarity-link",
  },
  {
    key: "carat",
    label: "קראט",
    labelEn: "Carat",
    icon: CARAT_ICON,
    summary: "יחידת המידה למשקל היהלום. קראט אחד שווה 0.2 גרם. גודל היהלום תלוי גם באיכות החיתוך. (CT)",
    linkKey: "4cs-carat-link",
  },
];

const FourCsQuickGuide = () => {
  const isMobile = useIsMobile();
  const [flipUp, setFlipUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const { openKey, setOpenKey, clearCloseTimer, scheduleClose, handleInteraction } = useInteractivePopover(isMobile);

  const { data: linksData } = useQuery({
    queryKey: ["4cs-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("key, content")
        .in("key", FOUR_CS_DATA.map((c) => c.linkKey));
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((r) => (map[r.key] = r.content || "/blog"));
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Collision detection: flip popover upward if it would overflow viewport
  useLayoutEffect(() => {
    if (!openKey || !popoverRef.current || !triggerRef.current) {
      setFlipUp(false);
      return;
    }
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = popoverRef.current.scrollHeight + 8; // 8px margin
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    setFlipUp(spaceBelow < popoverHeight);
  }, [openKey]);

  // Outside-click dismiss for mobile
  useEffect(() => {
    if (!isMobile || !openKey) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile, openKey]);

  return (
    <div ref={inViewRef}>
      <div ref={containerRef} className="mt-6 lg:mt-8">
        <div className="flex items-center gap-2 mb-4 justify-center">
          <Diamond className="h-4 w-4 text-[#C9A96E]" />
          <h3 className="text-sm font-serif font-semibold text-foreground tracking-wide">
            מדריך 4C&apos;s מהיר
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {FOUR_CS_DATA.map((item, index) => {
            const isOpen = openKey === item.key;
            const linkUrl = linksData?.[item.linkKey] || "/blog";

            return (
              <div
                key={item.key}
                className="relative"
                onBlur={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                  handleInteraction(item.key, "blur");
                }}
              >
                {/* Card */}
                <button
                  type="button"
                  ref={isOpen ? triggerRef : undefined}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  } ${
                    isOpen
                      ? "border-[#C9A96E]/40 bg-[#F5F0E6]/60 shadow-sm"
                      : "border-border/40 bg-[#F5F0E6]/30 hover:border-[#C9A96E]/30 hover:bg-[#F5F0E6]/50"
                  }`}
                  style={{ transitionDelay: inView ? `${index * 120}ms` : "0ms" }}
                  aria-expanded={isOpen}
                  aria-haspopup="dialog"
                  onMouseEnter={() => handleInteraction(item.key, "enter")}
                  onMouseLeave={() => handleInteraction(item.key, "leave")}
                  onFocus={() => handleInteraction(item.key, "focus")}
                  onClick={() => handleInteraction(item.key, "click")}
                >
                  {item.icon}
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.labelEn}</span>
                </button>

                {/* Popover with collision-aware positioning */}
                {isOpen && (
                  <div
                    className={`absolute left-1/2 z-50 -translate-x-1/2 ${flipUp ? "bottom-full pb-2" : "top-full pt-2"}`}
                    onMouseEnter={clearCloseTimer}
                    onMouseLeave={scheduleClose}
                  >
                    <div
                      ref={popoverRef}
                      dir="rtl"
                      className="relative flex w-[260px] flex-col items-center gap-1.5 whitespace-normal break-words rounded-2xl border border-[#C9A96E]/30 bg-[#F9F7F2]/95 px-4 py-3 text-center shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-md animate-fade-in"
                    >
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#F9F7F2]/95 ${
                          flipUp
                            ? "-bottom-1.5 border-r border-b border-[#C9A96E]/30"
                            : "-top-1.5 border-l border-t border-[#C9A96E]/30"
                        }`}
                      />
                      <p className="text-xs font-serif font-bold text-[#C9A96E]">{item.label}</p>
                      <p className="w-full text-center text-[10px] leading-snug text-muted-foreground">{item.summary}</p>
                      <Link
                        to={linkUrl}
                        className="text-[10px] font-medium text-[#C9A96E] transition-opacity hover:opacity-70"
                        onClick={(e) => e.stopPropagation()}
                      >
                        למדו עוד ←
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FourCsQuickGuide;
