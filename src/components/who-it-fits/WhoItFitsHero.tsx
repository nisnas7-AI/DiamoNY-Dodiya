import { motion } from "framer-motion";

const WhoItFitsHero = () => (
  <section className="pt-10 pb-8 md:pt-16 md:pb-10 px-4 bg-background" aria-label="hero">
    <div className="max-w-3xl mx-auto text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6"
      >
        עיצוב תכשיט בהתאמה אישית ב-DiamoNY: האם התהליך שלנו מתאים לך?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="font-body text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto"
      >
        סטודיו DiamoNY מתמחה בייצור ועיצוב תכשיטים בהתאמה אישית מלאה (Custom Fine Jewelry).
        התהליך שלנו נועד להפוך רעיונות וחזון אישי ליצירות אמנות חד-פעמיות, משלב הסקיצה
        התלת-מימדית ועד לשיבוץ וליציקה הסופית.
      </motion.p>
    </div>
  </section>
);

export default WhoItFitsHero;
