import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useBrandSettings } from "@/contexts/BrandSettingsContext";
import { buildBreadcrumbSchema } from "@/lib/seoSchemas";
import LegalPageLayout from "@/components/layout/LegalPageLayout";

const DEFAULT_CONTENT = `
<p>ב<strong>DiamoNY</strong> מאמינים שכל אדם זכאי לשוויון, כבוד, נוחות ועצמאות. אנו מחויבים להנגיש את האתר שלנו לכלל המשתמשים, כולל אנשים עם מוגבלויות.</p>

<h2>הנגשת האתר</h2>
<p>האתר הותאם להנחיות התקן הישראלי (ת"י 5568) לנגישות תכנים באינטרנט ברמת AA, המבוסס על הנחיות WCAG 2.0 בינלאומיות.</p>

<h2>התאמות שבוצעו באתר</h2>
<ul>
  <li><strong>ניווט מקלדת:</strong> אפשרות לניווט מלא באמצעות מקלדת בלבד.</li>
  <li><strong>קוראי מסך:</strong> התאמה לתוכנות הקראת מסך (כגון NVDA, JAWS).</li>
  <li><strong>מבנה ותוכן:</strong> מבנה היררכי ברור, שימוש בכותרות, ותיאור טקסטואלי לתמונות (Alt text).</li>
  <li><strong>תצוגה:</strong> שינוי גודל גופן, ניגודיות צבעים, ותאימות למסכים שונים.</li>
</ul>

<h2>ייצוג רכיב הנגישות</h2>
<p>באתר מותקן רכיב נגישות המאפשר התאמות אישיות (כגון: הגדלת טקסט, ניגודיות גבוהה, עצירת הבהובים).</p>

<h2>פניות ומשוב נגישות</h2>
<p>אנו פועלים לשיפור מתמיד של נגישות האתר. במידה ונתקלתם בקושי לגלוש באתר, נשמח לקבל פניות, הערות והצעות לשיפור.</p>

<p><strong>רכז נגישות:</strong> יעקובי ניצן</p>
<p><strong>טלפון:</strong> 054-6290534</p>
<p><strong>דואר אלקטרוני:</strong> nisnas7@gmail.com</p>
<p><strong>כתובת:</strong> אשקלון</p>

<p><em>הצהרה זו עודכנה בתאריך: 25.1.26</em></p>
`;

const Accessibility = () => {
  const brand = useBrandSettings();

  const { data: content, isLoading } = useQuery({
    queryKey: ["site-content", "accessibility-statement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "accessibility-statement")
        .eq("is_active", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "בית", url: `${brand.site_url}/` },
    { name: "הצהרת נגישות", url: `${brand.site_url}/accessibility` },
  ]);

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      <LegalPageLayout
        metaTitle={`הצהרת נגישות | ${brand.brand_name}`}
        metaDescription={`הצהרת הנגישות של ${brand.brand_name} - מחויבים להנגשת האתר לכלל המשתמשים כולל אנשים עם מוגבלויות.`}
        canonicalUrl={`${brand.site_url}/accessibility`}
        badgeText="נגישות"
        title="הצהרת נגישות"
        subtitle="מחויבות להנגשה מלאה לכלל המשתמשים"
        content={content?.content || DEFAULT_CONTENT}
        isLoading={isLoading}
        emptyMessage="הצהרת הנגישות תעלה בקרוב."
      />
    </>
  );
};

export default Accessibility;
