import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>מדיניות פרטיות | DiamoNY - תכשיטי יוקרה</title>
        <meta
          name="description"
          content="מדיניות הפרטיות והגנת המידע של DiamoNY. הגנה על פרטיות הלקוחות בהתאם לחוק הגנת הפרטיות."
        />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 bg-gradient-to-b from-secondary/50 to-background">
          <div className="container-luxury text-center">
            <span className="text-accent font-light text-sm tracking-[0.3em] uppercase mb-4 block">
              PRIVACY POLICY
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-4">
              מדיניות פרטיות והגנת מידע
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              DiamoNY מכבדת את פרטיותכם ומחויבת להגן על המידע האישי שלכם
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="section-padding">
          <div className="container-luxury max-w-4xl">
            <div className="card-luxury p-8 md:p-12 prose prose-lg max-w-none text-foreground">
              
              <h2 className="font-heading text-2xl font-light text-foreground mb-4">1. כללי</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                חברת DiamoNY (להלן: "החברה" או "בעל השליטה") מכבדת את פרטיות לקוחותיה 
                ומחויבת להגן על המידע האישי הנמסר לה, בהתאם להוראות חוק הגנת הפרטיות, 
                התשמ"א-1981 ותיקון מס' 13 לחוק. מסמך זה מפרט את המידע שאנו אוספים ואת 
                השימושים הנעשים בו.
              </p>

              <h2 className="font-heading text-2xl font-light text-foreground mb-4">2. המידע הנאסף ומטרות השימוש</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                המידע האישי שיימסר על ידך (כגון: שם מלא, מספר טלפון, כתובת דוא"ל, והעדפות 
                תכשיטים) יישמר במאגר המידע של החברה. השימוש במידע יעשה למטרות הבאות בלבד:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pr-4">
                <li>יצירת קשר טלפוני או דיגיטלי לצורך מתן שירות, תיאום פגישות ומענה לפנייתך.</li>
                <li>שילוח דיוור ישיר, עדכונים על קולקציות חדשות, ומבצעים בלעדיים (בכפוף להסכמתך).</li>
                <li>ניהול מועדון לקוחות וניתוח סטטיסטי פנימי לשיפור השירות.</li>
              </ul>

              <h2 className="font-heading text-2xl font-light text-foreground mb-4">3. מסירת מידע לצד שלישי</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                אנו מתחייבים כי המידע האישי שלך לא יימכר, לא יושכר ולא יועבר לשום צד שלישי 
                למטרות מסחריות. הגישה למידע מוגבלת אך ורק לעובדי החברה המוסמכים לכך ולספקים 
                טכנולוגיים (כגון שירותי אחסון אתרים) הפועלים מטעמנו לצורך תפעול האתר בלבד, 
                תחת חובת סודיות קפדנית.
              </p>

              <h2 className="font-heading text-2xl font-light text-foreground mb-4">4. חובת מסירת המידע</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                יובהר כי לא חלה עליך כל חובה חוקית למסור את המידע האמור, ומסירתו תלויה 
                ברצונך ובהסכמתך המלאה, אולם ללא מסירת פרטי ההתקשרות לא נוכל לחזור אליך 
                או לספק לך את השירות המבוקש.
              </p>

              <h2 className="font-heading text-2xl font-light text-foreground mb-4">5. זכויותיך (עיון, תיקון ומחיקה)</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                עומדת לך הזכות לעיין במידע המוחזק עליך במאגרי החברה. במידה ומצאת כי המידע 
                אינו נכון, שלם, ברור או מעודכן, הנך רשאי/ת לפנות אלינו בבקשה לתקן את המידע 
                או למחוק אותו.
              </p>

              <div className="bg-secondary/30 p-6 rounded-sm border border-border mt-8">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  לפניות בנושא פרטיות והסרה מרשימת הדיוור:
                </h3>
                <a 
                  href="mailto:nisnas7@gmail.com" 
                  className="text-accent hover:underline font-medium"
                >
                  nisnas7@gmail.com
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  עודכן לאחרונה: דצמבר 2025
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default PrivacyPolicy;
