import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "react-intersection-observer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GOLD = "#D4AF37";

/* ── Custom Gold-Outline SVG Icons ─────────────────────────────────────────── */

const CutIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <polygon points="20,4 36,16 30,36 10,36 4,16" stroke={GOLD} strokeWidth="1.5" fill="none" />
    <line x1="20" y1="4" x2="10" y2="36" stroke={GOLD} strokeWidth="1" opacity="0.5" />
    <line x1="20" y1="4" x2="30" y2="36" stroke={GOLD} strokeWidth="1" opacity="0.5" />
    <line x1="4" y1="16" x2="36" y2="16" stroke={GOLD} strokeWidth="1" opacity="0.5" />
    <line x1="10" y1="36" x2="36" y2="16" stroke={GOLD} strokeWidth="0.8" opacity="0.3" />
    <line x1="30" y1="36" x2="4" y2="16" stroke={GOLD} strokeWidth="0.8" opacity="0.3" />
  </svg>
);

const ColorIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <polygon points="20,2 38,20 20,38 2,20" stroke={GOLD} strokeWidth="1.5" fill="none" />
    <defs>
      <linearGradient id="colorGradDE" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={GOLD} stopOpacity="0.1" />
        <stop offset="50%" stopColor={GOLD} stopOpacity="0.3" />
        <stop offset="100%" stopColor={GOLD} stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <polygon points="20,8 32,20 20,32 8,20" fill="url(#colorGradDE)" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
    <line x1="14" y1="14" x2="26" y2="26" stroke={GOLD} strokeWidth="0.6" opacity="0.4" />
    <line x1="26" y1="14" x2="14" y2="26" stroke={GOLD} strokeWidth="0.6" opacity="0.4" />
  </svg>
);

const ClarityIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="18" cy="18" r="10" stroke={GOLD} strokeWidth="1.5" fill="none" />
    <line x1="25" y1="25" x2="36" y2="36" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
    <polygon points="18,12 22,18 18,22 14,18" stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.6" />
  </svg>
);

const CaratIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
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

/* ── Tooltip Explanations ──────────────────────────────────────────────────── */

const CUT_EXPLANATIONS: Record<string, string> = {
  Excellent: "חיתוך מושלם – מבטיח החזר אור מקסימלי וברק עוצמתי ביותר.",
  "Very Good": "חיתוך איכותי מאוד – החזר אור גבוה עם ברק מרשים.",
  Good: "חיתוך טוב – ברק נעים עם יחס מחיר-ערך מצוין.",
  Ideal: "חיתוך אידיאלי – פרופורציות מדויקות להחזר אור מרבי.",
};

const COLOR_EXPLANATIONS: Record<string, string> = {
  D: "חסר צבע לחלוטין – הדרגה הנדירה והיקרה ביותר.",
  E: "חסר צבע – שקיפות יוצאת דופן, הבדל זניח מדרגת D.",
  F: "חסר צבע – שקיפות גבוהה מאוד, נראה זהה לעין.",
  G: "כמעט חסר צבע – ערך מצוין עם מראה לבן ונקי.",
  H: "כמעט חסר צבע – גוון חם קל, מושלם לשיבוץ בזהב.",
  I: "צביעה קלה – ערך מעולה, נראה נהדר בשיבוץ.",
  J: "גוון חם עדין – יפה במיוחד בזהב צהוב או רוז.",
};

const CLARITY_EXPLANATIONS: Record<string, string> = {
  FL: "ללא פגמים (Flawless) – דרגת ניקיון מושלמת ונדירה ביותר.",
  IF: "נקי פנימית (Internally Flawless) – ללא תכלילים פנימיים.",
  VVS1: "תכלילים זעירים מאוד – בלתי נראים גם תחת הגדלה של ×10.",
  VVS2: "תכלילים זעירים מאוד – קשים לזיהוי תחת הגדלה.",
  VS1: "תכלילים קטנים – נראים רק תחת הגדלה משמעותית.",
  VS2: "תכלילים קטנים – בלתי נראים לעין בלתי מזוינת.",
  SI1: "תכלילים קלים – ערך מצוין, לרוב בלתי נראים לעין.",
  SI2: "תכלילים קלים – עלולים להיראות לעין מקרוב.",
};

const LABS = ["GIA", "IGI", "HRD", "SGL", "CGL"] as const;

interface DiamondExcellenceProps {
  productId: string;
}

