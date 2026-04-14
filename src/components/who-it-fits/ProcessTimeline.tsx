import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "פגישת היכרות והעלאת דרישות",
    description: "הקשבה לחזון, הבנת הדרישות, ובחינת חומרי הגלם הרצויים.",
  },
  {
    number: 2,
    title: "יצירת סקיצה תלת-מימדית (3D)",
    description: "תרגום הרעיון להדמיה ריאליסטית המאפשרת לראות את התכשיט העתידי מכל זווית.",
  },
  {
    number: 3,
    title: "עדכון סקיצה ואישור סופי",
    description: "דיוקים, שינויים ואישור העיצוב על ידכם.",
  },
  {
    number: 4,
    title: "העברה ליציקה וצורפות",
    description: "מעבר משלב התכנון הווירטואלי אל חומר הגלם הפיזי.",
  },
  {
    number: 5,
    title: "שיבוץ, גימור ומסירה",
    description: "שיבוץ היהלומים והאבנים, בקרת איכות קפדנית, ומסירת התכשיט הייחודי שלכם.",
  },
];

const ProcessTimeline = () => (
  <section className="py-10 md:py-14 px-4 bg-background">
    <div className="max-w-5xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8 md:mb-12 max-w-3xl mx-auto">
        <div className="w-16 h-px bg-accent/40 mx-auto mb-6" />
        <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl italic text-foreground/90 leading-relaxed mb-4">
          מסע מסעיר מרעיון גולמי לתכשיט מושלם
        </h2>
        <div className="w-16 h-px bg-accent/40 mx-auto mb-6" />
        <p className="font-body text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          תהליך העבודה שלנו שקוף, מהיר וממוקד. בממוצע, כאשר העיצוב והסקיצה מגובשים,
          התהליך כולו מתפרש על כ-7 ימי עסקים בלבד.
        </p>
      </div>

      {/* ── Desktop / Tablet — Horizontal RTL ── */}
      <div className="hidden md:block" dir="rtl">
        <div className="relative">
          {/* Horizontal connecting line — sits at vertical center of circles */}
          <div
            className="absolute top-8 right-8 left-8 h-px bg-border"
            aria-hidden="true"
          />

          <div className="flex flex-row justify-between items-start gap-2">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col items-center text-center flex-1 min-w-0"
              >
                {/* Circle — large premium size */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-card border-2 border-accent flex items-center justify-center shadow-sm mb-4">
                  <span className="font-heading text-xl font-bold text-foreground">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-heading text-sm lg:text-base font-semibold text-foreground mb-1.5 leading-snug px-1">
                  {step.title}
                </h3>
                <p className="font-body text-xs lg:text-sm text-muted-foreground leading-relaxed px-1">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile — Vertical ── */}
      <div className="md:hidden">
        <div className="relative pr-10">
          <div
            className="absolute top-0 bottom-0 right-[19px] w-px bg-border"
            aria-hidden="true"
          />
          <div className="space-y-7">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex gap-4"
              >
                <div className="absolute right-[-10px] z-10 w-10 h-10 rounded-full bg-card border-2 border-accent flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="font-heading text-base font-bold text-foreground">
                    {step.number}
                  </span>
                </div>
                <div className="mr-6">
                  <h3 className="font-heading text-base font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ProcessTimeline;
