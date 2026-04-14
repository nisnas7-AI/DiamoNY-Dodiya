import { useState } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVip } from "@/contexts/VipContext";
import { useSavedItems } from "@/hooks/useSavedItems";
import { toast } from "sonner";

interface WishlistHeartProps {
  productId: string;
  className?: string;
  onRequestVaultLogin?: () => void;
}

const WishlistHeart = ({ productId, className = "", onRequestVaultLogin }: WishlistHeartProps) => {
  const { isVip } = useVip();
  const { isSaved, toggleSave } = useSavedItems();
  const [justToggled, setJustToggled] = useState(false);
  const saved = isVip && isSaved(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isVip) {
      toast(
        <div dir="rtl" className="text-sm">
          <span>שמרו את הפריטים האהובים עליכם. </span>
          <button
            onClick={() => {
              toast.dismiss();
              onRequestVaultLogin?.();
            }}
            className="underline font-semibold"
            style={{ color: "#D4AF37" }}
          >
            הגישו בקשה לגישת כספת
          </button>
          <span> לניהול הקולקציה הפרטית שלכם.</span>
        </div>,
        {
          duration: 5000,
          style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(212,175,55,0.2)" },
        }
      );
      return;
    }

    setJustToggled(true);
    toggleSave.mutate(productId);
    setTimeout(() => setJustToggled(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className={`group/heart relative z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${className}`}
      aria-label={saved ? "הסר מהקולקציה הפרטית" : "שמור לקולקציה הפרטית"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={saved ? "filled" : "empty"}
          initial={justToggled ? { scale: 0.5 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${
              saved
                ? "fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]"
                : "text-white/70 group-hover/heart:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
            }`}
          />
        </motion.div>
      </AnimatePresence>
    </button>
  );
};

export default WishlistHeart;
