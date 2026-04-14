import { useState, useEffect } from "react";
import { MessageCircle, Diamond } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analyticsTracker";
import { useBrandSettings } from "@/contexts/BrandSettingsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import VaultLoginModal from "./VaultLoginModal";

const MobileBottomBar = () => {
  const brand = useBrandSettings();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isMobile) return null;

  const whatsappUrl = `https://wa.me/${brand.whatsapp_number}?text=${encodeURIComponent("שלום, אשמח לקבל מידע נוסף על התכשיטים שלכם")}`;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div
              className="flex border-t"
              style={{
                background: "rgba(253, 251, 247, 0.82)",
                backdropFilter: "blur(16px) saturate(1.4)",
                WebkitBackdropFilter: "blur(16px) saturate(1.4)",
                borderColor: "#D4AF37",
              }}
            >
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("whatsapp_click", "mobile_bottom_bar")}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 transition-colors duration-200 active:bg-accent/10"
                aria-label="צור קשר בוואטסאפ"
              >
                <MessageCircle className="w-[18px] h-[18px] text-foreground" strokeWidth={1.5} />
                <span className="font-body text-[13px] font-medium text-foreground tracking-wide">
                  WhatsApp
                </span>
              </a>

              {/* Divider */}
              <div className="w-px my-2.5" style={{ backgroundColor: "hsl(var(--border))" }} />

              {/* VIP Appointment */}
              <button
                onClick={() => {
                  trackEvent("vip_appointment_click", "mobile_bottom_bar");
                  setIsVaultOpen(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 transition-colors duration-200 active:bg-accent/10"
                aria-label="תיאום פגישת VIP"
              >
                <Diamond className="w-[18px] h-[18px] text-foreground" strokeWidth={1.5} />
                <span className="font-body text-[13px] font-medium text-foreground tracking-wide">
                  תיאום פגישת VIP
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <VaultLoginModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
    </>
  );
};

export default MobileBottomBar;
