import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useCookieConsent, type CookiePreferences } from "@/contexts/CookieConsentContext";

interface Category {
  key: keyof CookiePreferences;
  label: string;
  description: string;
  locked?: boolean;
}

const CATEGORIES: Category[] = [
  {
    key: "necessary",
    label: "הכרחי",
    description: "קובצי Cookie הכרחיים נדרשים כדי לאפשר תכונות בסיסיות, כניסה מאובטחת, והתאמת העדפות. אינם מאחסנים מידע מזהה.",
    locked: true,
  },
  {
    key: "functional",
    label: "פונקציונלי",
    description: "מסייעים בשיתוף תוכן, איסוף משוב ותכונות צד שלישי.",
  },
  {
    key: "analytics",
    label: "אנליטיקס",
    description: "משמשים להבנת האינטראקציה של מבקרים, ספירת צפיות ומקורות תנועה.",
  },
  {
    key: "performance",
    label: "ביצועים",
    description: "ניתוח מדדי ביצועים מרכזיים לחוויית משתמש טובה יותר.",
  },
  {
    key: "advertisement",
    label: "פרסומת",
    description: "מספקים פרסומות מותאמות אישית וניתוח קמפיינים.",
  },
];

interface Props {
  onClose: () => void;
}

const CookieSettingsModal = ({ onClose }: Props) => {
  const { preferences, acceptAll, rejectAll, savePreferences, settingsOpen, setSettingsOpen } = useCookieConsent();
  const [local, setLocal] = useState<CookiePreferences>(preferences);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (!settingsOpen) return null;

  const toggle = (key: keyof CookiePreferences) => {
    if (key === "necessary") return;
    setLocal((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = () => {
    savePreferences(local);
    setSettingsOpen(false);
    onClose();
  };

  const handleAcceptAll = () => {
    acceptAll();
    setSettingsOpen(false);
    onClose();
  };

  const handleRejectAll = () => {
    rejectAll();
    setSettingsOpen(false);
    onClose();
  };

  const handleClose = () => {
    setSettingsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in"
        onClick={handleClose}
      />

      <div
        dir="rtl"
        role="dialog"
        aria-label="הגדרות קבצי Cookie"
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#FDFBF7] rounded-3xl shadow-[0_20px_40px_-8px_rgba(0,0,0,0.1)] border border-[rgba(212,175,55,0.15)] animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#F8F9FA] border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-[#1A1A1A] text-base font-semibold">הגדרות קבצי Cookie</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-[#E5E7EB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
            aria-label="סגור"
          >
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Intro */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-[#1A1A1A] text-[13px] leading-relaxed">
            אנו משתמשים בקובצי Cookie כדי לעזור לך לנווט ביעילות ולבצע פונקציות מסוימות. קובצי ה-Cookie המסווגים כ&quot;הכרחיים&quot; חיוניים לפעילות האתר. אנו משתמשים גם בקובצי צד שלישי (בכפוף להסכמתך) לניתוח, העדפות ופרסום.
          </p>
        </div>

        {/* Categories */}
        <div className="px-6 py-3 space-y-1">
          {CATEGORIES.map((cat) => {
            const isExpanded = expandedKey === cat.key;
            return (
              <div key={cat.key} className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedKey(isExpanded ? null : cat.key)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F1F2F4] transition-colors text-right"
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`w-4 h-4 text-[#6B7280] transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                    <span className="text-[#1A1A1A] text-sm font-medium">{cat.label}</span>
                    {cat.locked && (
                      <span className="text-[10px] bg-[#D4AF37]/15 text-[#856404] px-2 py-0.5 rounded-full font-medium">
                        תמיד פעיל
                      </span>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={local[cat.key]}
                      onCheckedChange={() => toggle(cat.key)}
                      disabled={cat.locked}
                      className="data-[state=checked]:bg-[#E69A28]"
                    />
                  </div>
                </button>
                {/* Smooth accordion via CSS grid */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-3 pt-0 text-[#6B7280] text-[12px] leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#F8F9FA] border-t border-[#E5E7EB] px-6 py-4 flex flex-wrap gap-2 rounded-b-2xl">
          <button
            onClick={handleRejectAll}
            className="flex-1 min-w-[100px] py-2 rounded-lg border border-[#E5E7EB] text-[#1A1A1A] text-xs font-medium hover:bg-[#E5E7EB]/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          >
            דחה הכל
          </button>
          <button
            onClick={handleSave}
            className="flex-1 min-w-[100px] py-2 rounded-lg border border-[#D4AF37] text-[#1A1A1A] text-xs font-medium hover:bg-[#D4AF37]/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          >
            שמור את ההעדפות שלי
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 min-w-[100px] py-2 rounded-lg bg-[#D4AF37] text-[#1A1A1A] text-xs font-semibold hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          >
            אשר הכל
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieSettingsModal;
