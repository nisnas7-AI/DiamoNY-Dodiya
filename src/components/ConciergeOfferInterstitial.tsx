import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConciergeOffer {
  id: string;
  heading: string;
  message: string;
}

interface ConciergeOfferInterstitialProps {
  offer: ConciergeOffer | null;
  onDismiss: () => void;
}

const ConciergeOfferInterstitial = ({ offer, onDismiss }: ConciergeOfferInterstitialProps) => {
  if (!offer) return null;

  const handleDismiss = async () => {
    // Mark as read
    await supabase
      .from("vip_personalized_offers")
      .update({ is_read: true })
      .eq("id", offer.id);
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ backgroundColor: "hsl(0 0% 4% / 0.95)" }}
        dir="rtl"
      >
        {/* Subtle gold radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, hsl(38 35% 55% / 0.1) 0%, transparent 60%)",
          }}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          className="relative max-w-lg w-full mx-6 text-center space-y-8"
        >
          {/* Sparkle icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Sparkles className="w-10 h-10 mx-auto text-[hsl(38,35%,55%)]" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl md:text-4xl font-heading font-extrabold text-white leading-tight"
          >
            {offer.heading}
          </motion.h1>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-base md:text-lg text-white/70 leading-relaxed max-w-md mx-auto whitespace-pre-line"
          >
            {offer.message}
          </motion.p>

          {/* Gold separator */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[hsl(38,35%,55%)] to-transparent"
          />

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            <Button
              onClick={handleDismiss}
              className="bg-gradient-to-r from-[hsl(38,35%,55%)] to-[hsl(38,35%,40%)] text-[hsl(0,0%,7%)] font-bold text-base px-10 py-6 rounded-xl hover:brightness-110 hover:scale-[1.02] transition-all duration-300 shadow-[0_0_30px_hsl(38,35%,55%,0.2)]"
            >
              צפייה בהצעה הפרטית שלי
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-xs text-white/20"
          >
            הצעה אישית מצוות DiamoNY
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConciergeOfferInterstitial;
