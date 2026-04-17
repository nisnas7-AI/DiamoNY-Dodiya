import { useEffect } from "react";
import { SITE_URL } from "@/lib/siteConfig";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";

const defaultContent = `# מדיניות החזרות והחלפות

## מוצרי מדף (Ready-Made)

בהתאם לחוק הגנת הצרכן, התשמ"א-1981, צרכן רשאי לבטל עסקה תוך 14 ימים מיום קבלת המוצר או מיום קבלת המסמך המכיל את פרטי העסקה, לפי המאוחר מביניהם.

### תנאי ההחזרה למוצרי מדף:
- המוצר יוחזר באריזתו המקורית ובמצב תקין
- יש לצרף את החשבונית/קבלה המקורית
- דמי ביטול בסך 5% ממחיר המוצר או 100 ש"ח, הנמוך מביניהם
- ההחזר הכספי יבוצע תוך 14 ימים מקבלת הודעת הביטול

## מוצרים בעיצוב והזמנה אישית (Custom Made)

בהתאם לסעיף 14ג(ד)(4) לחוק הגנת הצרכן, **אין אפשרות לבטל עסקה** של:
- טובין שיוצרו במיוחד בעבור הצרכן על פי מידות או דרישות מיוחדות
- תכשיטים שעוצבו ויוצרו בהתאמה אישית

### הבהרות חשובות:
- תכשיט שעוצב בהתאמה אישית (גודל, סוג זהב, סוג/משקל אבן) נחשב למוצר שיוצר במיוחד
- שינוי גודל טבעת מהמידה הסטנדרטית הופך את המוצר לאישי
- בחירת אבן ספציפית או משקל מותאם הופכים את המוצר לאישי

## אחריות ושירות

אנו מתחייבים לאיכות מוצרינו ומעניקים:
- תעודת אחריות לכל תכשיט
- שירות תיקונים והתאמות במחיר מוזל ללקוחות החברה
- ייעוץ מקצועי לתחזוקת התכשיט

## יצירת קשר

לשאלות בנושא החזרות או החלפות:
- טלפון: 054-6290534
- אימייל: nisnas7@gmail.com
- וואטסאפ: 054-6290534

---
*עודכן לאחרונה: ${new Date().toLocaleDateString('he-IL')}*
`;

const ReturnsPolicy = () => {
  const { data: content, isLoading } = useQuery({
    queryKey: ["site-content", "returns-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "returns-policy")
        .eq("is_active", true)
        .single();
      
      if (error || !data) return null;
      return data;
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pageContent = content?.content || defaultContent;
  const metadata = content?.metadata as { meta_title?: string; meta_description?: string } | null;
  const metaTitle = metadata?.meta_title || "מדיניות החזרות | DiamoNY תכשיטים";
  const metaDescription = metadata?.meta_description || "מדיניות החזרות והחלפות של DiamoNY - מידע על ביטול עסקה, החזרות מוצרים ותכשיטים בעיצוב אישי בהתאם לחוק הגנת הצרכן.";

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/returns-policy`} />
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background" dir="rtl">
        {/* Hero Section */}
        <section className="relative py-16 bg-gradient-to-b from-secondary/50 to-background">
          <div className="container-luxury text-center">
            <span className="text-accent font-light text-sm tracking-[0.3em] uppercase mb-4 block">
              RETURNS POLICY
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-4">
              מדיניות החזרות והחלפות
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              מידע על ביטול עסקה והחזרת מוצרים
            </p>
          </div>
        </section>

        <section className="section-padding">
          <div className="container-luxury">
            <div className="max-w-3xl mx-auto">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <article className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-light prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                  <ReactMarkdown>{pageContent}</ReactMarkdown>
                </article>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ReturnsPolicy;
