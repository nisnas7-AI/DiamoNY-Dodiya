import { ShieldAlert } from "lucide-react";
import ContactFallbackButtons from "./ContactFallbackButtons";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

/**
 * Wrap any lead/contact form with this component.
 * When consent is rejected, it disables the form and shows a warning.
 */
const ConsentBlockedFormOverlay = ({ children }: { children: React.ReactNode }) => {
  const { isFormsBlocked } = useCookieConsent();

  if (!isFormsBlocked) return <>{children}</>;

  return (
    <div className="relative" dir="rtl">
      {/* Disabled form underneath */}
      <div className="opacity-30 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay warning */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-[#F8F9FA]/95 rounded-xl backdrop-blur-sm">
        <ShieldAlert className="w-10 h-10 text-[#B91C1C]" strokeWidth={1.5} />
        <p className="text-[#1A1A1A] text-sm font-semibold text-center leading-relaxed max-w-xs">
          עקב אי-אישור קבצי עוגיות, לא ניתן להשאיר פרטים בטופס. אנא צור קשר טלפונית או דרך וואטסאפ.
        </p>
        <ContactFallbackButtons variant="light" />
      </div>
    </div>
  );
};

export default ConsentBlockedFormOverlay;
