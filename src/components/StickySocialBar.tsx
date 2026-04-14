import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instagram, Facebook, Youtube, MessageCircle } from "lucide-react";
import { useSocialSettings } from "@/contexts/SocialSettingsContext";

// TikTok and Pinterest icons
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.43l1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.7 0 1.03-.66 2.58-1 4.01-.28 1.2.6 2.17 1.78 2.17 2.14 0 3.78-2.26 3.78-5.5 0-2.88-2.07-4.9-5.02-4.9-3.42 0-5.43 2.57-5.43 5.22 0 1.03.4 2.14.9 2.74.1.12.11.22.08.34l-.33 1.36c-.05.22-.18.27-.4.16-1.5-.7-2.43-2.88-2.43-4.64 0-3.78 2.75-7.26 7.93-7.26 4.16 0 7.4 2.97 7.4 6.93 0 4.14-2.6 7.46-6.22 7.46-1.22 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z"/>
  </svg>
);

const getPlatformIcon = (platform: string, className: string) => {
  switch (platform) {
    case "instagram":
      return <Instagram className={className} />;
    case "facebook":
      return <Facebook className={className} />;
    case "youtube":
      return <Youtube className={className} />;
    case "tiktok":
      return <TikTokIcon className={className} />;
    case "pinterest":
      return <PinterestIcon className={className} />;
    case "whatsapp":
      return <MessageCircle className={className} />;
    default:
      return null;
  }
};

const getPlatformLabel = (platform: string): string => {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    tiktok: "TikTok",
    pinterest: "Pinterest",
    whatsapp: "WhatsApp",
  };
  return labels[platform] || platform;
};

const StickySocialBar = () => {
  const { getEnabledPlatforms, stickyBarEnabled } = useSocialSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const enabledPlatforms = getEnabledPlatforms('sticky_bar');

  // Show bar after scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't render if disabled or no platforms
  if (!stickyBarEnabled || enabledPlatforms.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            staggerChildren: 0.1 
          }}
          className="fixed right-4 bottom-24 z-40 hidden md:flex flex-col gap-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div 
            className={`flex flex-col gap-2 p-2 rounded-lg backdrop-blur-md transition-all duration-300 ${
              isHovered 
                ? "bg-primary/90 shadow-xl" 
                : "bg-primary/60 shadow-lg"
            }`}
          >
            {enabledPlatforms.map((platform, index) => (
              <motion.a
                key={platform.platform}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative p-2.5 rounded-md transition-all duration-200 hover:bg-accent/20"
                aria-label={getPlatformLabel(platform.platform)}
              >
                {getPlatformIcon(
                  platform.platform, 
                  `w-5 h-5 text-[#C5A059] transition-transform duration-200 group-hover:scale-110`
                )}
                
                {/* Tooltip */}
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {getPlatformLabel(platform.platform)}
                </span>
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickySocialBar;
