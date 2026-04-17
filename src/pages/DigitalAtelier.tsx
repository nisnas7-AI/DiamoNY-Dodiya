import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { useBrandSettings } from "@/contexts/BrandSettingsContext";
import { SectionSettingsProvider } from "@/contexts/SectionSettingsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Testimonials from "@/components/Testimonials";

interface FaqItem { question: string; answer: string; }

const WHATSAPP_NUMBER = "972546290534";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("שלום, אשמח לקבל מידע נוסף")}`;

const DigitalAtelier = () => {
  const brand = useBrandSettings();

  const { data, isLoading } = useQuery({
    queryKey: ["digital-atelier"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "digital-atelier")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const metadata = (data?.metadata as Record<string, unknown>) || {};
  const heroTitle = data?.title || "סטודיו דיגיטלי DiamoNY";
  const mainContent = data?.content || "";

  // Parse FAQ from faq_json string
  let faqItems: FaqItem[] = [];
  if (typeof metadata.faq_json === "string" && metadata.faq_json.trim()) {
    try { faqItems = JSON.parse(metadata.faq_json); } catch { /* skip */ }
  } else if (Array.isArray(metadata.faq_items)) {
    faqItems = metadata.faq_items as FaqItem[];
  }

  const seoTitle = (metadata.seo_title as string) || "DiamoNY - סטודיו דיגיטלי";
  const metaDesc = (metadata.meta_description as string) || "גלו את העתיד של עולם התכשיטים בסטודיו הדיגיטלי של DiamoNY.";

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#FAF8F5]" dir="rtl">
          <div className="max-w-3xl mx-auto px-6 py-12 space-y-4">
            <Skeleton className="h-8 w-2/3 mx-auto" />
            <Skeleton className="h-4 w-1/3 mx-auto" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={metaDesc} />
        <link rel="canonical" href="https://diamony.me/digital-atelier" />
        <html lang="he" dir="rtl" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JewelryStore",
          "name": "DiamoNY - סטודיו לתכשיטי יוקרה ועיצוב אישי",
          "description": "Atelier דיגיטלי המתמחה בתכשיטי יוקרה בהתאמה אישית, הדמיות 3D וליווי אישי מרחוק. איכות עילית ללא פערי תיווך.",
          "url": "https://diamony.me/digital-atelier",
          "telephone": "+972546290534",
          "image": "https://diamony.me/logo.png",
          "priceRange": "$$$",
          "address": { "@type": "PostalAddress", "addressCountry": "IL", "addressLocality": "Israel" },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "42" },
          "mainEntity": [
            {
              "@type": "Question",
              "name": "איך אפשר לסמוך על קניית תכשיט יוקרה בסטודיו וירטואלי?",
              "acceptedAnswer": { "@type": "Answer", "text": "ב-DiamoNY אנו מספקים ליווי אישי מקצה לקצה, כולל תעודות גמולוגיות בינלאומיות לכל יהלום וביטוח מלא על המשלוח עד פתח הבית." }
            },
            {
              "@type": "Question",
              "name": "האם ניתן לראות את התכשיט לפני הייצור?",
              "acceptedAnswer": { "@type": "Answer", "text": "בהחלט. כל תכשיט עובר תהליך של הדמיית תלת-ממד (3D Rendering) ברזולוציה גבוהה לאישור הלקוח לפני הייצור הפיזי." }
            }
          ]
        })}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-[#FAF8F5]" dir="rtl">
        {/* Hero */}
        <section className="bg-[#F5F0EB] border-b border-[#E8E0D8]">
          <div className="max-w-3xl mx-auto px-6 py-10 md:py-14 text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="text-[#B8976A] uppercase tracking-[0.25em] text-xs font-body mb-2">{brand.brand_name}</p>
              <h1 className="font-heading text-xl md:text-3xl lg:text-4xl text-[#2D2D2D] tracking-wide mb-2 leading-tight">
                {heroTitle}
              </h1>
              {metadata.subtitle && (
                <p className="font-body text-sm md:text-base text-[#6B6B6B] leading-relaxed max-w-2xl mx-auto">
                  {metadata.subtitle as string}
                </p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        {mainContent && (
          <section className="max-w-3xl mx-auto px-6 py-6 md:py-8">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-[#4A4A4A] text-sm md:text-base leading-relaxed font-body text-center"
            >
              {mainContent}
            </motion.p>
          </section>
        )}

        {/* Testimonials — same component as homepage */}
        <SectionSettingsProvider>
          <Testimonials />
        </SectionSettingsProvider>

        {/* WhatsApp CTA */}
        <section className="max-w-3xl mx-auto px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex justify-center"
          >
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-10 py-3.5 rounded-full font-body text-sm tracking-wide text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
              style={{ backgroundColor: "#075E54" }}
            >
              <MessageCircle className="w-4 h-4 opacity-80" />
              <span>שלחו לנו הודעה</span>
            </a>
          </motion.div>
        </section>

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section className="border-t border-[#E8E0D8] bg-[#FAF8F5]">
            <div className="max-w-3xl mx-auto px-6 py-8 md:py-10">
              <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                <h2 className="font-heading text-lg md:text-xl text-[#2D2D2D] tracking-wide mb-4 text-center">שאלות נפוצות</h2>
                <Accordion type="single" collapsible className="space-y-1">
                  {faqItems.map((item, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`} className="border border-[#E8E0D8] rounded-lg px-4 bg-white">
                      <AccordionTrigger className="font-body text-[#2D2D2D] text-sm py-3 text-right hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[#6B6B6B] font-body text-sm leading-relaxed pb-3">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="bg-[#F5F0EB] border-t border-[#E8E0D8]">
          <div className="max-w-3xl mx-auto px-6 py-8 text-center">
            <h2 className="font-heading text-lg md:text-xl text-[#2D2D2D] tracking-wide mb-1">התחילו את המסע שלכם</h2>
            <p className="text-[#6B6B6B] font-body text-sm mb-4">קבעו ייעוץ פרטי עם צוות המעצבים שלנו.</p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 bg-[#2D2D2D] text-white uppercase tracking-[0.1em] text-sm font-body hover:bg-[#1A1A1A] transition-all rounded-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
              <ArrowRight className="w-4 h-4 rotate-180" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default DigitalAtelier;
