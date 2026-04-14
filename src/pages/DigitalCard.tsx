import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useBrandSettings } from "@/contexts/BrandSettingsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { SITE_URL } from "@/lib/siteConfig";
import { Download } from "lucide-react";
import DigitalCardCatalogModal from "@/components/digital-card/CatalogModal";
import A2HSPrompt from "@/components/digital-card/A2HSPrompt";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const CARD_URL = `${SITE_URL}/digital-card`;
const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_URL
  || (import.meta.env.VITE_SUPABASE_PROJECT_ID
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
    : "");
const BG_IMAGE = `${SUPABASE_BASE_URL}/storage/v1/object/public/vip-assets/digital-card-hero.jpg.png`;

/* ═══════════════════════════════════════════════════════════════════════════
   DigitalCard — background-image overlay approach
   ═══════════════════════════════════════════════════════════════════════════ */
const DigitalCard = () => {
  const brand = useBrandSettings();
  const [showAbout, setShowAbout] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  /* ── Fetch digital card settings from DB ─── */
  const { data: cardSettings } = useQuery({
    queryKey: ["digital-card-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("digital_card_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  /* ── Derived links ─── */
  const phone = cardSettings?.phone || brand.whatsapp_number;
  const whatsapp = cardSettings?.whatsapp || brand.whatsapp_number;
  const email = cardSettings?.email || brand.support_email;
  const waLink = `https://wa.me/${whatsapp}`;
  const phoneLink = `tel:+${phone}`;
  const mailLink = `mailto:${email}`;
  const igLink = cardSettings?.instagram_url || "https://instagram.com";
  const fbLink = cardSettings?.facebook_url || "https://facebook.com";
  const aboutText = cardSettings?.about_text || "";
  const avatarUrl = cardSettings?.avatar_url || null;

  const theme = useMemo(() => ({
    primary: cardSettings?.primary_color || "#0A3B2C",
    accent: cardSettings?.accent_color || "#D4AF37",
    text: cardSettings?.text_color || "#0A3B2C",
    bg: cardSettings?.bg_color || "#FFFFFF",
    font: cardSettings?.font_family || "Assistant",
    avatarUrl,
    logoUrl: cardSettings?.logo_url || null,
  }), [cardSettings, avatarUrl]);

  const displayLogo = theme.logoUrl || brand.logo_url;

  const cssVars = {
    "--dc-primary": theme.primary,
    "--dc-accent": theme.accent,
    "--dc-text": theme.text,
    "--dc-bg": theme.bg,
  } as React.CSSProperties;

  return (
    <>
      <Helmet>
        <title>כרטיס ביקור דיגיטלי | {brand.brand_name}</title>
        <meta name="description" content={`כרטיס ביקור דיגיטלי של ניצן יעקובי – ${brand.brand_name}`} />
        <link rel="canonical" href={CARD_URL} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div
        className="min-h-screen flex items-center justify-center"
        dir="rtl"
        style={{ ...cssVars, fontFamily: "'Assistant', sans-serif", backgroundColor: "#0A3B2C" }}
      >
        {/* ═══ DESKTOP FALLBACK — QR redirect ═══ */}
        <div className="hidden md:flex flex-col items-center justify-center text-center p-10 bg-white shadow-2xl rounded-2xl max-w-lg mx-4">
          <img src={displayLogo} alt={`${brand.brand_name} logo`} className="h-14 object-contain mb-8" loading="eager" width={180} height={56} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0A3B2C" }}>
            חוויית הבוטיק שלנו מותאמת לנייד
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm">
            לכניסה לכרטיס הביקור הדיגיטלי, אנא סרקו את הקוד או פתחו את הקישור במכשיר הנייד שלכם.
          </p>
          <div className="p-4 bg-white rounded-xl border border-border">
            <QRCodeSVG value={CARD_URL} size={180} level="M" />
          </div>
          <p className="text-xs text-muted-foreground mt-4 font-mono" dir="ltr">{CARD_URL}</p>
        </div>

        {/* ═══ MOBILE CARD — Background image with overlay buttons ═══ */}
        <div className="w-full md:hidden relative" style={{ maxWidth: 430 }}>
          {/* Background image — the entire card design */}
          <img
            src={BG_IMAGE}
            alt="כרטיס ביקור דיגיטלי"
            className="w-full h-auto block"
            loading="eager"
            draggable={false}
          />

          {/* ── Dynamic Avatar overlay on the white circle ── */}
          <div
            className="absolute left-1/2 z-20 aspect-square -translate-x-1/2 overflow-hidden rounded-full border-2"
            style={{
              top: "19%",
              width: "36%",
              backgroundColor: theme.primary,
              borderColor: theme.accent,
            }}
          >
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="ניצן יעקובי"
                className="block h-full w-full rounded-full object-cover object-center"
                loading="eager"
              />
            )}
          </div>

          {/* ── Transparent clickable overlays ── */}
          {/* Row 1: אינסטגרם | קטלוג | פייסבוק */}
          <OverlayButton href={igLink} style={{ top: "55%", right: "8%", width: "26%", height: "8.5%" }} label="אינסטגרם" />
          <OverlayButton onClick={() => setShowCatalog(true)} style={{ top: "55%", left: "37%", width: "26%", height: "8.5%" }} label="קטלוג" />
          <OverlayButton href={fbLink} style={{ top: "55%", left: "8%", width: "26%", height: "8.5%" }} label="פייסבוק" />

          {/* Row 2: נייד | מייל | וואטסאפ */}
          <OverlayButton href={phoneLink} style={{ top: "65%", right: "8%", width: "26%", height: "8.5%" }} label="נייד" />
          <OverlayButton href={mailLink} style={{ top: "65%", left: "37%", width: "26%", height: "8.5%" }} label="מייל" />
          <OverlayButton href={waLink} style={{ top: "65%", left: "8%", width: "26%", height: "8.5%" }} label="וואטסאפ" />

          {/* CTA: לביקור באתר הרשמי */}
          <OverlayButton
            href={SITE_URL}
            style={{ top: "77%", left: "5%", right: "5%", height: "5.5%" }}
            label="לביקור באתר הרשמי"
          />

          {/* שמור איש קשר */}
          <OverlayButton
            onClick={() => downloadVCard({ email, phone, website: SITE_URL })}
            style={{ top: "84%", left: "5%", right: "5%", height: "5.5%" }}
            label="שמור איש קשר"
          />
        </div>
      </div>

      {/* ═══ About Bottom Sheet ═══ */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl" style={cssVars as React.CSSProperties}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowAbout(false)} />
          <div className="relative w-full bg-white rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#0A3B2C" }}>אודות</h2>
            <p className="text-sm leading-relaxed text-gray-600">
              {aboutText || `ניצן יעקובי הוא מעצב תכשיטים ויהלומן מוסמך, מייסד ${brand.brand_name}. עם ניסיון של למעלה מ-15 שנה בתעשיית היהלומים, ניצן מתמחה בעיצוב אישי של טבעות אירוסין, שרשראות פנינים וקולקציות ייחודיות – עם דגש על מלאכת צורפות מסורתית ועיצוב מודרני.`}
            </p>
            <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col items-center gap-4">
              <img src={displayLogo} alt={brand.brand_name} className="h-10 object-contain opacity-40" loading="lazy" width={120} height={40} />
              <button onClick={() => setShowAbout(false)} className="text-sm font-semibold py-2.5 px-10 rounded-xl active:scale-[0.97] transition-transform" style={{ color: "#0A3B2C" }}>
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Catalog Bottom Sheet ═══ */}
      <DigitalCardCatalogModal open={showCatalog} onClose={() => setShowCatalog(false)} theme={theme} />

      {/* ═══ Add to Home Screen Prompt ═══ */}
      <A2HSPrompt />
    </>
  );
};

