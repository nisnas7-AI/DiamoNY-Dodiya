import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShoppingBag } from "lucide-react";
import { useVip } from "@/contexts/VipContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analyticsTracker";

type ModalView = "input" | "marketing";

interface VaultLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VaultLoginModal = ({ isOpen, onClose }: VaultLoginModalProps) => {
  const [view, setView] = useState<ModalView>("input");
  const [accessKey, setAccessKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teaserMessage, setTeaserMessage] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<{ name: string; credit: number } | null>(null);
  const { login } = useVip();
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setView("input");
      setAccessKey("");
      setTeaserMessage(null);
    }, 300);
  };

  const handleResetToInput = () => {
    setView("input");
    setAccessKey("");
    setTeaserMessage(null);
  };

  const handleGoToCollection = () => {
    // Fire async — never blocks routing
    trackEvent("vault_unauthorized_conversion_click", "marketing_gateway", {
      // Omitting raw phone for privacy compliance; logging presence only
    });
    handleClose();
    navigate("/catalog");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = accessKey.trim();
    if (!key || key.length < 3 || isSubmitting) return;

    setIsSubmitting(true);
    setTeaserMessage(null);

    const result = await login(key);

    if (result.success) {
      handleClose();
      try {
        const stored = sessionStorage.getItem("diamony_vault_session");
        if (stored) {
          const member = JSON.parse(stored);
          setWelcome({ name: member.full_name, credit: Number(member.credit_balance) });
          setTimeout(() => setWelcome(null), 5000);
        }
      } catch { /* ignore */ }
      navigate("/the-lounge");
    } else if (result.error === "teaser") {
      const { data } = await supabase
        .from("vip_settings")
        .select("value")
        .eq("key", "teaser_message")
        .single();
      setTeaserMessage(data?.value || "גישה בלעדית ללקוחות DiamoNY.");
    } else if (
      result.error === "not_found" ||
      !result.error ||
      result.error.includes("not found") ||
      result.error === "שגיאה לא צפויה."
    ) {
      // Phone number not recognised — show marketing gateway instead of error
      setView("marketing");
    } else {
      setTeaserMessage(result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          className="glass-modal w-[90vw] max-w-[340px] sm:max-w-md !rounded-3xl p-0 overflow-hidden"
          dir="rtl"
        >
          <AnimatePresence mode="wait">
            {view === "input" ? (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Header */}
                <div className="px-6 sm:px-8 pt-10 sm:pt-12 pb-2 text-center">
                  <DialogTitle className="text-2xl md:text-3xl font-heading text-[#1a1a1a] tracking-[0.05em] leading-relaxed font-semibold">
                    ברוכים הבאים לכספת של לקוחות DiamoNY
                  </DialogTitle>
                  <p className="text-base text-[#1a1a1a]/70 mt-4 font-body">
                    נא להזין את מפתח הגישה
                  </p>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 sm:px-8 pt-4 pb-8 sm:pb-10 space-y-6">
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={accessKey}
                    onChange={(e) => {
                      setAccessKey(e.target.value);
                      setTeaserMessage(null);
                    }}
                    className="text-center text-lg tracking-[0.3em] rounded-xl border-slate-200 bg-slate-50 text-[#1a1a1a] h-14 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 placeholder:text-transparent"
                    autoComplete="off"
                    dir="ltr"
                  />

                  {teaserMessage && (
                    <div className="text-center p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                      <p className="text-sm text-[#1a1a1a]/75 leading-relaxed">{teaserMessage}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!accessKey.trim() || isSubmitting}
                    className="w-full h-12 rounded-xl bg-[#D4AF37] hover:bg-[#c5a030] text-[#0a0a0a] font-semibold text-base tracking-wide transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "כניסה"
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="marketing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="px-6 sm:px-8 pt-10 sm:pt-12 pb-8 sm:pb-10 flex flex-col items-center text-center space-y-6"
              >
                {/* Decorative top rule */}
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

                <DialogTitle className="text-2xl md:text-3xl font-heading text-[#1a1a1a] tracking-[0.05em] leading-relaxed font-semibold">
                  הגעתם לכספת הפרטית של DiamoNY
                </DialogTitle>

                <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

                <div className="w-full rounded-2xl bg-[#D4AF37]/[0.08] border border-[#D4AF37]/25 mx-auto" style={{ padding: '20px' }}>
                  <p style={{ fontWeight: 900, color: '#1a1a1a' }} className="text-sm md:text-[0.9rem] leading-loose font-body tracking-wide max-w-sm mx-auto text-center">
                    אזור זה שמור ללקוחות המותג ומעניק הטבות בלעדיות, שירותי VIP ותכשיטים שלא נחשפים לקהל הרחב.
                    {" "}בעת רכישת יצירה מבית DiamoNY, תצורפו למעגל הלקוחות האקסקלוסיבי ותקבלו מפתח אישי,
                    הפותח דלת לעולם של חוויות והטבות השמורות רק לכם.
                  </p>
                </div>

                <div className="w-full pt-2 space-y-4">
                  <Button
                    onClick={handleGoToCollection}
                    className="w-full h-12 rounded-xl bg-[#D4AF37] hover:bg-[#c5a030] text-[#0a0a0a] font-semibold text-base tracking-wide transition-all duration-300 gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    לצפייה בקולקציה
                  </Button>

                  <button
                    onClick={handleResetToInput}
                    className="w-full text-sm text-[#1a1a1a]/30 hover:text-[#1a1a1a]/60 transition-colors duration-300 font-body tracking-wide py-1"
                  >
                    נסו שוב
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Welcome Toast — shown after successful login */}
      <AnimatePresence>
        {welcome && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          >
            <div
              className="px-8 py-5 rounded-2xl shadow-2xl border border-[#C9A96E]/30 backdrop-blur-md"
              style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}
              dir="rtl"
            >
              <p className="text-[#C9A96E] font-heading text-lg tracking-wide text-center">
                שלום {welcome.name}!
              </p>
              <p className="text-white/80 text-sm mt-1 text-center font-body">
                יתרת הקרדיט שלך: ₪{welcome.credit.toLocaleString("he-IL")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VaultLoginModal;


