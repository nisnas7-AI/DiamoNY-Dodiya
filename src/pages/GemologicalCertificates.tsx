import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Award, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "האם חייבים תעודה גמולוגית לכל יהלום?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "עבור יהלומים מרכזיים (בדרך כלל מעל 0.30 קראט), תעודה היא חובה והבטוחה היחידה לאיכות האבן. ביהלומים קטנים מאוד (יהלומי צד), נהוג להשתמש בדירוג מסחרי כולל."
    }
  }, {
    "@type": "Question",
    "name": "מה ההבדל בין יהלום טבעי ליהלום מעבדה בתעודה הגמולוגית?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "התעודה מציינת במפורש את המקור: Natural Diamond או Laboratory Grown Diamond. הפרמטרים לבדיקת האיכות (4Cs) זהים לחלוטין בשני המקרים."
    }
  }, {
    "@type": "Question",
    "name": "איזה מכון גמולוגי נחשב לאמין ביותר?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "מכון GIA נחשב לסטנדרט המחמיר והמוביל בעולם ליהלומי השקעה. גם מכון IGI מציג אמינות גבוהה מאוד, במיוחד ביהלומי מעבדה ותכשיטי יוקרה."
    }
  }]
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "המדריך המלא לתעודות גמולוגיות – GIA, IGI וכל מה שצריך לדעת",
  "description": "מדריך מקיף להבנת תעודות גמולוגיות ליהלומים. למדו על GIA, IGI, ארבעת ה-Cs ואיך לבחור יהלום בביטחון מלא.",
  "author": { "@type": "Organization", "name": "DiamoNY" },
  "publisher": { "@type": "Organization", "name": "DiamoNY" },
  "mainEntityOfPage": { "@type": "WebPage" },
  "inLanguage": "he"
};

