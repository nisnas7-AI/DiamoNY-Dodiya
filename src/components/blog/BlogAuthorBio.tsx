import { motion } from "framer-motion";
import { MessageCircle, Award } from "lucide-react";

export const BlogAuthorBio = () => {
  const whatsappUrl = "https://wa.me/972546290534?text=%D7%94%D7%99%D7%99%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%AA%D7%90%D7%9D%20%D7%A4%D7%92%D7%99%D7%A9%D7%AA%20%D7%99%D7%99%D7%A2%D7%95%D7%A5";

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-16 rounded-2xl border border-border/40 p-8 md:p-10"
      style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 100%)" }}
      itemScope
      itemType="https://schema.org/Person"
    >
      <div className="flex items-center gap-2 mb-6">
        <Award className="h-4 w-4" style={{ color: "#856404" }} />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#856404" }}>
          About the Designer
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Avatar placeholder */}
        <div
          className="w-20 h-20 rounded-full shrink-0 flex items-center justify-center text-2xl font-heading"
          style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #C5A059 100%)",
            color: "#FDFBF7",
          }}
          aria-hidden="true"
        >
          NY
        </div>

        <div className="flex-1">
          <h3
            className="font-heading text-xl md:text-2xl mb-1"
            style={{ color: "#856404" }}
            itemProp="name"
          >
            ניצן יעקובי
          </h3>
          <p className="text-sm text-muted-foreground mb-3" itemProp="jobTitle">
            צורף אומן ומעצב תכשיטים
          </p>
          <p
            className="font-body leading-relaxed text-foreground/85 mb-5"
            itemProp="description"
          >
            מומחה לצורפות עילית והדמיית תלת-ממד (3D). מייסד סטודיו DiamoNY, עם ניסיון של מעל 15
            שנים ביצירת תכשיטי יוקרה בבורסת היהלומים.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #D4AF37 0%, #C5A059 100%)",
              color: "#FDFBF7",
            }}
          >
            <MessageCircle className="h-4 w-4" />
            תיאום פגישת ייעוץ אישית
          </a>
        </div>
      </div>

      {/* Hidden structured data */}
      <meta itemProp="url" content="https://diamony.me" />
      <span className="hidden" itemProp="worksFor" itemScope itemType="https://schema.org/Organization">
        <meta itemProp="name" content="DiamoNY" />
      </span>
    </motion.aside>
  );
};

export default BlogAuthorBio;
