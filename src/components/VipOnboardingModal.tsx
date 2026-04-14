import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVip } from "@/contexts/VipContext";
import VipTermsModal from "./VipTermsModal";
import { toast } from "sonner";

interface VipOnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const VipOnboardingModal = ({ isOpen, onComplete }: VipOnboardingModalProps) => {
  const { member, refreshMember } = useVip();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [consentText, setConsentText] = useState("קראתי והבנתי את תקנון ה-VIP ומדיניות הפרטיות");

  useEffect(() => {
    supabase
      .from("vip_settings")
      .select("value")
      .eq("key", "consent_text")
      .single()
      .then(({ data }) => {
        if (data?.value) setConsentText(data.value);
      });
  }, []);

  const renderedConsentLabel = useMemo(() => {
    const linkPatterns = ["תקנון ה-VIP ומדיניות הפרטיות", "תקנון", "מדיניות הפרטיות"];
    let text = consentText;
    for (const pattern of linkPatterns) {
      if (text.includes(pattern)) {
        const parts = text.split(pattern);
        return (
          <span className="text-sm text-primary-foreground/80 leading-relaxed">
            {parts[0]}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-gold-warm underline underline-offset-2 hover:text-gold-warm-hover transition-colors"
            >
              {pattern}
            </button>
            {parts[1]}
          </span>
        );
      }
    }
    return <span className="text-sm text-primary-foreground/80">{text}</span>;
  }, [consentText]);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !consent || !isValidEmail(email)) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from("vip_members")
      .update({
        email: email.trim(),
        marketing_consent: true,
        consent_date: new Date().toISOString(),
      })
      .eq("id", member.id);

    if (error) {
      toast.error("שגיאה בשמירת הנתונים. נסו שוב.");
      setIsSubmitting(false);
      return;
    }

    await refreshMember();
    toast.success("ברוכים הבאים לכספת!");
    setIsSubmitting(false);
    onComplete();
  };

  return (
    <>
      <Dialog open={isOpen && !showTerms} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md border-0 shadow-2xl rounded-[2rem] bg-primary p-0 overflow-hidden [&>button]:hidden"
          dir="rtl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="px-8 pt-12 pb-2 text-center">
            <DialogTitle className="text-xl md:text-2xl font-heading text-gold-warm tracking-wide leading-relaxed">
              רגע לפני שנכנסים לכספת...
            </DialogTitle>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pt-4 pb-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-primary-foreground/60 font-body">כתובת אימייל</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center text-base rounded-xl border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground h-12 focus:border-gold-warm focus:ring-gold-warm/30"
                dir="ltr"
                required
              />
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="vip-consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-1 border-primary-foreground/30 data-[state=checked]:bg-gold-warm data-[state=checked]:border-gold-warm"
              />
              <label htmlFor="vip-consent" className="cursor-pointer">
                {renderedConsentLabel}
              </label>
            </div>

            <Button
              type="submit"
              disabled={!consent || !isValidEmail(email) || isSubmitting}
              className="w-full h-12 rounded-xl bg-gold-warm hover:bg-gold-warm-hover text-primary font-semibold text-base tracking-wide transition-all duration-300 disabled:opacity-40"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "אישור וכניסה"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <VipTermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </>
  );
};

export default VipOnboardingModal;
