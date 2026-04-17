import { useQuery } from "@tanstack/react-query";
import { SITE_URL } from "@/lib/siteConfig";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import GoldBuyingBanner from "@/components/GoldBuyingBanner";
import DesignAppointmentBanner from "@/components/DesignAppointmentBanner";
import { Phone, MessageCircle, Coins, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PageContent {
  title: string | null;
  content: string | null;
  metadata: {
    meta_title?: string;
    meta_description?: string;
    phone?: string;
    image_url?: string;
  } | null;
}

const GoldBuying = () => {
  const { data: pageContent, isLoading } = useQuery({
    queryKey: ["gold-buying-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "gold-buying")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as PageContent | null;
    },
  });

  const phone = pageContent?.metadata?.phone || "054-6290534";
  const imageUrl = pageContent?.metadata?.image_url;
  const metaTitle = pageContent?.metadata?.meta_title || pageContent?.title || "קונה זהב במזומן | DiamoNY";
  const metaDescription = pageContent?.metadata?.meta_description || "קונים זהב במזומן במחירים הוגנים. הערכה מקצועית, תשלום מיידי ודיסקרטיות מלאה.";

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`${SITE_URL}/gold-buying`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="py-8">
          {/* Hero Section - Tight spacing */}
          <section className="bg-gradient-to-br from-amber-50 to-yellow-50 py-8 md:py-10">
            <div className="container-luxury">
              <div className="text-center mb-4">
                <Coins className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                <span className="text-amber-600 font-light text-sm tracking-[0.3em] uppercase mb-1.5 block">
                  GOLD BUYING
                </span>
                <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-0">
                  {pageContent?.title || "קונה זהב במזומן"}
                </h1>
              </div>
              
              {/* Contact Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-5">
                <a
                  href={`tel:${phone.replace(/-/g, "")}`}
                  className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-8 py-4 rounded-full font-bold text-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Phone className="h-6 w-6" />
                  <span>{phone}</span>
                </a>
                <a
                  href={`https://wa.me/972${phone.replace(/-/g, "").substring(1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <MessageCircle className="h-6 w-6" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </section>

          {/* Content Section - Optimized spacing */}
          <section className="py-8 md:py-10">
            <div className="container-luxury">
              <div className="max-w-4xl mx-auto">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2">
                      <article className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-h2:text-amber-600 prose-h3:text-amber-500">
                        <ReactMarkdown>{pageContent?.content || ""}</ReactMarkdown>
                      </article>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {imageUrl && (
                        <div className="rounded-xl overflow-hidden shadow-lg">
                          <img
                            src={imageUrl}
                            alt="קונה זהב"
                            className="w-full h-auto"
                          />
                        </div>
                      )}

                      {/* Contact Card */}
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 shadow-lg">
                        <h3 className="font-heading text-xl font-light text-amber-600 mb-4">
                          צרו קשר עכשיו
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          מעוניינים למכור זהב? התקשרו אלינו או שלחו הודעה בוואטסאפ ונחזור אליכם בהקדם.
                        </p>
                        <div className="space-y-3">
                          <a
                            href={`tel:${phone.replace(/-/g, "")}`}
                            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                          >
                            <Phone className="h-5 w-5" />
                            <span>{phone}</span>
                          </a>
                          <a
                            href={`https://wa.me/972${phone.replace(/-/g, "").substring(1)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                          >
                            <MessageCircle className="h-5 w-5" />
                            <span>שלח הודעה בוואטסאפ</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

export default GoldBuying;
