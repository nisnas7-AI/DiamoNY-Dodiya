import { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const KEY_CLICKED = "vip_review_clicked";
const KEY_THANK_YOU = "vip_thank_you_seen";
const GOOGLE_REVIEW_URL = "https://g.page/r/CTvuyPZ1WHkZEBM/review";

type WidgetState = "prompt" | "thank_you" | "dismissed";

function resolveState(): WidgetState {
  try {
    const clicked = localStorage.getItem(KEY_CLICKED) === "true";
    const thankYouSeen = localStorage.getItem(KEY_THANK_YOU) === "true";
    if (clicked && thankYouSeen) return "dismissed";
    if (clicked && !thankYouSeen) return "thank_you";
    return "prompt";
  } catch {
    return "prompt";
  }
}

interface VIPReviewWidgetProps {
  creditAmount?: number;
}

const VIPReviewWidget = ({ creditAmount = 50 }: VIPReviewWidgetProps) => {
  const [state, setState] = useState<WidgetState>(resolveState);
  const originalTitle = useRef(document.title);

  // Mark thank-you as seen once rendered
  useEffect(() => {
    if (state === "thank_you") {
      try { localStorage.setItem(KEY_THANK_YOU, "true"); } catch {}
    }
  }, [state]);

  // Tab-retention UX for thank_you state
  useEffect(() => {
    if (state !== "thank_you") return;
    const handle = () => {
      document.title = document.hidden ? "הקרדיט שלך ממתין כאן ✨" : originalTitle.current;
    };
    document.addEventListener("visibilitychange", handle);
    return () => {
      document.removeEventListener("visibilitychange", handle);
      document.title = originalTitle.current;
    };
  }, [state]);

  const handleClick = () => {
    try { localStorage.setItem(KEY_CLICKED, "true"); } catch {}
    setState("thank_you");
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
  };

  // State 4: render nothing
  if (state === "dismissed") return null;

  return (
    <div
      className="relative rounded-2xl border border-white/15 p-6 md:p-8 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.06) inset",
      }}
    >
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(39,50%,65%) 0%, transparent 70%)" }}
      />

      <AnimatePresence mode="wait">
        {state === "prompt" ? (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-5 text-center md:text-right"
          >
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Star className="w-5 h-5 text-[#C9A96E]" />
              <h3 className="text-base font-heading font-semibold text-white/90">
                שתפו את החוויה
              </h3>
            </div>

            <p className="text-sm md:text-[15px] leading-relaxed text-white/60 max-w-xl font-body">
              הקול שלכם הוא ההשראה לעיצוב הבא שלנו. אנו מזמינים אתכם לשתף את
              החוויה ב-Google – וכאות הערכה על זמנכם, הקרדיט האישי שלכם כבר
              ממתין להיחשף כאן מיד למטה.
            </p>

            <Button
              onClick={handleClick}
              className="rounded-full bg-gradient-to-r from-[#C9A96E] to-[#b8944f] hover:brightness-110 text-[#0a0a0a] font-semibold text-sm tracking-wide px-7 h-11 shadow-[0_4px_20px_rgba(201,169,110,0.35)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(201,169,110,0.45)]"
            >
              <Star className="w-4 h-4 ml-1.5" />
              לשיתוף החוויה ב-Google
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="thankyou"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="text-center space-y-3 py-2"
          >
            <p className="text-sm text-white/50 font-body">תודה ששיתפתם ❤️</p>

            <div className="relative inline-block">
              <motion.span
                className="text-3xl md:text-4xl font-heading font-bold"
                style={{
                  background: "linear-gradient(135deg, #C9A96E 0%, #e8d5a8 40%, #C9A96E 60%, #b8944f 100%)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                ₪{creditAmount.toLocaleString("he-IL")} קרדיט VIP
              </motion.span>
            </div>

            <p className="text-xs text-white/40 font-body">
              הקרדיט נוסף לחשבונך ויופחת ברכישה הבאה
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VIPReviewWidget;