/* ─── Transparent overlay button ──────────────────────────────────────── */
interface OverlayButtonProps {
  href?: string;
  onClick?: () => void;
  style: React.CSSProperties;
  label: string;
}

const OverlayButton = ({ href, onClick, style, label }: OverlayButtonProps) => {
  const baseClass = "absolute block cursor-pointer active:bg-white/10 transition-colors rounded-xl";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={baseClass}
        style={style}
        aria-label={label}
      />
    );
  }

  const isExternal = href?.startsWith("http");
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={baseClass}
      style={style}
      aria-label={label}
    />
  );
};

/* ─── vCard generator ──────────────────────────────────────────────────── */
function downloadVCard(info: { email: string; phone: string; website: string }) {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N;CHARSET=UTF-8:יעקובי;ניצן;;;",
    "FN;CHARSET=UTF-8:ניצן יעקובי",
    "ORG;CHARSET=UTF-8:DiamoNY",
    "TITLE;CHARSET=UTF-8:מעצב תכשיטי זהב, יהלומים ואבני חן",
    `TEL;TYPE=CELL:+${info.phone}`,
    `EMAIL:${info.email}`,
    `URL:${info.website}`,
    "URL:https://diamony.me/digital-card",
    "END:VCARD",
  ].join("\r\n");

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Nitzan_Yacobi_DiamoNY.vcf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default DigitalCard;
