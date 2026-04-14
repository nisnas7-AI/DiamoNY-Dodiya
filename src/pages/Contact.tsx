import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Mail, Phone, MapPin, Clock, Send, ChevronDown } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUTMTracking } from "@/hooks/useUTMTracking";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import GoldBuyingBanner from "@/components/GoldBuyingBanner";
import DesignAppointmentBanner from "@/components/DesignAppointmentBanner";
import ContactFallbackButtons from "@/components/ContactFallbackButtons";
import ConsentBlockedFormOverlay from "@/components/ConsentBlockedFormOverlay";
import { useEmailFormsEnabled } from "@/hooks/useEmailFormsEnabled";

// Zod schema for form validation
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "שם חייב להכיל לפחות 2 תווים")
    .max(100, "שם לא יכול להכיל יותר מ-100 תווים"),
  email: z
    .string()
    .trim()
    .email("כתובת מייל לא תקינה")
    .max(255, "מייל לא יכול להכיל יותר מ-255 תווים"),
  phone: z
    .string()
    .trim()
    .max(20, "מספר טלפון לא יכול להכיל יותר מ-20 תווים")
    .refine(
      (val) => !val || /^[\d\-\+\s\(\)]+$/.test(val),
      "מספר טלפון יכול להכיל רק ספרות ותווים מיוחדים"
    )
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "הודעה חייבת להכיל לפחות 10 תווים")
    .max(2000, "הודעה לא יכולה להכיל יותר מ-2000 תווים"),
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: "יש לאשר את מדיניות הפרטיות" }),
  }),
  marketingConsent: z.boolean(),
  jewelryInterestType: z.string().optional(),
  estimatedBudget: z.string().optional(),
  metalPreference: z.string().optional(),
  ringSize: z.string().max(10).optional(),
  eventTargetDate: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Jewelry options
const jewelryTypeOptions = [
  { value: "engagement_ring", label: "טבעת אירוסין" },
  { value: "wedding_ring", label: "טבעת נישואין" },
  { value: "bracelet", label: "צמיד" },
  { value: "earrings", label: "עגילים" },
  { value: "necklace", label: "שרשרת" },
  { value: "pendant", label: "תליון" },
  { value: "custom_design", label: "עיצוב אישי" },
  { value: "other", label: "אחר" },
];

const metalOptions = [
  { value: "yellow_14k", label: "זהב צהוב 14K" },
  { value: "yellow_18k", label: "זהב צהוב 18K" },
  { value: "white_14k", label: "זהב לבן 14K" },
  { value: "white_18k", label: "זהב לבן 18K" },
  { value: "rose_14k", label: "רוז גולד 14K" },
  { value: "rose_18k", label: "רוז גולד 18K" },
  { value: "platinum", label: "פלטינום" },
];

const budgetOptions = [
  { value: "under_5k", label: "עד ₪5,000" },
  { value: "5k_10k", label: "₪5,000 - ₪10,000" },
  { value: "10k_20k", label: "₪10,000 - ₪20,000" },
  { value: "20k_50k", label: "₪20,000 - ₪50,000" },
  { value: "over_50k", label: "מעל ₪50,000" },
];

// Rate limiting constants
const RATE_LIMIT_KEY = "contact_form_submissions";
const MAX_SUBMISSIONS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const checkRateLimit = (): boolean => {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return true;
    
    const submissions: number[] = JSON.parse(stored);
    const now = Date.now();
    const recentSubmissions = submissions.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );
    
    return recentSubmissions.length < MAX_SUBMISSIONS_PER_HOUR;
  } catch {
    return true;
  }
};

const recordSubmission = () => {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const submissions: number[] = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    
    // Keep only recent submissions + new one
    const recentSubmissions = submissions.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );
    recentSubmissions.push(now);
    
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentSubmissions));
  } catch {
    // Ignore storage errors
  }
};

