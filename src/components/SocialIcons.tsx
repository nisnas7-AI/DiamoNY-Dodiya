import { Instagram, Facebook, Youtube, MessageCircle } from "lucide-react";

// TikTok icon
export const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Pinterest icon
export const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.43l1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.7 0 1.03-.66 2.58-1 4.01-.28 1.2.6 2.17 1.78 2.17 2.14 0 3.78-2.26 3.78-5.5 0-2.88-2.07-4.9-5.02-4.9-3.42 0-5.43 2.57-5.43 5.22 0 1.03.4 2.14.9 2.74.1.12.11.22.08.34l-.33 1.36c-.05.22-.18.27-.4.16-1.5-.7-2.43-2.88-2.43-4.64 0-3.78 2.75-7.26 7.93-7.26 4.16 0 7.4 2.97 7.4 6.93 0 4.14-2.6 7.46-6.22 7.46-1.22 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z"/>
  </svg>
);

export type SocialPlatformType = "instagram" | "facebook" | "youtube" | "tiktok" | "pinterest" | "whatsapp";

interface SocialIconProps {
  platform: SocialPlatformType | string;
  className?: string;
}

export const SocialIcon = ({ platform, className = "w-5 h-5" }: SocialIconProps) => {
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

export const getPlatformLabel = (platform: string): string => {
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

export const getPlatformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    instagram: "#E4405F",
    facebook: "#1877F2",
    youtube: "#FF0000",
    tiktok: "#000000",
    pinterest: "#E60023",
    whatsapp: "#25D366",
  };
  return colors[platform] || "#C5A059";
};
