import { useState, useEffect, useCallback } from "react";
import { X, Gift, Sparkles } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUTMParams } from "@/hooks/useUTMTracking";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useEmailFormsEnabled } from "@/hooks/useEmailFormsEnabled";
import ContactFallbackButtons from "@/components/ContactFallbackButtons";
import ConsentBlockedFormOverlay from "@/components/ConsentBlockedFormOverlay";

const POPUP_SHOWN_KEY = "diamony_exit_popup_shown";
const POPUP_COOLDOWN_DAYS = 7;

const exitPopupSchema = z.object({
  name: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים").max(100),
  email: z.string().trim().email("כתובת מייל לא תקינה").max(255),
  marketingConsent: z.literal(true, {
    errorMap: () => ({ message: "יש לאשר את התקנון ומדיניות הפרטיות" }),
  }),
});

const ExitIntentPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    marketingConsent: false,
  });
  // Honeypot fields - hidden from users, bots will fill them
  const [honeypotWebsite, setHoneypotWebsite] = useState("");
  const [honeypotFax, setHoneypotFax] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const { toast } = useToast();
  const { executeRecaptcha } = useRecaptcha();
  const { isEmailFormsEnabled } = useEmailFormsEnabled();

  // Check if popup should be shown
  const shouldShowPopup = useCallback(() => {
    try {
      const lastShown = localStorage.getItem(POPUP_SHOWN_KEY);
      if (!lastShown) return true;
      
      const lastShownDate = new Date(lastShown);
      const daysSince = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= POPUP_COOLDOWN_DAYS;
    } catch {
      return true;
    }
  }, []);

  // Handle mouse leave (exit intent)
  useEffect(() => {
    if (!shouldShowPopup()) return;

    let hasTriggered = false;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top of the viewport
      if (e.clientY <= 0 && !hasTriggered) {
        hasTriggered = true;
        setIsOpen(true);
      }
    };

    // Delay adding the listener to prevent immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000); // Wait 5 seconds before enabling

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [shouldShowPopup]);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as shown
    try {
      localStorage.setItem(POPUP_SHOWN_KEY, new Date().toISOString());
    } catch {
      // Ignore storage errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = exitPopupSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: { name?: string; email?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as "name" | "email";
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const utmParams = getUTMParams();
      
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('exit_popup_signup');
      
      // Route through edge function for server-side validation and rate limiting
      const { data, error } = await supabase.functions.invoke("submit-contact-form", {
        body: {
          name: result.data.name,
          email: result.data.email,
          message: "הרשמה דרך Exit Intent Popup - מעוניין/ת בקופון הנחה",
          privacyConsent: true,
          marketingConsent: result.data.marketingConsent,
          source: "exit_popup",
          // reCAPTCHA token
          recaptchaToken,
          // Honeypot fields for bot detection
          honeypot_website: honeypotWebsite,
          honeypot_fax: honeypotFax,
          utm_source: utmParams.utm_source,
          utm_campaign: utmParams.utm_campaign,
          utm_medium: utmParams.utm_medium,
          referral_source: utmParams.referral_source,
          landing_page: utmParams.landing_page,
        },
      });

      if (error) throw error;
      
      // Check for rate limit or validation errors from edge function
      if (data?.error) {
        toast({
          title: "שגיאה",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Send welcome email if marketing consent given
      if (result.data.marketingConsent) {
        try {
          await supabase.functions.invoke("send-welcome-email", {
            body: { name: result.data.name, email: result.data.email },
          });
        } catch {
          // Don't fail if email fails
        }
      }

      toast({
        title: "🎉 נרשמת בהצלחה!",
        description: "קופון ההנחה נשלח למייל שלך",
      });

      handleClose();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "אנא נסו שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="סגירה"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-accent/20 via-accent/10 to-transparent p-8 text-center">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-accent" />
          </div>
          <h2 className="font-heading text-2xl font-light text-foreground mb-2">
            {isEmailFormsEnabled ? "רגע לפני שעוזבים..." : "דברו איתנו!"}
          </h2>
          <p className="text-muted-foreground">
            {isEmailFormsEnabled 
              ? <>קבלו <span className="text-accent font-semibold">10% הנחה</span> על הרכישה הראשונה!</>
              : "נשמח לעזור לכם למצוא את התכשיט המושלם"
            }
          </p>
        </div>

        <ConsentBlockedFormOverlay>
        {isEmailFormsEnabled ? (
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4">
          {/* Honeypot fields - hidden from users, bots will fill these */}
          <div className="absolute left-[-9999px] opacity-0 pointer-events-none" aria-hidden="true">
            <label htmlFor="exit_website">Website</label>
            <input
              type="text"
              id="exit_website"
              name="website"
              value={honeypotWebsite}
              onChange={(e) => setHoneypotWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
            <label htmlFor="exit_fax">Fax</label>
            <input
              type="text"
              id="exit_fax"
              name="fax"
              value={honeypotFax}
              onChange={(e) => setHoneypotFax(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="השם שלך"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`bg-secondary/50 border-border ${errors.name ? "border-destructive" : ""}`}
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Input
              type="email"
              placeholder="כתובת המייל שלך"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`bg-secondary/50 border-border ${errors.email ? "border-destructive" : ""}`}
              dir="ltr"
              maxLength={255}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="exitMarketingConsent"
              checked={formData.marketingConsent}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingConsent: checked === true }))}
              className="mt-1"
            />
            <Label
              htmlFor="exitMarketingConsent"
              className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
            >
              קראתי ואני מסכים/ה ל<a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">תקנון האתר</a> ול<a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">מדיניות הפרטיות</a>, ומאשר/ת קבלת עדכונים והטבות. <span className="text-destructive">*</span>
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-gold text-base py-5"
          >
            {isSubmitting ? (
              "שולח..."
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-2" />
                קבלת הקופון
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            הרשמה = הסכמה ל<a href="/privacy-policy" className="text-accent hover:underline" target="_blank">מדיניות הפרטיות</a>
          </p>
        </form>
        ) : (
          <div className="p-8 pt-6">
            <ContactFallbackButtons variant="light" className="flex-col" />
          </div>
        )}
        </ConsentBlockedFormOverlay>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