const Contact = () => {
  const { toast } = useToast();
  const utmParams = useUTMTracking();
  const { executeRecaptcha } = useRecaptcha();
  const { isEmailFormsEnabled } = useEmailFormsEnabled();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    privacyConsent: false,
    marketingConsent: false,
    jewelryInterestType: "",
    estimatedBudget: "",
    metalPreference: "",
    ringSize: "",
    eventTargetDate: "",
  });
  // Honeypot fields - hidden from users, bots will fill them
  const [honeypotWebsite, setHoneypotWebsite] = useState("");
  const [honeypotFax, setHoneypotFax] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check rate limit before processing
    if (!checkRateLimit()) {
      toast({
        title: "יותר מדי ניסיונות",
        description: "נא להמתין לפני שליחת הודעה נוספת. נסו שוב מאוחר יותר.",
        variant: "destructive",
      });
      return;
    }

    // Validate with Zod
    const result = contactSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({
        title: "שגיאה בטופס",
        description: "נא לתקן את השגיאות המסומנות",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('submit_contact_form');
      
      // Submit to server-side edge function for validation
      const { data: responseData, error } = await supabase.functions.invoke("submit-contact-form", {
        body: {
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone || null,
          message: result.data.message,
          privacyConsent: result.data.privacyConsent,
          marketingConsent: result.data.marketingConsent,
          // reCAPTCHA token
          recaptchaToken,
          // Honeypot fields for bot detection
          honeypot_website: honeypotWebsite,
          honeypot_fax: honeypotFax,
          // UTM tracking
          utm_source: utmParams.utm_source,
          utm_campaign: utmParams.utm_campaign,
          utm_medium: utmParams.utm_medium,
          referral_source: utmParams.referral_source,
          landing_page: utmParams.landing_page,
          // Jewelry preferences
          jewelry_interest_type: result.data.jewelryInterestType || null,
          estimated_budget: result.data.estimatedBudget || null,
          metal_preference: result.data.metalPreference || null,
          ring_size: result.data.ringSize || null,
          event_target_date: result.data.eventTargetDate || null,
        },
      });

      if (error) {
        throw new Error(error.message || "שגיאה בשליחת ההודעה");
      }

      // Send welcome email if marketing consent is given
      if (result.data.marketingConsent) {
        try {
          await supabase.functions.invoke("send-welcome-email", {
            body: { name: result.data.name, email: result.data.email },
          });
        } catch (emailError) {
          // Don't fail the form submission if email fails
          console.error("Failed to send welcome email:", emailError);
        }
      }

      // Record successful submission for client-side rate limiting backup
      recordSubmission();

      toast({
        title: "ההודעה נשלחה בהצלחה!",
        description: result.data.marketingConsent 
          ? "ניצור איתך קשר בהקדם. בדקו את תיבת המייל שלכם!" 
          : "ניצור איתך קשר בהקדם האפשרי",
      });

      setFormData({ 
        name: "", 
        email: "", 
        phone: "", 
        message: "", 
        privacyConsent: false, 
        marketingConsent: false,
        jewelryInterestType: "",
        estimatedBudget: "",
        metalPreference: "",
        ringSize: "",
        eventTargetDate: "",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה בשליחת ההודעה",
        description: error?.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "טלפון",
      content: "054-629-0534",
      href: "tel:+972546290534",
    },
    {
      icon: Mail,
      title: "אימייל",
      content: "nisnas7@gmail.com",
      href: "mailto:nisnas7@gmail.com",
    },
    {
      icon: MapPin,
      title: "כתובת",
      content: "אשקלון",
      href: null,
    },
    {
      icon: Clock,
      title: "שעות פעילות",
      content: "א׳-ה׳ 09:00-17:00 | ו׳ 09:00-14:00",
      href: null,
    },
  ];

  return (
    <>
      <Helmet>
        <title>צור קשר | DiamoNY - תכשיטי יוקרה בעבודת יד</title>
        <meta
          name="description"
          content="צרו קשר עם DiamoNY לייעוץ אישי בעיצוב תכשיטים. טלפון, אימייל או השאירו הודעה ונחזור אליכם בהקדם."
        />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section - Tight spacing (40% reduction) */}
        <section className="relative py-8 md:py-10 bg-gradient-to-b from-secondary/50 to-background">
          <div className="container-luxury text-center">
            <span className="text-accent font-light text-sm tracking-[0.3em] uppercase mb-1.5 block">
              CONTACT US
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-1.5">
              צרו איתנו קשר
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-0">
              נשמח לשמוע מכם ולעזור לכם להגשים את חלום התכשיט המושלם
            </p>
          </div>
        </section>

        {/* Main Content - Optimized spacing */}
        <section className="py-8 md:py-12">
          <div className="container-luxury">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Contact Form */}
              <div className="order-2 lg:order-1">
                <ConsentBlockedFormOverlay>
                <div className="card-luxury p-6 md:p-8">
                  <h2 className="font-heading text-2xl font-light text-foreground mb-1">
                    {isEmailFormsEnabled ? "השאירו הודעה" : "צרו איתנו קשר"}
                  </h2>
                  <p className="text-muted-foreground mb-5">
                    {isEmailFormsEnabled 
                      ? "מלאו את הפרטים ונחזור אליכם בהקדם האפשרי"
                      : "בחרו את הדרך הנוחה לכם ליצור איתנו קשר"
                    }
                  </p>

                  {isEmailFormsEnabled ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Honeypot fields - hidden from users, bots will fill these */}
                    <div className="absolute left-[-9999px] opacity-0 pointer-events-none" aria-hidden="true">
                      <label htmlFor="contact_website">Website</label>
                      <input
                        type="text"
                        id="contact_website"
                        name="website"
                        value={honeypotWebsite}
                        onChange={(e) => setHoneypotWebsite(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                      <label htmlFor="contact_fax">Fax</label>
                      <input
                        type="text"
                        id="contact_fax"
                        name="fax"
                        value={honeypotFax}
                        onChange={(e) => setHoneypotFax(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">
                        שם מלא <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="הזינו את שמכם"
                        className={`bg-background border-border focus:border-accent ${errors.name ? "border-destructive" : ""}`}
                        maxLength={100}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">
                        כתובת אימייל <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={`bg-background border-border focus:border-accent ${errors.email ? "border-destructive" : ""}`}
                        dir="ltr"
                        maxLength={255}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground">
                        טלפון
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="050-000-0000"
                        className={`bg-background border-border focus:border-accent ${errors.phone ? "border-destructive" : ""}`}
                        dir="ltr"
                        maxLength={20}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>

                    {/* Advanced Jewelry Fields Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                      className="flex items-center gap-2 text-accent hover:text-accent/80 text-sm font-medium transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFields ? 'rotate-180' : ''}`} />
                      פרטים נוספים (אופציונלי)
                    </button>

                    {/* Advanced Jewelry Fields */}
                    {showAdvancedFields && (
                      <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="jewelryInterestType" className="text-foreground text-sm">
                              סוג תכשיט מבוקש
                            </Label>
                            <Select
                              value={formData.jewelryInterestType}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, jewelryInterestType: value }))}
                            >
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="בחרו סוג תכשיט" />
                              </SelectTrigger>
                              <SelectContent>
                                {jewelryTypeOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="metalPreference" className="text-foreground text-sm">
                              סוג זהב מועדף
                            </Label>
                            <Select
                              value={formData.metalPreference}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, metalPreference: value }))}
                            >
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="בחרו סוג זהב" />
                              </SelectTrigger>
                              <SelectContent>
                                {metalOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="estimatedBudget" className="text-foreground text-sm">
                              תקציב משוער
                            </Label>
                            <Select
                              value={formData.estimatedBudget}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, estimatedBudget: value }))}
                            >
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="בחרו טווח תקציב" />
                              </SelectTrigger>
                              <SelectContent>
                                {budgetOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ringSize" className="text-foreground text-sm">
                              מידת טבעת (אם רלוונטי)
                            </Label>
                            <Input
                              id="ringSize"
                              name="ringSize"
                              type="text"
                              value={formData.ringSize}
                              onChange={handleChange}
                              placeholder="לדוג׳: 7, 8.5, 52"
                              className="bg-background border-border focus:border-accent"
                              maxLength={10}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="eventTargetDate" className="text-foreground text-sm">
                            תאריך יעד לאירוע (אם יש)
                          </Label>
                          <Input
                            id="eventTargetDate"
                            name="eventTargetDate"
                            type="date"
                            value={formData.eventTargetDate}
                            onChange={handleChange}
                            className="bg-background border-border focus:border-accent"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-foreground">
                        הודעה <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="ספרו לנו במה נוכל לעזור..."
                        rows={6}
                        className={`bg-background border-border focus:border-accent resize-none ${errors.message ? "border-destructive" : ""}`}
                        maxLength={2000}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground text-left">
                        {formData.message.length}/2000
                      </p>
                    </div>

                    {/* Privacy Policy Consent Checkbox - Required (Israeli Privacy Law Section 13 + AI Disclosure) */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="privacyConsent"
                          checked={formData.privacyConsent}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              privacyConsent: checked === true,
                            }));
                            if (errors.privacyConsent) {
                              setErrors((prev) => ({ ...prev, privacyConsent: undefined }));
                            }
                          }}
                          className="mt-1"
                          required
                        />
                        <Label
                          htmlFor="privacyConsent"
                          className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                        >
                          אנו אוספים פרטי קשר ומידע סטטיסטי המהווים מידע אישי על פי חוק (כגון סוג מכשיר, כתובת IP, אפיוני גלישה, מיקום), וכן פרטי קשר כגון טלפון ומייל. בנוסף, אנו משתמשים או עשויים להשתמש בשירותים מבוססים בינה מלאכותית. אינך חייב על פי דין להסכים לאיסוף המידע, אך ככל שלא תסכים ייתכן שלא נוכל להעניק לך שירותים מסוימים ושירותים אחרים יוענקו בצורה חלקית. להרחבה, ראה את{" "}
                          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                            מדיניות הפרטיות המלאה שלנו
                          </a>
                          . בלחיצה על &lsquo;אני מסכימ.ה&rsquo;, את.ה מסכימ.ה לאיסוף ועיבוד המידע בהתאם לאמור בה. <span className="text-destructive">*</span>
                        </Label>
                      </div>
                      {errors.privacyConsent && (
                        <p className="text-sm text-destructive pr-7">{errors.privacyConsent}</p>
                      )}
                    </div>

                    {/* Marketing Consent Checkbox */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="marketingConsent"
                          checked={formData.marketingConsent}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              marketingConsent: checked === true,
                            }));
                          }}
                          className="mt-1"
                        />
                        <Label
                          htmlFor="marketingConsent"
                          className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                        >
                          אני מאשר/ת קבלת עדכונים, מבצעים ותוכן שיווקי מ-DiamoNY במייל וב-SMS.
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground pr-7 italic">
                        🛡️ אנחנו שונאים ספאם בדיוק כמוך. מבטיחים לשלוח רק השראות ועיצובים מיוחדים.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-gold text-lg py-6"
                    >
                      {isSubmitting ? (
                        "שולח..."
                      ) : (
                        <>
                          <Send className="w-5 h-5 ml-2" />
                          שליחת הודעה
                        </>
                      )}
                    </Button>
                  </form>
                  ) : (
                    <div className="py-8">
                      <ContactFallbackButtons variant="light" className="flex-col" />
                    </div>
                  )}
                </div>
                </ConsentBlockedFormOverlay>
              </div>

              {/* Contact Info */}
              <div className="order-1 lg:order-2 space-y-8">
                <div>
                  <span className="text-accent font-light text-sm tracking-[0.2em] uppercase mb-2 block">
                    GET IN TOUCH
                  </span>
                  <h2 className="font-heading text-2xl font-light text-foreground mb-4">
                    דרכי יצירת קשר
                  </h2>
                  <p className="text-muted-foreground">
                    אנחנו זמינים עבורכם בכל אחת מהדרכים הבאות. בחרו את הנוחה לכם
                    ביותר.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {contactInfo.map((item) => (
                    <div
                      key={item.title}
                      className="card-luxury p-6 group hover:border-accent/30 transition-all"
                    >
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                        <item.icon className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-muted-foreground hover:text-accent transition-colors"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{item.content}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* WhatsApp CTA */}
                <div className="card-luxury p-8 bg-gradient-to-br from-[#25D366]/10 to-[#25D366]/5 border-[#25D366]/20">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    מעדיפים לדבר בוואטסאפ?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    לחצו על הכפתור הצף בפינת המסך או סרקו את הקוד
                  </p>
                  <a
                    href="https://wa.me/972546290534?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A7%D7%91%D7%9C%20%D7%9E%D7%99%D7%93%D7%A2%20%D7%A0%D7%95%D7%A1%D7%A3%20%D7%A2%D7%9C%20%D7%94%D7%AA%D7%9B%D7%A9%D7%99%D7%98%D7%99%D7%9D%20%D7%A9%D7%9C%D7%9B%D7%9D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-sm font-medium hover:bg-[#20BD5A] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    פתיחת שיחה בוואטסאפ
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
      <GoldBuyingBanner />
      <DesignAppointmentBanner />
    </>
  );
};

export default Contact;