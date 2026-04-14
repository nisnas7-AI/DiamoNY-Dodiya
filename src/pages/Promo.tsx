import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import GoldBuyingBanner from "@/components/GoldBuyingBanner";
import DesignAppointmentBanner from "@/components/DesignAppointmentBanner";
import { Button } from "@/components/ui/button";
import { ArrowRight, Tag, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  banner_image_url: string | null;
  banner_text: string | null;
  banner_gradient: string | null;
  banner_text_color: string;
  discount_code: string | null;
  discount_percent: number | null;
  start_date: string | null;
  end_date: string | null;
  cta_text: string;
  cta_url: string | null;
}

const Promo = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: promo, isLoading, error } = useQuery({
    queryKey: ["promo", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data as Promotion | null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!promo || error) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-heading mb-4">המבצע לא נמצא</h1>
          <p className="text-muted-foreground mb-6">
            ייתכן שהמבצע הסתיים או שהכתובת שגויה
          </p>
          <Link to="/">
            <Button>
              <ArrowRight className="h-4 w-4 ml-2" />
              חזרה לעמוד הבית
            </Button>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{promo.title} | DiamoNY מבצעים</title>
        <meta name="description" content={promo.description || promo.title} />
      </Helmet>

      <div className="min-h-screen">
        <Header />
        
        <main>
          {/* Hero Banner */}
          <div 
            className="relative h-64 md:h-96 overflow-hidden"
            style={{ 
              background: promo.banner_gradient && !promo.banner_image_url 
                ? promo.banner_gradient 
                : undefined 
            }}
          >
            {promo.banner_image_url ? (
              <>
                <img
                  src={promo.banner_image_url}
                  alt={promo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
              </>
            ) : !promo.banner_gradient ? (
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
            ) : null}
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <h1 
                  className="text-3xl md:text-5xl font-heading font-bold mb-4"
                  style={{ 
                    color: promo.banner_text_color || "#FFFFFF",
                    textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  {promo.banner_text || promo.title}
                </h1>
                {promo.description && (
                  <p 
                    className="text-lg md:text-xl max-w-2xl mx-auto"
                    style={{ 
                      color: promo.banner_text_color || "#FFFFFF",
                      textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    {promo.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <section className="section-padding">
            <div className="container-luxury max-w-3xl">
              {/* Discount Code Box */}
              {promo.discount_code && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-6 mb-8 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Tag className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">קוד הנחה</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-mono font-bold text-foreground tracking-wider">
                    {promo.discount_code}
                  </div>
                  {promo.discount_percent && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {promo.discount_percent}% הנחה
                    </p>
                  )}
                </div>
              )}

              {/* Dates */}
              {(promo.start_date || promo.end_date) && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {promo.start_date && format(new Date(promo.start_date), "dd בMMMM yyyy", { locale: he })}
                    {promo.start_date && promo.end_date && " - "}
                    {promo.end_date && format(new Date(promo.end_date), "dd בMMMM yyyy", { locale: he })}
                  </span>
                </div>
              )}

              {/* Main Content */}
              {promo.content && (
                <div className="prose prose-lg max-w-none mb-8">
                  <ReactMarkdown>{promo.content}</ReactMarkdown>
                </div>
              )}

              {/* CTA */}
              <div className="text-center">
                <Link to={promo.cta_url || "/catalog"}>
                  <Button size="lg" className="btn-gold">
                    {promo.cta_text}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
        <WhatsAppButton />
        <GoldBuyingBanner />
        <DesignAppointmentBanner />
      </div>
    </>
  );
};

export default Promo;
