import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import designerPortrait from "@/assets/designer-portrait.jpg";
import ReactMarkdown from "react-markdown";

interface AboutContent {
  title: string | null;
  content: string | null;
  metadata: {
    image_url?: string;
    layout?: "classic" | "editorial";
  } | null;
}

const About = () => {
  const { data: aboutContent } = useQuery({
    queryKey: ["about-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "about")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as AboutContent | null;
    },
  });

  // Default content if not set in database
  const title = aboutContent?.title || "נעים להכיר";
  const content = aboutContent?.content || `כצורף ומעצב, אני מאמין שתכשיט הוא יותר מסתם אביזר – הוא סיפור, רגש, זיכרון שנשמר לנצח.

כל יצירה שיוצאת מהסטודיו שלי עוברת תהליך קפדני של תכנון, עיצוב וייצור ידני. אני מקפיד על שימוש בחומרי גלם באיכות הגבוהה ביותר – זהב תקני, יהלומים מוסמכים ואבני חן מובחרות.

המטרה שלי היא ליצור תכשיטים שמשקפים את האישיות והסגנון הייחודי של כל לקוח, תוך שמירה על סטנדרטים בינלאומיים של צורפות.`;
  const imageUrl = aboutContent?.metadata?.image_url || designerPortrait;
  const layout = aboutContent?.metadata?.layout || "editorial";

  // Editorial Overlap Layout - Recommended
  if (layout === "editorial") {
    return (
      <section id="about-jeweler-sectioner-section" className="py-10 md:py-14 lg:py-20 bg-background overflow-hidden">
        <div className="container-luxury">
          <div className="relative">
            {/* Large Image - Takes up significant space */}
            <div className="relative w-full lg:w-[65%]">
              <div className="aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] overflow-hidden">
                <img
                  src={imageUrl}
                  alt="הצורף והמעצב"
                  width={800}
                  height={1000}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Floating Text Card - Overlaps the image */}
            <div 
              className="relative lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2 lg:w-[50%] bg-background p-6 md:p-8 lg:p-10 mt-[-40px] mx-4 lg:mx-0 lg:mt-0"
              style={{ 
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
              }}
            >
              <span className="text-accent font-light text-xs tracking-[0.25em] uppercase mb-4 block">
                ABOUT US
              </span>
              
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light mb-5 leading-tight">
                {title}
              </h2>
              
              {/* Content broken into digestible chunks */}
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-headings:font-light prose-headings:text-xl prose-headings:mt-6 prose-headings:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </div>

              {/* Signature with Logo */}
              <div className="mt-6 pt-6 border-t border-border">
                <img
                  src="/lovable-uploads/083379c4-874c-46e2-949d-4b7023e62bc4.png"
                  alt="DiamoNY"
                  width={120}
                  height={48}
                  className="h-10 md:h-12 w-auto"
                  loading="lazy"
                  style={{ 
                    filter: 'sepia(1) saturate(3) hue-rotate(10deg) brightness(0.85)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Classic Split Layout
  return (
    <section id="about-jeweler-section" className="py-10 md:py-14 lg:py-20 bg-secondary">
      <div className="container-luxury">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={imageUrl}
                alt="הצורף והמעצב"
                width={800}
                height={1067}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Decorative Element */}
            <div className="absolute -bottom-6 -left-6 w-40 h-40 border-2 border-accent/20 -z-10" />
          </div>

          {/* Content */}
          <div className="lg:pl-6">
            <span className="text-accent font-light text-xs tracking-[0.25em] uppercase mb-4 block">
              ABOUT US
            </span>
            
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light mb-5 leading-tight">
              {title}
            </h2>
            
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-headings:font-light prose-headings:text-xl prose-headings:mt-6 prose-headings:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>

            {/* Signature with Logo */}
            <div className="mt-6 pt-6 border-t border-border">
              <img
                src="/lovable-uploads/083379c4-874c-46e2-949d-4b7023e62bc4.png"
                alt="DiamoNY"
                width={120}
                height={48}
                className="h-10 md:h-12 w-auto"
                loading="lazy"
                style={{ 
                  filter: 'sepia(1) saturate(3) hue-rotate(10deg) brightness(0.85)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;