const GemologicalCertificates = () => {
  return (
    <>
      <Helmet>
        <title>המדריך המלא לתעודות גמולוגיות – GIA, IGI | DiamoNY</title>
        <meta name="description" content="מדריך מקיף להבנת תעודות גמולוגיות ליהלומים. למדו על GIA, IGI, ארבעת ה-Cs ואיך לבחור יהלום בביטחון מלא." />
        <link rel="canonical" href="/knowledge/gemological-certificates" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background" dir="rtl">
        {/* Hero */}
        <section className="bg-card border-b border-border/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20">
            {/* Breadcrumbs */}
            <nav className="mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-accent transition-colors">בית</Link></li>
                <li className="mx-1">/</li>
                <li><span className="text-foreground font-medium">מדריך תעודות גמולוגיות</span></li>
              </ol>
            </nav>

            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent mb-6 transition-colors group text-sm"
            >
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              חזרה לבלוג
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase bg-accent/10 text-accent px-3 py-1 rounded-full">
                <Award className="h-3.5 w-3.5" />
                Knowledge Hub
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                12 דקות קריאה
              </span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-4xl md:text-5xl leading-tight mb-6"
              style={{ color: '#856404', letterSpacing: '-0.02em' }}
            >
              המדריך המלא לתעודות גמולוגיות
            </motion.h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              GIA, IGI וכל מה שצריך לדעת לפני שרוכשים יהלום – מדריך מקצועי מבית DiamoNY
            </p>
          </div>
        </section>

        {/* Article Content */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16" itemScope itemType="https://schema.org/Article">
          <div className="blog-prose prose-lg max-w-none">

            {/* Introduction */}
            <p className="text-foreground/85 leading-[1.8] mb-10 text-lg">
              רכישת יהלום היא אחת ההחלטות המשמעותיות ביותר בעולם התכשיטים. בין אם מדובר בטבעת אירוסין,
              תליון יוקרתי או יהלום להשקעה – תעודה גמולוגית היא המסמך היחיד שמבטיח את איכות האבן ושומר על ערככם.
            </p>

            {/* Section: What is a gemological certificate */}
            <h2 className="text-2xl md:text-3xl font-bold mt-16 mb-6 text-foreground"
              style={{ borderRight: '3px solid #856404', paddingRight: '16px' }}>
              מהי תעודה גמולוגית?
            </h2>
            <p className="text-foreground/85 leading-[1.8] mb-6">
              תעודה גמולוגית (או דו&quot;ח גמולוגי) היא מסמך רשמי שמונפק על ידי מעבדה גמולוגית בלתי תלויה.
              היא מפרטת את כל המאפיינים הפיזיים והאופטיים של יהלום – משקל, צבע, ניקיון, ליטוש ומידות – ומהווה
              את &quot;תעודת הזהות&quot; של האבן.
            </p>
            <p className="text-foreground/85 leading-[1.8] mb-10">
              התעודה לא קובעת את מחיר היהלום, אלא מספקת הערכה אובייקטיבית של איכותו. על בסיס פרמטרים אלו,
              הצרכן יכול להשוות בין אבנים ולקבל החלטת רכישה מושכלת.
            </p>

            {/* Section: Leading institutions */}
            <h2 className="text-2xl md:text-3xl font-bold mt-16 mb-6 text-foreground"
              style={{ borderRight: '3px solid #856404', paddingRight: '16px' }}>
              המכונים הגמולוגיים המובילים
            </h2>

            <h3 className="text-xl font-bold mt-10 mb-4 p-5 rounded-lg bg-muted/50 text-foreground/90"
              style={{ borderRight: '3px solid #856404' }}>
              GIA – Gemological Institute of America
            </h3>
            <p className="text-foreground/85 leading-[1.8] mb-6">
              מכון GIA נוסד ב-1931 והוא נחשב לסמכות הגמולוגית המובילה בעולם. GIA פיתח את מערכת דירוג
              היהלומים הבינלאומית (4Cs) שהפכה לסטנדרט התעשייה. הדירוג שלו ידוע כמחמיר ביותר, מה שהופך
              את תעודות GIA למבוקשות במיוחד ליהלומי השקעה ולאבנים יוקרתיות.
            </p>

            <h3 className="text-xl font-bold mt-10 mb-4 p-5 rounded-lg bg-muted/50 text-foreground/90"
              style={{ borderRight: '3px solid #856404' }}>
              IGI – International Gemological Institute
            </h3>
            <p className="text-foreground/85 leading-[1.8] mb-10">
              מכון IGI, שנוסד ב-1975 באנטוורפן, הוא המכון הגמולוגי הגדול בעולם מבחינת נפח בדיקות.
              IGI מתמחה בתעודות ליהלומי מעבדה ולתכשיטים מוגמרים. בשנים האחרונות, הוא הפך לשם דבר
              במיוחד בשוק יהלומי ה-Lab-Grown, עם רמת אמינות ועקביות גבוהה.
            </p>

            {/* Section: The 4Cs */}
            <h2 className="text-2xl md:text-3xl font-bold mt-16 mb-6 text-foreground"
              style={{ borderRight: '3px solid #856404', paddingRight: '16px' }}>
              ארבעת ה-Cs – הפרמטרים בתעודה
            </h2>
            <p className="text-foreground/85 leading-[1.8] mb-8">
              כל תעודה גמולוגית בודקת ומדרגת את היהלום לפי ארבעה קריטריונים מרכזיים:
            </p>

            <div className="grid gap-6 mb-10">
              {[
                { title: "Carat – משקל (קראט)", desc: "יחידת המשקל של יהלום. קראט אחד שווה ל-0.2 גרם. ככל שהמשקל גבוה יותר – האבן נדירה יותר ושוויה עולה באופן אקספוננציאלי." },
                { title: "Color – צבע", desc: "סולם הצבע נע מ-D (חסר צבע לחלוטין, הנדיר ביותר) ועד Z (גוון צהבהב). הבדלים של דרגה אחת יכולים להשפיע משמעותית על המחיר." },
                { title: "Clarity – ניקיון", desc: "מידת הנקיות של היהלום מתכלולים (סימנים פנימיים) ופגמים חיצוניים. הסולם נע מ-FL (ללא פגם) ועד I3 (תכלולים הנראים בעין בלתי מזוינת)." },
                { title: "Cut – ליטוש", desc: "איכות הליטוש קובעת את הזוהר והברק של היהלום. דירוג Excellent מבטיח שהאבן מחזירה אור בצורה מיטבית." },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl border border-border/40 bg-card">
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
                  <p className="text-foreground/80 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Section: Natural vs Lab */}
            <h2 className="text-2xl md:text-3xl font-bold mt-16 mb-6 text-foreground"
              style={{ borderRight: '3px solid #856404', paddingRight: '16px' }}>
              יהלום טבעי מול יהלום מעבדה – מה כתוב בתעודה?
            </h2>
            <p className="text-foreground/85 leading-[1.8] mb-6">
              אחד השינויים המשמעותיים בשנים האחרונות הוא עליית יהלומי המעבדה (Lab-Grown Diamonds).
              גם ליהלומי מעבדה מונפקות תעודות גמולוגיות מלאות. ההבדל היחיד בתעודה הוא ציון מפורש
              של המקור: &quot;Natural Diamond&quot; או &quot;Laboratory Grown Diamond&quot;.
            </p>
            <p className="text-foreground/85 leading-[1.8] mb-10">
              חשוב להדגיש: הפרמטרים הנבדקים (4Cs) זהים לחלוטין. יהלום מעבדה באיכות D/VVS1/Excellent
              יקבל בדיוק את אותו דירוג כמו יהלום טבעי באותה רמה. ההבדל הוא במחיר ובערך ההשקעתי.
            </p>

            {/* Section: How to read */}
            <h2 className="text-2xl md:text-3xl font-bold mt-16 mb-6 text-foreground"
              style={{ borderRight: '3px solid #856404', paddingRight: '16px' }}>
              איך קוראים תעודה גמולוגית?
            </h2>
            <p className="text-foreground/85 leading-[1.8] mb-6">
              תעודה טיפוסית כוללת את הפרטים הבאים:
            </p>
            <ul className="list-disc list-inside mb-10 space-y-3 text-foreground/85 leading-[1.8]">
              <li><strong className="text-foreground">מספר דו&quot;ח (Report Number):</strong> מספר ייחודי לאימות מקוון.</li>
              <li><strong className="text-foreground">צורה וליטוש (Shape & Cut):</strong> עגול (Round Brilliant), אובל, כרית וכו&apos;.</li>
              <li><strong className="text-foreground">מידות (Measurements):</strong> קוטר וגובה האבן במילימטרים.</li>
              <li><strong className="text-foreground">משקל (Carat Weight):</strong> מדויק לשתי ספרות אחרי הנקודה.</li>
              <li><strong className="text-foreground">דירוג צבע (Color Grade):</strong> D עד Z.</li>
              <li><strong className="text-foreground">דירוג ניקיון (Clarity Grade):</strong> FL עד I3.</li>
              <li><strong className="text-foreground">דירוג ליטוש (Cut Grade):</strong> Excellent עד Poor.</li>
              <li><strong className="text-foreground">פלואורסצנציה (Fluorescence):</strong> None עד Strong.</li>
              <li><strong className="text-foreground">דיאגרמה (Plot):</strong> מפה ויזואלית של תכלולים ופגמים.</li>
            </ul>

            {/* Section: DiamoNY approach */}
            <h2 className="text-2xl md:text-3xl font-bold mt-16 mb-6 text-foreground"
              style={{ borderRight: '3px solid #856404', paddingRight: '16px' }}>
              הגישה שלנו ב-DiamoNY
            </h2>
            <p className="text-foreground/85 leading-[1.8] mb-6">
              ב-DiamoNY, כל יהלום מרכזי מלווה בתעודה גמולוגית מוכרת (GIA או IGI). אנו מאמינים
              בשקיפות מלאה – ולכן מציגים את פרטי התעודה בעמוד המוצר, כולל קישור לאימות מקוון ישירות
              באתר המכון.
            </p>
            <div className="p-6 rounded-xl border border-accent/20 bg-accent/5 mb-10 flex gap-4 items-start">
              <ShieldCheck className="h-6 w-6 text-accent shrink-0 mt-0.5" />
              <p className="text-foreground/85 leading-relaxed">
                <strong className="text-foreground">התחייבות DiamoNY:</strong> לא משנה אם אתם בוחרים יהלום טבעי או יהלום מעבדה –
                תקבלו תעודה גמולוגית רשמית עם אפשרות אימות מקוון. ללא פשרות.
              </p>
            </div>

            {/* FAQ Section */}
            <h2 className="text-2xl md:text-3xl font-bold mt-20 mb-8 text-foreground"
              style={{ borderRight: '3px solid #856404', paddingRight: '16px' }}>
              שאלות נפוצות
            </h2>

            <Accordion type="single" collapsible className="mb-16">
              {faqSchema.mainEntity.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border/40">
                  <AccordionTrigger className="text-right text-foreground hover:no-underline py-5 text-base font-medium">
                    {item.name}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80 leading-relaxed text-base pb-5">
                    {item.acceptedAnswer.text}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* CTA */}
            <div className="text-center py-12 border-t border-border/30">
              <p className="text-muted-foreground mb-4">מעוניינים לראות יהלומים עם תעודות מוסמכות?</p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                לקולקציה שלנו
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </div>

          <meta itemProp="author" content="DiamoNY" />
          <meta itemProp="headline" content="המדריך המלא לתעודות גמולוגיות" />
        </article>
      </main>

      <Footer />
    </>
  );
};

export default GemologicalCertificates;
