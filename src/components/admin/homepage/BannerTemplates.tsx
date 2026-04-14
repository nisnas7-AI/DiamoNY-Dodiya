import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

export interface BannerTemplate {
  id: string;
  name: string;
  gradient: string;
  textColor: string;
  textPosition: "center" | "right" | "left";
  overlayOpacity: number;
  fontStyle: "bold" | "elegant" | "modern";
  preview: React.ReactNode;
}

export const bannerTemplates: BannerTemplate[] = [
  {
    id: "gold-luxury",
    name: "זהב יוקרתי",
    gradient: "linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #8B7355 100%)",
    textColor: "#FFFFFF",
    textPosition: "center",
    overlayOpacity: 0.3,
    fontStyle: "elegant",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-[#B8860B] via-[#DAA520] to-[#8B7355] flex items-center justify-center">
        <span className="text-white font-serif text-sm">טקסט המבצע</span>
      </div>
    ),
  },
  {
    id: "midnight-blue",
    name: "כחול לילה",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    textColor: "#E8D5B7",
    textPosition: "center",
    overlayOpacity: 0.4,
    fontStyle: "modern",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <span className="text-[#E8D5B7] font-sans text-sm font-bold">טקסט המבצע</span>
      </div>
    ),
  },
  {
    id: "rose-gold",
    name: "רוז גולד",
    gradient: "linear-gradient(135deg, #B76E79 0%, #E8B4B8 50%, #D4A5A5 100%)",
    textColor: "#FFFFFF",
    textPosition: "center",
    overlayOpacity: 0.2,
    fontStyle: "elegant",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-[#B76E79] via-[#E8B4B8] to-[#D4A5A5] flex items-center justify-center">
        <span className="text-white font-serif text-sm">טקסט המבצע</span>
      </div>
    ),
  },
  {
    id: "black-diamond",
    name: "יהלום שחור",
    gradient: "linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2D2D2D 100%)",
    textColor: "#FFFFFF",
    textPosition: "center",
    overlayOpacity: 0.5,
    fontStyle: "bold",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-[#0D0D0D] via-[#1A1A1A] to-[#2D2D2D] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
        <span className="text-white font-bold text-sm relative z-10">טקסט המבצע</span>
      </div>
    ),
  },
  {
    id: "champagne",
    name: "שמפניה",
    gradient: "linear-gradient(135deg, #F7E7CE 0%, #E8D5B7 50%, #D4C4A8 100%)",
    textColor: "#4A4A4A",
    textPosition: "center",
    overlayOpacity: 0.1,
    fontStyle: "elegant",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-[#F7E7CE] via-[#E8D5B7] to-[#D4C4A8] flex items-center justify-center">
        <span className="text-[#4A4A4A] font-serif text-sm">טקסט המבצע</span>
      </div>
    ),
  },
  {
    id: "ruby-red",
    name: "רובי אדום",
    gradient: "linear-gradient(135deg, #9B1B30 0%, #C41E3A 50%, #722F37 100%)",
    textColor: "#FFFFFF",
    textPosition: "center",
    overlayOpacity: 0.3,
    fontStyle: "bold",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-[#9B1B30] via-[#C41E3A] to-[#722F37] flex items-center justify-center">
        <span className="text-white font-bold text-sm">טקסט המבצע</span>
      </div>
    ),
  },
  {
    id: "emerald",
    name: "אמרלד ירוק",
    gradient: "linear-gradient(135deg, #046307 0%, #0B6623 50%, #228B22 100%)",
    textColor: "#FFFFFF",
    textPosition: "center",
    overlayOpacity: 0.3,
    fontStyle: "modern",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-[#046307] via-[#0B6623] to-[#228B22] flex items-center justify-center">
        <span className="text-white font-sans text-sm font-medium">טקסט המבצע</span>
      </div>
    ),
  },
  {
    id: "platinum",
    name: "פלטינה",
    gradient: "linear-gradient(135deg, #E5E4E2 0%, #BFC1C2 50%, #A9A9A9 100%)",
    textColor: "#2C2C2C",
    textPosition: "center",
    overlayOpacity: 0.1,
    fontStyle: "modern",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-[#E5E4E2] via-[#BFC1C2] to-[#A9A9A9] flex items-center justify-center">
        <span className="text-[#2C2C2C] font-sans text-sm font-medium">טקסט המבצע</span>
      </div>
    ),
  },
];

interface BannerTemplatesPickerProps {
  selectedTemplate: string | null;
  onSelect: (template: BannerTemplate) => void;
}

const BannerTemplatesPicker = ({ selectedTemplate, onSelect }: BannerTemplatesPickerProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">בחר תבנית עיצוב לבאנר:</p>
      <div className="grid grid-cols-4 gap-3">
        {bannerTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary/50 ${
              selectedTemplate === template.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelect(template)}
          >
            <div className="relative h-16">
              {template.preview}
              {selectedTemplate === template.id && (
                <div className="absolute top-1 left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="p-2 text-center">
              <span className="text-xs font-medium">{template.name}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BannerTemplatesPicker;
