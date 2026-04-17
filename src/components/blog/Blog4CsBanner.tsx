import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInteractivePopover } from "@/hooks/useInteractivePopover";

const FOUR_CS = [
  {
    key: "cut",
    label: "חיתוך",
    labelEn: "Cut",
    summary: "איכות החיתוך קובעת את רמת הברק והניצנוץ של היהלום. חיתוך מדויק מאפשר החזרת אור מקסימלית.",
    linkKey: "4cs-cut-link",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#D4AF37" strokeWidth="1.5">
        <polygon points="20,4 36,16 30,36 10,36 4,16" />
        <line x1="20" y1="4" x2="10" y2="36" />
        <line x1="20" y1="4" x2="30" y2="36" />
        <line x1="4" y1="16" x2="36" y2="16" />
      </svg>
    ),
  },
  {
    key: "color",
    label: "צבע",
    labelEn: "Color",
    summary: "דירוג הצבע נע בין D (שקוף לחלוטין) ל-Z. יהלומים חסרי צבע נחשבים נדירים ויקרים יותר.",
    linkKey: "4cs-color-link",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#D4AF37" strokeWidth="1.5">
        <polygon points="20,2 38,30 2,30" />
        <line x1="20" y1="2" x2="20" y2="30" />
        <line x1="11" y1="16" x2="29" y2="16" />
      </svg>
    ),
  },
  {
    key: "clarity",
    label: "ניקיון",
    labelEn: "Clarity",
    summary: "מדד לניקיון הפנימי והחיצוני של היהלום. דרגות כמו VVS1 מעידות על ניקיון גבוה ביותר.",
    linkKey: "4cs-clarity-link",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#D4AF37" strokeWidth="1.5">
        <circle cx="18" cy="18" r="10" />
        <line x1="25" y1="25" x2="36" y2="36" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="18,12 22,18 18,24 14,18" />
      </svg>
    ),
  },
  {
    key: "carat",
    label: "קראט",
    labelEn: "Carat",
    summary: "יחידת המידה למשקל היהלום. קראט אחד שווה 0.2 גרם. גודל היהלום תלוי גם באיכות החיתוך. (CT)",
    linkKey: "4cs-carat-link",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#D4AF37" strokeWidth="1.5">
        <ellipse cx="20" cy="20" rx="16" ry="8" />
        <polygon points="20,12 28,20 20,28 12,20" />
      </svg>
    ),
  },
];

export const Blog4CsBanner = () => {
  const isMobile = useIsMobile();
  const [flipUp, setFlipUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { openKey, setOpenKey, clearCloseTimer, scheduleClose, handleInteraction } = useInteractivePopover(isMobile);

  const { data: linksData } = useQuery({
    queryKey: ["4cs-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("key, content")
        .in("key", FOUR_CS.map((c) => c.linkKey));
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((r) => (map[r.key] = r.content || "/blog"));
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  useLayoutEffect(() => {
    if (!openKey || !popoverRef.current || !triggerRef.current) {
      setFlipUp(false);
      return;
    }
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = popoverRef.current.scrollHeight + 8;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    setFlipUp(spaceBelow < popoverHeight);
  }, [openKey]);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="my-10 rounded-xl border border-border/30 p-6"
      style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 100%)" }}
    >
      <p className="text-xs font-semibold tracking-widest uppercase text-center mb-4" style={{ color: "#856404" }}>
        מדריך 4C&apos;s ליהלומים
      </p>
      <div ref={containerRef} className="grid grid-cols-4 gap-4">
        {FOUR_CS.map((c) => {
          const isOpen = openKey === c.key;
          const linkUrl = linksData?.[c.linkKey] || "/blog";

          return (
            <div
              key={c.key}
              className="relative flex flex-col items-center gap-1.5"
              onBlur={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                handleInteraction(c.key, "blur");
              }}
            >
              <button
                type="button"
                ref={isOpen ? triggerRef : undefined}
                className="group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                onMouseEnter={() => handleInteraction(c.key, "enter")}
                onMouseLeave={() => handleInteraction(c.key, "leave")}
                onFocus={() => handleInteraction(c.key, "focus")}
                onClick={() => handleInteraction(c.key, "click")}
              >
                {c.icon}
                <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
                  {c.labelEn}
                </span>
              </button>

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
                     <p className="text-xs font-serif font-bold text-[#C9A96E]">{c.label}</p>
                     <p className="w-full text-center text-[10px] leading-snug text-muted-foreground">{c.summary}</p>
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
    </motion.div>
  );
};

export default Blog4CsBanner;