const DiamondExcellence = ({ productId }: DiamondExcellenceProps) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });
  const [certModalOpen, setCertModalOpen] = useState(false);

  // Pick a random lab per mount
  const randomLab = useMemo(() => LABS[Math.floor(Math.random() * LABS.length)], []);

  const { data: specs } = useQuery({
    queryKey: ["product-aeo-specs-diamond", productId],
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

  // Fetch certificate image for the displayed lab
  const displayLab = specs?.certification_body || randomLab;

  const { data: certImage } = useQuery({
    queryKey: ["certificate-image", displayLab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_images")
        .select("image_url")
        .eq("lab_name", displayLab)
        .maybeSingle();
      if (error) throw error;
      return data?.image_url || null;
    },
  });

  if (!specs) return null;
  const hasDiamondData = specs.diamond_cut || specs.diamond_color || specs.diamond_clarity || specs.total_carat_weight;
  if (!hasDiamondData) return null;

  const fourCs = [
    {
      key: "cut",
      label: "חיתוך",
      labelEn: "Cut",
      description: "מדד לאיכות החיתוך, הפרופורציות והסימטריה של היהלום",
      value: specs.diamond_cut,
      icon: <CutIcon />,
      tooltip: specs.diamond_cut ? (CUT_EXPLANATIONS[specs.diamond_cut] || `דרגת חיתוך: ${specs.diamond_cut}`) : null,
    },
    {
      key: "color",
      label: "צבע",
      labelEn: "Color",
      description: "מדד לדרגת חוסר הצבע ביהלום, מ-D (חסר צבע) עד Z",
      value: specs.diamond_color,
      icon: <ColorIcon />,
      tooltip: specs.diamond_color ? (COLOR_EXPLANATIONS[specs.diamond_color] || `דרגת צבע: ${specs.diamond_color}`) : null,
    },
    {
      key: "clarity",
      label: "ניקיון",
      labelEn: "Clarity",
      description: "מדד לניקיון הפנימי והחיצוני של היהלום",
      value: specs.diamond_clarity,
      icon: <ClarityIcon />,
      tooltip: specs.diamond_clarity ? (CLARITY_EXPLANATIONS[specs.diamond_clarity] || `דרגת ניקיון: ${specs.diamond_clarity}`) : null,
    },
    {
      key: "carat",
      label: "קראט",
      labelEn: "Carat",
      description: "יחידת המשקל הסטנדרטית ליהלומים – 1 קראט = 0.2 גרם",
      value: specs.total_carat_weight ? `${specs.total_carat_weight} ct` : null,
      icon: <CaratIcon />,
      tooltip: specs.total_carat_weight ? `משקל כולל של ${specs.total_carat_weight} קראט – יחידת המשקל הסטנדרטית ליהלומים.` : null,
    },
  ].filter(c => c.value);

  if (fourCs.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <section
        ref={ref}
        aria-labelledby="diamond-excellence-heading"
        className={`mt-10 mb-8 transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        {/* Section Header */}
        <div className="text-center mb-8">
          <p
            className="text-[11px] uppercase tracking-[0.25em] mb-2 font-body font-medium"
            style={{ color: GOLD }}
          >
            Diamond Excellence
          </p>
          <h2
            id="diamond-excellence-heading"
            className="font-heading text-2xl md:text-3xl font-normal text-foreground"
          >
            תעודת היהלום
          </h2>
        </div>

        {/* 4Cs Grid – always 2x2 on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fourCs.map((c, i) => (
            <Tooltip key={c.key}>
              <TooltipTrigger asChild>
                <button
                  className="group relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-background p-5 md:p-6 text-center transition-all duration-300 hover:border-accent/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  style={{ animationDelay: `${i * 100}ms` }}
                  aria-label={`${c.label}: ${c.value}`}
                  type="button"
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-full border border-border/60 bg-secondary/30 transition-colors duration-300 group-hover:bg-accent/5 group-hover:border-accent/30">
                    {c.icon}
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-body">
                      {c.labelEn}
                    </span>
                    <span className="block font-heading text-sm font-normal text-foreground mt-0.5">
                      {c.label}
                    </span>
                  </div>
                  <span className="text-xl font-heading font-semibold tracking-wide" style={{ color: GOLD }}>
                    {c.value}
                  </span>
                </button>
              </TooltipTrigger>

              {c.tooltip && (
                <TooltipContent
                  side="bottom"
                  className="max-w-[280px] text-center text-[13px] leading-relaxed font-body p-4 rounded-xl border border-border shadow-xl z-50"
                  style={{
                    background: "rgba(253, 251, 247, 0.92)",
                    backdropFilter: "blur(16px) saturate(1.4)",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  <p className="font-semibold mb-1" style={{ color: GOLD }}>{c.value}</p>
                  <p className="text-muted-foreground text-xs mb-1.5">{c.description}</p>
                  <p className="text-foreground">{c.tooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>

        {/* Certification Badge – random lab */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-border bg-secondary/20">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8.5" stroke={GOLD} strokeWidth="1.2" />
              <path d="M6.5 10l2.5 2.5 5-5" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="font-body text-sm text-foreground font-medium tracking-wide">
              {displayLab}
            </span>
          </div>
          <button
            onClick={() => setCertModalOpen(true)}
            className="text-[13px] font-body text-muted-foreground hover:text-accent transition-colors border-b border-dashed border-muted-foreground/40 hover:border-accent pb-0.5 bg-transparent cursor-pointer"
            type="button"
          >
            צפייה בתעודה לדוגמה
          </button>
        </div>

        {/* Certificate Modal */}
        <Dialog open={certModalOpen} onOpenChange={setCertModalOpen}>
          <DialogContent
            className="max-w-lg rounded-3xl p-0 overflow-hidden border-none"
            style={{ background: "#FDFBF7" }}
          >
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="font-heading text-xl text-center text-foreground">
                תעודה גמולוגית – {displayLab}
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6">
              {certImage ? (
                <img
                  src={certImage}
                  alt={`תעודה גמולוגית ${displayLab}`}
                  className="w-full rounded-xl shadow-md"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="20" stroke={GOLD} strokeWidth="1.5" fill="none" />
                    <path d="M16 24l5 5 11-11" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <p className="font-heading text-lg text-foreground">
                    {displayLab} Certified
                  </p>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    כל תכשיטי היהלומים שלנו מלווים בתעודה גמולוגית מוסמכת המעידה על איכות היהלום.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </TooltipProvider>
  );
};

export default DiamondExcellence;
