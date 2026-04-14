import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/siteConfig";
import { SectionSettingsProvider } from "@/contexts/SectionSettingsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Skeleton } from "@/components/ui/skeleton";
import WhoItFitsHero from "@/components/who-it-fits/WhoItFitsHero";
import TargetAudienceFilter from "@/components/who-it-fits/TargetAudienceFilter";
import ProcessTimeline from "@/components/who-it-fits/ProcessTimeline";
import CaseStudySection from "@/components/who-it-fits/CaseStudySection";

const Testimonials = lazy(() => import("@/components/Testimonials"));
const AccessibilityWidget = lazy(() => import("@/components/AccessibilityWidget"));

const SectionSkeleton = () => (
  <div className="py-12 px-6">
    <div className="max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-96 mx-auto" />
    </div>
  </div>
);

const WhoItFits = () => {
  return (
    <>
      <Helmet>
        <title>למי זה מתאים? | עיצוב תכשיטים בהתאמה אישית | DiamoNY</title>
        <meta
          name="description"
          content="גלו אם תהליך עיצוב תכשיטים בהתאמה אישית של DiamoNY מתאים לכם. מהשראה ליצירה — תהליך שקוף תוך 7 ימי עסקים בלבד."
        />
        <link rel="canonical" href={`${SITE_URL}/who-it-fits`} />
      </Helmet>

      <SectionSettingsProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <article dir="rtl">
              <WhoItFitsHero />
              <TargetAudienceFilter />
              <ProcessTimeline />
              <CaseStudySection />
              <Suspense fallback={<SectionSkeleton />}>
                <Testimonials />
              </Suspense>
            </article>

          </main>
          <Footer />
          <WhatsAppButton />
          <Suspense fallback={null}>
            <AccessibilityWidget />
          </Suspense>
        </div>
      </SectionSettingsProvider>
    </>
  );
};

export default WhoItFits;
