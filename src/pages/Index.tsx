import { lazy, Suspense } from "react";
import { SITE_URL } from "@/lib/siteConfig";
import { SectionSettingsProvider } from "@/contexts/SectionSettingsContext";
import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";
import Hero from "@/components/Hero";
import TrustIndicators from "@/components/TrustIndicators";
import Categories from "@/components/Categories";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Helmet } from "react-helmet-async";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load below-fold sections for faster initial render
const CustomProcess = lazy(() => import("@/components/CustomProcess"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const FeaturedProducts = lazy(() => import("@/components/FeaturedProducts"));
const FeaturedSaleProducts = lazy(() => import("@/components/FeaturedSaleProducts"));
const About = lazy(() => import("@/components/About"));
const RelatedArticles = lazy(() => import("@/components/RelatedArticles"));
const InstagramFeed = lazy(() => import("@/components/InstagramFeed"));
const YouTubeSection = lazy(() => import("@/components/YouTubeSection"));
const GoldBuyingBanner = lazy(() => import("@/components/GoldBuyingBanner"));
const DesignAppointmentBanner = lazy(() => import("@/components/DesignAppointmentBanner"));
const AccessibilityWidget = lazy(() => import("@/components/AccessibilityWidget"));
const CookieConsentBanner = lazy(() => import("@/components/CookieConsentBanner"));

const SectionSkeleton = () => (
  <div className="py-12 px-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-96 mx-auto" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

const Index = () => {
  return (
    <>
      <Helmet>
        <title>DiamoNY | צורפות עילית ויהלומים בהתאמה אישית</title>
        <meta
          name="description"
          content="סטודיו DiamoNY מתמחה בצורפות עילית בעיצוב אישי. טבעות אירוסין, תכשיטי יהלומים וזהב 14K/18K בעבודת יד בסטנדרט פרימיום עם תעודות גמולוגיות וליווי אישי."
        />
        <meta
          name="keywords"
          content="תכשיטים, יהלומים, זהב, טבעות אירוסין, עיצוב תכשיטים, צורפות, DiamoNY"
        />
        <link rel="canonical" href={SITE_URL} />
      </Helmet>

      <SectionSettingsProvider>
        <div className="min-h-screen">
          <PromoBanner />
          <Header />
          <main>
            <Hero />
            <TrustIndicators />
            <Categories />
            <Suspense fallback={<SectionSkeleton />}>
              <CustomProcess />
              <Testimonials />
              {/* Temporarily hidden due to production image rendering issues */}
              {/* <FeaturedProducts /> */}
              {/* <FeaturedSaleProducts /> */}
              <About />
              <YouTubeSection />
              <RelatedArticles />
              <InstagramFeed />
            </Suspense>
          </main>
          <Footer />
          <WhatsAppButton />
          <Suspense fallback={null}>
            <GoldBuyingBanner />
            <DesignAppointmentBanner />
            <AccessibilityWidget />
            <CookieConsentBanner />
          </Suspense>
        </div>
      </SectionSettingsProvider>
    </>
  );
};

export default Index;
