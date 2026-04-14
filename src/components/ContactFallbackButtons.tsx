import { Phone, Mail, MessageCircle } from "lucide-react";

interface ContactFallbackButtonsProps {
  variant?: "light" | "dark";
  className?: string;
}

const ContactFallbackButtons = ({ variant = "light", className = "" }: ContactFallbackButtonsProps) => {
  const buttons = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      href: "https://wa.me/972546290534?text=היי%2C%20אשמח%20לפרטים%20נוספים%20על%20תכשיטי%20DiamoNY",
      color: "#25D366",
    },
    {
      icon: Phone,
      label: "התקשרו אלינו",
      href: "tel:+972546290534",
      color: "#D4AF37",
    },
    {
      icon: Mail,
      label: "שלחו מייל",
      href: "mailto:nisnas7@gmail.com?subject=פנייה%20מאתר%20DiamoNY",
      color: "#856404",
    },
  ];

  const bgClass = variant === "dark" 
    ? "bg-[#1A1A1A] hover:bg-[#2D2D2D]" 
    : "bg-background hover:bg-secondary/50";

  const textClass = variant === "dark" 
    ? "text-white" 
    : "text-foreground";

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 ${className}`}>
      {buttons.map((button) => (
        <a
          key={button.label}
          href={button.href}
          target={button.label === "WhatsApp" ? "_blank" : undefined}
          rel={button.label === "WhatsApp" ? "noopener noreferrer" : undefined}
          className={`
            flex items-center gap-3 px-6 py-3 w-full sm:w-auto
            ${bgClass} ${textClass}
            border border-[#D4AF37]/30 hover:border-[#D4AF37]
            rounded-xl transition-all duration-300
            hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]
            hover:-translate-y-0.5
            font-body text-sm
          `}
          style={{ borderRadius: '12px' }}
        >
          <button.icon 
            className="w-5 h-5" 
            style={{ color: button.color }}
          />
          <span>{button.label}</span>
        </a>
      ))}
    </div>
  );
};

export default ContactFallbackButtons;
