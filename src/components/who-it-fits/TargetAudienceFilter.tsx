import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface AudienceItem {
  heading: string;
  text: string;
}

const positiveItems: AudienceItem[] = [
  {
    heading: "אתם מחפשים יצירה חד-פעמית:",
    text: "תכשיט שמספר את הסיפור האישי שלכם ולא ניתן למצוא בחנויות או על אנשים אחרים.",
  },
  {
    heading: "חשובה לכם מעורבות בתהליך:",
    text: "אתם מעוניינים להשפיע, לבחור את העיצוב המדויק, ולהיות חלק מתהליך היצירה לצד מומחים.",
  },
  {
    heading: "איכות ללא פשרות היא תנאי סף:",
    text: "אתם דורשים רמת גימור, שיבוץ וליטוש בסטנדרטים הבינלאומיים הגבוהים ביותר.",
  },
];

const negativeItems: AudienceItem[] = [
  {
    heading: "אתם מחפשים תכשיטי מדף:",
    text: "מוצרים המיוצרים בייצור המוני וזמינים לרכישה ואיסוף מיידי ללא תהליך התאמה.",
  },
  {
    heading: "אין לכם זמן לתהליך יצירה:",
    text: 'אם אתם זקוקים לתכשיט "מעכשיו לעכשיו" ולא יכולים להמתין את ימי העסקים הנדרשים לייצור קפדני.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const TargetAudienceFilter = () => (
  <section className="py-8 md:py-12 px-4 bg-card/50">
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Positive Column */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-card rounded-2xl p-8 md:p-10 shadow-sm border border-border/40"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8">
            זה מתאים לך אם...
          </h2>
          <div className="space-y-6">
            {positiveItems.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-7 h-7 rounded-full bg-[hsl(var(--brand-gold,39,58%,56%))]/15 flex items-center justify-center">
                    <Check className="w-4 h-4 text-[hsl(39,58%,56%)]" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                    {item.heading}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Negative Column */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-card rounded-2xl p-8 md:p-10 shadow-sm border border-border/40"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8">
            התהליך פחות יתאים לך אם...
          </h2>
          <div className="space-y-6">
            {negativeItems.map((item, i) => (
              <motion.div
                key={i}
                custom={i + 3}
                variants={cardVariants}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                    {item.heading}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default TargetAudienceFilter;
