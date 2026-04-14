import { Star, ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import { SITE_URL } from "@/lib/siteConfig";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSectionSettings, getSectionStyle, getSectionClasses, SectionSetting } from "@/hooks/useSectionSettings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Helmet } from "react-helmet-async";

interface Testimonial {
  id: string;
  customer_name: string;
  jewelry_item_name: string | null;
  product_link: string | null;
  content: string;
  rating: number | null;
  image_url: string | null;
  product_image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  published_at: string | null;
  google_review_url: string | null;
  seo_keywords: string[] | null;
}

// Product Image Floating Lightbox Component — small window, not full-screen
const ProductImageLightbox = ({
  imageUrl,
  altText,
  isOpen,
  onClose,
}: {
  imageUrl: string;
  altText: string;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Subtle backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-[8px]"
          onClick={onClose}
        />
        {/* Floating window — compact, not full-screen */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-8 pointer-events-none"
        >
          <div
            className="relative max-w-sm w-full pointer-events-auto bg-white rounded-xl border border-border/40 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 shadow-sm border border-border/30 text-foreground/60 hover:text-foreground hover:bg-white transition-all duration-200"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            {/* Image */}
            <img
              src={imageUrl}
              alt={altText}
              className="w-full max-h-[60vh] object-contain"
              loading="lazy"
            />
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// Google "G" Icon Component
const GoogleIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Global Google Rating Badge
const GOOGLE_BUSINESS_URL = "https://g.page/r/your-google-business-id/review"; // Replace with actual URL

// Format date to Hebrew month and year using native Intl API
const formatHebrewDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(date);
  } catch {
    return "";
  }
};

// Testimonial Modal Component
const TestimonialModal = ({
  testimonials,
  currentIndex,
  isOpen,
  onClose,
  onPrev,
  onNext,
}: {
  testimonials: Testimonial[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) => {
  const testimonial = testimonials[currentIndex];
  if (!testimonial) return null;

  const productLink = testimonial.product_link || "/catalog";
  const hasGoogleReview = !!testimonial.google_review_url;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[12px]"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.16, 1, 0.3, 1] // cubic-bezier ease-out-expo
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] max-w-lg w-full p-8 md:p-10 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {/* Navigation Arrows */}
              <button
                onClick={onPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#856404] hover:text-[#6B5003] hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(133,100,4,0.6)] transition-all duration-300"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6" strokeWidth={1.25} />
              </button>
              <button
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#856404] hover:text-[#6B5003] hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(133,100,4,0.6)] transition-all duration-300"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6" strokeWidth={1.25} />
              </button>

              {/* Modal Content with slide animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="text-center px-6"
                >
                  {/* Stars */}
                  <div className="flex justify-center gap-1.5 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < (testimonial.rating || 5)
                            ? "fill-gold text-gold"
                            : "fill-gray-200 text-gray-200"
                        }`}
                        strokeWidth={1}
                      />
                    ))}
                  </div>

                  {/* Full Quote */}
                  <blockquote className="relative font-heading text-foreground/85 leading-relaxed text-base md:text-lg mb-8">
                    <span className="absolute -top-4 right-0 text-5xl text-primary/15 font-serif leading-none select-none">"</span>
                    <p className="px-4 italic">{testimonial.content}</p>
                    <span className="absolute -bottom-4 left-0 text-5xl text-primary/15 font-serif leading-none select-none rotate-180">"</span>
                  </blockquote>

                  {/* User Info */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <p className="font-heading font-semibold text-foreground text-base">
                        {testimonial.customer_name}
                      </p>
                      {hasGoogleReview && (
                        <GoogleIcon className="w-4 h-4" />
                      )}
                    </div>
                    {(testimonial.published_at || testimonial.created_at) && (
                      <p className="text-xs text-muted-foreground/50 mt-1">
                        {formatHebrewDate(testimonial.published_at || testimonial.created_at)}
                      </p>
                    )}
                    {testimonial.jewelry_item_name && (
                      <p className="text-sm text-muted-foreground/70 mt-2">
                        {testimonial.jewelry_item_name}
                      </p>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                    <Link to={productLink} onClick={onClose}>
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5 text-sm tracking-wider uppercase font-body transition-all duration-300"
                      >
                        צפייה בתכשיט
                      </Button>
                    </Link>
                    {hasGoogleReview && (
                      <a 
                        href={testimonial.google_review_url!} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-300"
                      >
                        <GoogleIcon className="w-4 h-4" />
                        <span>View on Google</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Pagination indicator */}
                  <p className="text-xs text-muted-foreground/40 mt-6">
                    {currentIndex + 1} / {testimonials.length}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Testimonial Card Component - Equal height with fixed structure
const TestimonialCard = ({ 
  testimonial, 
  isCarousel = false,
  onReadMore 
}: { 
  testimonial: Testimonial; 
  isCarousel?: boolean;
  onReadMore?: () => void;
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const productLink = testimonial.product_link || "/catalog";
  const hasProductLink = !!testimonial.product_link;
  const hasGoogleReview = !!testimonial.google_review_url;
  const hasProductImage = !!testimonial.product_image_url;
  
  // Check if text is likely to be truncated (rough estimate: > 120 chars)
  const isLongContent = testimonial.content.length > 120;
  
  // Clickable image/name wrapper
  const ProductLinkWrapper = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    if (hasProductLink) {
      return (
        <Link to={productLink} className={`cursor-pointer ${className}`}>
          {children}
        </Link>
      );
    }
    return <div className={className}>{children}</div>;
  };

  // The circular image - either opens lightbox (if product_image_url) or links to product
  const handleCircleClick = (e: React.MouseEvent) => {
    if (hasProductImage) {
      e.preventDefault();
      e.stopPropagation();
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <div className={`group h-full flex flex-col bg-white rounded-xl p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-500 ${isCarousel ? 'mx-2' : ''}`}>
        {/* Card Header: 5 Gold Stars - Centered */}
        <div className="flex justify-center gap-1.5 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 md:w-5 md:h-5 ${
                i < (testimonial.rating || 5)
                  ? "fill-gold text-gold"
                  : "fill-gray-200 text-gray-200"
              }`}
              strokeWidth={1}
            />
          ))}
        </div>
        
        {/* Card Body: Quote with stylized quotation marks and line clamp */}
        <div className="flex-1 mb-3.5">
          <blockquote className="relative font-heading text-foreground/85 text-center leading-relaxed text-sm md:text-base">
            {/* Opening Quote Mark */}
            <span className="absolute -top-2 right-0 text-4xl md:text-5xl text-primary/15 font-serif leading-none select-none">"</span>
            
            {/* Quote Text - Fixed 4 lines with ellipsis */}
            <p className="px-4 line-clamp-4 italic">
              {testimonial.content}
            </p>
            
            {/* Closing Quote Mark */}
            <span className="absolute -bottom-4 left-0 text-4xl md:text-5xl text-primary/15 font-serif leading-none select-none rotate-180">"</span>
          </blockquote>
          
          {/* Read More Trigger */}
          {isLongContent && onReadMore && (
            <button
              onClick={onReadMore}
              className="block mx-auto mt-3 text-xs text-[#C5A059] hover:text-[#B8860B] font-body tracking-wide transition-colors duration-300 cursor-pointer"
            >
              קרא עוד...
            </button>
          )}
        </div>
        
        {/* Card Footer: User Details - Pushed to bottom with RTL layout */}
        <div className="mt-auto pt-3.5 border-t border-gray-100">
          <div className="flex items-center justify-end gap-3 md:gap-4" dir="rtl">
            {/* Right Side (RTL): User Info */}
            <div className="text-right flex-1">
              <div className="flex items-center justify-end gap-1.5">
                <p className="font-heading font-semibold text-foreground text-sm md:text-base">
                  {testimonial.customer_name}
                </p>
                {hasGoogleReview && (
                  <a 
                    href={testimonial.google_review_url!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group/google flex items-center"
                    title="Verified Google Review"
                  >
                    <GoogleIcon className="w-3.5 h-3.5 opacity-80 group-hover/google:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
              {/* Date - Lighter gray */}
              {(testimonial.published_at || testimonial.created_at) && (
                <p className="text-[10px] md:text-xs text-muted-foreground/40 mt-0.5">
                  {formatHebrewDate(testimonial.published_at || testimonial.created_at)}
                </p>
              )}
              {/* Product Name */}
              {testimonial.jewelry_item_name && (
                <ProductLinkWrapper className="block">
                  <p className={`text-xs text-muted-foreground/60 mt-1 transition-colors duration-300 ${hasProductLink ? 'hover:text-primary cursor-pointer' : ''}`}>
                    {testimonial.jewelry_item_name}
                  </p>
                </ProductLinkWrapper>
              )}
            </div>
            
            {/* Left Side (RTL): Product Image Circle or Fallback Star */}
            <div className="flex-shrink-0" onClick={handleCircleClick}>
              {testimonial.product_image_url ? (
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-primary/10 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-primary/30 ${hasProductImage ? 'cursor-zoom-in' : ''}`}>
                  <img
                    src={testimonial.product_image_url}
                    alt={testimonial.jewelry_item_name || "Jewelry"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={56}
                    height={56}
                  />
                </div>
              ) : testimonial.image_url ? (
                <ProductLinkWrapper>
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-primary/10 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-primary/30">
                    <img
                      src={testimonial.image_url}
                      alt={testimonial.jewelry_item_name || "Jewelry"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width={56}
                      height={56}
                    />
                  </div>
                </ProductLinkWrapper>
              ) : (
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary/5 to-primary/15 border border-primary/10 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-md">
                  <Star className="w-5 h-5 text-primary/40" strokeWidth={1.5} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Image Lightbox */}
      {hasProductImage && (
        <ProductImageLightbox
          imageUrl={testimonial.product_image_url!}
          altText={testimonial.jewelry_item_name || testimonial.customer_name}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};
const Testimonials = () => {
  const { data: settings } = useSectionSettings("testimonials");
  const isMobile = useIsMobile();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  
  // Autoplay plugin with 6 second delay, stops on interaction
  const autoplayPlugin = useRef(
    Autoplay({ 
      delay: 6000, 
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: isMobile ? 'center' : 'start',
    direction: 'rtl',
    slidesToScroll: 1,
    dragFree: false,
  }, [autoplayPlugin.current]);
  
  const { data: testimonials = [] } = useQuery({
    queryKey: ["site-reviews-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_reviews")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true });
      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        id: r.id,
        customer_name: r.reviewer_name,
        jewelry_item_name: r.jewelry_item_name ?? null,
        product_link: r.product_link ?? null,
        content: r.review_text,
        rating: r.star_rating,
        image_url: r.image_url ?? null,
        product_image_url: r.product_image_url ?? null,
        is_active: r.is_active,
        is_featured: r.is_featured ?? false,
        display_order: r.display_order ?? 0,
        created_at: r.created_at,
        published_at: r.display_date || r.created_at,
        google_review_url: r.google_review_url ?? null,
        seo_keywords: r.seo_keywords ?? [],
      })) as Testimonial[];
    },
  });

  const settingsTyped = settings as SectionSetting | null;
  const sectionStyle = getSectionStyle(settingsTyped);
  const sectionClasses = getSectionClasses(settingsTyped);

  // Carousel navigation with autoplay pause
  const scrollPrev = useCallback(() => {
    autoplayPlugin.current.stop();
    emblaApi?.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    autoplayPlugin.current.stop();
    emblaApi?.scrollNext();
  }, [emblaApi]);
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Handle hover to pause autoplay
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    autoplayPlugin.current.stop();
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    autoplayPlugin.current.play();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  // Calculate aggregate rating for Schema.org
  const averageRating = testimonials.length > 0 
    ? (testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / testimonials.length).toFixed(1)
    : "5.0";
  const reviewCount = testimonials.length;

  // Collect all SEO keywords from testimonials for AEO
  const allSeoKeywords = testimonials
    .flatMap(t => t.seo_keywords || [])
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  // Schema.org markup for reviews with enhanced itemReviewed
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    "@id": `${SITE_URL}/#organization`,
    "name": "DiamoNY",
    "description": "צורפות עילית בעיצוב אישי - תכשיטי יהלומים וזהב באשקלון",
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon.png`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ashkelon",
      "addressCountry": "IL"
    },
    "priceRange": "₪₪₪",
    ...(allSeoKeywords.length > 0 && { "keywords": allSeoKeywords.join(", ") }),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating,
      "reviewCount": reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": testimonials.map(t => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": t.customer_name
      },
      "datePublished": t.published_at || t.created_at,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": t.rating || 5,
        "bestRating": "5",
        "worstRating": "1"
      },
      "reviewBody": t.content,
      ...(t.jewelry_item_name && {
        "itemReviewed": {
          "@type": "Product",
          "name": t.jewelry_item_name,
          "brand": {
            "@type": "Brand",
            "name": "DiamoNY"
          }
        }
      }),
      ...(t.seo_keywords && t.seo_keywords.length > 0 && {
        "keywords": t.seo_keywords.join(", ")
      })
    }))
  };

  return (
    <>
      {/* Schema.org Review Markup */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>

      <section 
        className={`px-4 md:px-8 bg-background overflow-hidden ${sectionClasses}`}
        style={sectionStyle}
      >
        <div className="container-luxury">
          {/* Header with fade-in-up - Tight spacing */}
          <motion.div 
            className="text-center mb-6 md:mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={headerVariants}
          >
            <span className="text-muted-foreground/60 font-body text-xs tracking-[0.35em] uppercase mb-3 md:mb-4 block">
              לקוחות מספרים
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-4 tracking-wide">
              {settingsTyped?.title || "חוויות אמיתיות"}
            </h2>
            <div className="w-12 h-px bg-primary/30 mx-auto mb-4" />
            
            {/* Global Google Rating Badge */}
            <a 
              href={GOOGLE_BUSINESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition-all duration-300 group"
            >
              <GoogleIcon className="w-5 h-5" />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-[#FBBC05] text-[#FBBC05]"
                    strokeWidth={0}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{averageRating}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </motion.div>

          {/* Horizontal Carousel with Navigation Arrows */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Left Arrow - Premium Accessible Gold */}
            <button
              onClick={scrollPrev}
              className="absolute -left-2 md:-left-6 lg:-left-14 top-1/2 -translate-y-1/2 z-10 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center text-[#856404] transition-all duration-300 ease-in-out hover:text-[#6B5003] hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(133,100,4,0.6)] cursor-pointer"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-7 h-7 md:w-8 md:h-8" strokeWidth={1.25} />
            </button>

            {/* Right Arrow - Premium Accessible Gold */}
            <button
              onClick={scrollNext}
              className="absolute -right-2 md:-right-6 lg:-right-14 top-1/2 -translate-y-1/2 z-10 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center text-[#856404] transition-all duration-300 ease-in-out hover:text-[#6B5003] hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(133,100,4,0.6)] cursor-pointer"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-7 h-7 md:w-8 md:h-8" strokeWidth={1.25} />
            </button>

            {/* Carousel Container - Grid-aligned equal heights */}
            <div className="overflow-hidden md:mx-8 lg:mx-16" ref={emblaRef}>
              <div className="flex touch-pan-y items-stretch">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={testimonial.id} 
                    className={`flex-shrink-0 min-w-0 px-2 md:px-3 ${
                      isMobile 
                        ? 'flex-[0_0_85%]' // Mobile: 85% width for peek effect
                        : 'flex-[0_0_33.333%]' // Desktop: 3 cards visible
                    }`}
                  >
                    <TestimonialCard 
                      testimonial={testimonial} 
                      isCarousel 
                      onReadMore={() => {
                        setModalIndex(index);
                        setModalOpen(true);
                        autoplayPlugin.current.stop();
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Dots Indicator - Always visible, more prominent on mobile */}
            <div className="flex justify-center gap-2 mt-6 md:mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    autoplayPlugin.current.stop();
                    emblaApi?.scrollTo(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === selectedIndex 
                      ? 'bg-[#C9A962] w-6' 
                      : 'bg-gray-300 hover:bg-gray-400 w-2'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div 
            className="text-center mt-10 md:mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/catalog">
              <Button 
                variant="outline" 
                className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground px-6 md:px-8 py-5 md:py-6 text-xs md:text-sm tracking-wider uppercase font-body transition-all duration-300"
              >
                לכל הקולקציות
              </Button>
            </Link>
          </motion.div>

          {/* Testimonial Modal */}
          <TestimonialModal
            testimonials={testimonials}
            currentIndex={modalIndex}
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onPrev={() => setModalIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            onNext={() => setModalIndex((prev) => (prev + 1) % testimonials.length)}
          />
        </div>
      </section>
    </>
  );
};

export default Testimonials;
