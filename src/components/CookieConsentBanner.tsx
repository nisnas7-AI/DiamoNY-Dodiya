import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import CookieSettingsModal from "./CookieSettingsModal";

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const isMobile = useIsMobile();
  const { status, acceptAll, rejectAll, openSettings, settingsOpen } = useCookieConsent();

  useEffect(() => {
    if (status === "pending") {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleAcceptAll = () => {
    acceptAll();
    setVisible(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setVisible(false);
  };

  const handleCustomize = () => {
    openSettings();
  };

  if (status !== "pending" && !settingsOpen) return null;
  if (!visible && !settingsOpen) return null;

  return (
    <>
      {visible && status === "pending" && (
        <div
          dir="rtl"
          role="dialog"
          aria-label="אישור קבצי Cookie"
          className={`fixed z-[9999] transition-all duration-500 ease-out ${
            isMobile
              ? "bottom-5 left-4 right-4 rounded-3xl"
              : "bottom-6 right-6 max-w-[380px] rounded-3xl"
          } bg-[#FDFBF7] p-6 shadow-[0_20px_40px_-8px_rgba(0,0,0,0.1)] border border-[rgba(212,175,55,0.15)] animate-in fade-in slide-in-from-bottom-4`}
        >
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-[#D4AF37] flex-shrink-0" strokeWidth={1.8} />
            <h3 className="text-[#1A1A1A] text-sm font-semibold tracking-wide">
              אישור קבצי Cookie
            </h3>
          </div>

          {/* Body */}
          <p className="text-[#1A1A1A] text-[13px] leading-relaxed text-center mb-2">
            אנו משתמשים בקובצי Cookie כדי לעזור לך לנווט ביעילות ולבצע פונקציות מסוימות. קובצי ה-Cookie המסווגים כ&quot;הכרחיים&quot; חיוניים לפעילות האתר. אנו משתמשים גם בקובצי צד שלישי (בכפוף להסכמתך) לניתוח, העדפות ופרסום.
          </p>

          {/* Privacy link */}
          <div className="text-center mb-4">
            <Link
              to="/privacy"
              className="inline-block text-[#D4AF37] text-[12px] underline underline-offset-2 decoration-[#D4AF37]/40 hover:decoration-[#D4AF37] transition-colors"
            >
              למעבר אל הצהרת הפרטיות ומדיניות האבטחה
            </Link>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAcceptAll}
              className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-[#1A1A1A] text-sm font-semibold tracking-wide hover:brightness-110 hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
            >
              אשר הכל
            </button>
            <button
              onClick={handleRejectAll}
              className="w-full py-2 rounded-lg border border-[#E5E7EB] bg-transparent text-[#1A1A1A] text-sm font-medium hover:bg-[#E5E7EB]/50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
            >
              דחה הכל
            </button>
            <button
              onClick={handleCustomize}
              className="w-full py-1.5 text-[#6B7280] text-xs hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 rounded"
            >
              התאמה אישית
            </button>
          </div>
        </div>
      )}

      <CookieSettingsModal onClose={() => setVisible(false)} />
    </>
  );
};

export default CookieConsentBanner;
