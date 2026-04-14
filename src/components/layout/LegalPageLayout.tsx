import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/sanitize";

interface LegalPageLayoutProps {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  badgeText: string;
  title: string;
  subtitle: string;
  content: string | null | undefined;
  isLoading: boolean;
  emptyMessage: string;
}

const LegalPageLayout = ({
  metaTitle,
  metaDescription,
  canonicalUrl,
  badgeText,
  title,
  subtitle,
  content,
  isLoading,
  emptyMessage,
}: LegalPageLayoutProps) => {
  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content="index, follow" />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background" dir="rtl">
        <section className="relative py-4 bg-gradient-to-b from-secondary/50 to-background">
          <div className="container-luxury text-center">
            <span className="text-accent font-light text-sm tracking-[0.3em] uppercase mb-2 block">
              {badgeText}
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-2">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>
        </section>

        <section className="pt-2 pb-8 md:pt-3 md:pb-12">
          <div className="container-luxury max-w-4xl">
            <div className="card-luxury pt-4 px-8 pb-8 md:pt-6 md:px-12 md:pb-12">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-8 w-2/3 mt-6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : content ? (
                <div
                  className="blog-prose prose prose-lg max-w-none text-foreground prose-p:first-of-type:mt-0 prose-headings:first-of-type:mt-0"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                />
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  {emptyMessage}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default LegalPageLayout;
