import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analyticsTracker";
import { useBrandSettings } from "@/contexts/BrandSettingsContext";

const WhatsAppButton = () => {
  const brand = useBrandSettings();
  const phoneNumber = brand.whatsapp_number;
  const message = "שלום, אשמח לקבל מידע נוסף על התכשיטים שלכם";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("whatsapp_click", "floating_button")}
      className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-[#25D366] rounded-full hidden md:flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 group"
      aria-label="צור קשר בוואטסאפ"
    >
      <MessageCircle className="w-7 h-7 text-white" fill="white" />
      
      {/* Tooltip */}
      <span className="absolute right-16 bg-card text-foreground text-sm px-3 py-2 rounded-sm shadow-elegant opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        דברו איתנו בוואטסאפ
      </span>
    </a>
  );
};

export default WhatsAppButton;
