import { useState, useEffect } from "react";
import { SITE_URL } from "@/lib/siteConfig";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import diamonyIcon from "@/assets/diamony-brand-icon.png";
import { trackPageSource } from "@/lib/analyticsTracker";
import { buildLocalBusinessSchema } from "@/lib/seoSchemas";

interface NfcCard {
  id: string;
  title: string;
  image_url: string | null;
  category_id: string | null;
  custom_link: string | null;
  section: string;
  display_order: number;
  short_text: string | null;
  long_text: string | null;
  show_title: boolean;
  show_short_text: boolean;
  show_long_text: boolean;
  categories?: { slug: string } | null;
}

const NfcCatalog = () => {
  const [cards, setCards] = useState<NfcCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [categoryFallbacks, setCategoryFallbacks] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => { trackPageSource(); }, []);

  useEffect(() => {
    const fetchCards = async () => {
      const { data } = await supabase
        .from("nfc_catalog_cards")
        .select("*, categories(slug)")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      const cardsData = (data as any[]) || [];
      setCards(cardsData);

      const categoryIds = cardsData.filter(c => !c.image_url && c.category_id).map(c => c.category_id as string);
      if (categoryIds.length > 0) {
        const uniqueIds = [...new Set(categoryIds)];
        const fallbacks: Record<string, string> = {};
        await Promise.all(
          uniqueIds.map(async (catId) => {
            const { data: products } = await supabase
              .from("products")
              .select("main_image_url")
              .eq("category_id", catId)
              .eq("is_active", true)
              .not("main_image_url", "is", null)
              .order("display_order", { ascending: true })
              .limit(1);
            if (products?.[0]?.main_image_url) fallbacks[catId] = products[0].main_image_url;
          })
        );
        setCategoryFallbacks(fallbacks);
      }
      setLoading(false);
    };
    fetchCards();
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const womenCards = cards.filter((c) => c.section === "women");
  const menCards = cards.filter((c) => c.section === "men");

  const getCardLink = (card: NfcCard) => {
    if (card.custom_link) return card.custom_link;
    const slug = card.categories?.slug;
    if (slug) return `/nfc-catalog/${slug}`;
    return `/nfc-catalog/${encodeURIComponent(card.title)}`;
  };

  const jsonLd = {
    ...buildLocalBusinessSchema(),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "קטלוג תכשיטים",
      itemListElement: cards.map((card, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: card.title,
        url: `${SITE_URL}${getCardLink(card)}`,
      })),
    },
  };

  const SkeletonGrid = ({ count }: { count: number }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-2xl bg-muted" />
      ))}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>קטלוג תכשיטים | DiamoNY – תכשיטי יוקרה בעיצוב אישי</title>
        <meta name="description" content="קטלוג תכשיטי DiamoNY – טבעות יהלום, עגילים, צמידים ותליונים בעיצוב אישי. תכשיטי נשים וגברים בהתאמה אישית." />
        <meta name="geo.region" content="IL" />
        <meta name="geo.placename" content="Ashkelon" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background font-body" dir="rtl">
        {/* Header */}
        <header className="flex flex-col items-center pt-10 pb-6 px-4">
          <img src={diamonyIcon} alt="DiamoNY Logo" className="w-20 h-20 mb-5 rounded-full shadow-md" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-foreground">
            קטלוג תכשיטי נשים
          </h1>
          <p className="text-sm text-muted-foreground mt-1 tracking-wider">DiamoNY – עיצוב אישי</p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:bg-primary/90 transition-colors duration-300 text-xs font-medium tracking-wide"
          >
            <span>מעבר לדף הבית</span>
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </header>

        {/* PWA Install */}
        {deferredPrompt && (
          <div className="px-4 pb-6 max-w-md mx-auto">
            <Button onClick={handleInstall} className="w-full bg-gold-warm hover:bg-gold-warm-hover text-primary-foreground font-bold rounded-xl py-3 text-base shadow-sm">
              <Smartphone className="w-5 h-5 ml-2" />
              שמור קטלוג לנייד
            </Button>
          </div>
        )}

        {/* Women's Grid */}
        <section className="px-4 md:px-8 lg:px-12 pb-10 max-w-6xl mx-auto">
          {loading ? <SkeletonGrid count={8} /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {womenCards.map((card) => (
                <NfcCatalogCard key={card.id} card={card} link={getCardLink(card)} categoryFallbacks={categoryFallbacks} />
              ))}
            </div>
          )}
        </section>

        {/* Men's Title */}
        <header className="flex flex-col items-center pt-6 pb-6 px-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-wide text-foreground">
            קטלוג תכשיטי גברים
          </h2>
        </header>

        {/* Men's Grid */}
        <section className="px-4 md:px-8 lg:px-12 pb-16 max-w-6xl mx-auto">
          {loading ? <SkeletonGrid count={4} /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {menCards.map((card) => (
                <NfcCatalogCard key={card.id} card={card} link={getCardLink(card)} categoryFallbacks={categoryFallbacks} />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-xs text-muted-foreground">
          © DiamoNY {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
};

const NfcCatalogCard = ({ card, link, categoryFallbacks }: { card: NfcCard; link: string; categoryFallbacks: Record<string, string> }) => {
  const imageUrl = card.image_url || (card.category_id ? categoryFallbacks[card.category_id] : null);

  return (
    <Link to={link} className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md group block transition-shadow duration-300 hover:shadow-xl">
      {imageUrl ? (
        <img src={imageUrl} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {card.show_title && <h3 className="text-white text-sm md:text-base font-bold leading-tight mb-1">{card.title}</h3>}
        {card.show_short_text && card.short_text && <p className="text-white/80 text-xs leading-snug mb-1">{card.short_text}</p>}
        <span className="text-gold-warm text-xs font-medium">גלה עוד ←</span>
      </div>
    </Link>
  );
};

export default NfcCatalog;
