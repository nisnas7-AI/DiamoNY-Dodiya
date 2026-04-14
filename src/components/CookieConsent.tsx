import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const CONSENT_KEY = "diamony_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const hasConsent = localStorage.getItem(CONSENT_KEY);
    if (!hasConsent) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-label="הסכמת עוגיות"
      className={`fixed z-[9999] transition-all duration-500 ease-out ${
        isMobile
          ? "bottom-0 left-0 right-0 rounded-t-2xl"
          : "bottom-6 right-6 max-w-[380px] rounded-xl"
      } bg-[#F8F9FA] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-[#E5E7EB] animate-in fade-in slide-in-from-bottom-4`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-[#D4AF37] flex-shrink-0" strokeWidth={1.8} />
        <h3 className="text-[#1A1A1A] text-sm font-semibold tracking-wide">
          פרטיות ואבטחה
        </h3>
      </div>

      {/* Body */}
      <p className="text-[#1A1A1A] text-[13px] leading-relaxed mb-1">
        אנו ב-DiamoNY משתמשים בקובצי Cookies כדי להבטיח לך חוויית קנייה מותאמת
        אישית, חלקה ומאובטחת ברמה הגבוהה ביותר.
      </p>

      {/* Privacy link */}
      <Link
        to="/privacy"
        className="inline-block text-[#D4AF37] text-[12px] underline underline-offset-2 decoration-[#D4AF37]/40 hover:decoration-[#D4AF37] transition-colors mb-4"
      >
        למסמך האבטחה ומדיניות הפרטיות
      </Link>

      {/* Primary CTA */}
      <button
        onClick={handleAccept}
        className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-[#1A1A1A] text-sm font-semibold tracking-wide hover:brightness-110 hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
      >
        קראתי ואישרתי
      </button>

      {/* Secondary */}
      <button
        onClick={handleAccept}
        className="w-full mt-2 py-1.5 text-[#6B7280] text-xs hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 rounded"
      >
        הגדרות
      </button>
    </div>
  );
};

export default CookieConsent;
