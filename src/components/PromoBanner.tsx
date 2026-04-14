import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useState } from "react";
import { useSectionSettings, SectionSetting } from "@/hooks/useSectionSettings";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  banner_image_url: string | null;
  banner_text: string | null;
  banner_text_color: string;
  banner_gradient: string | null;
  slug: string;
  cta_text: string;
  banner_opacity: number | null;
}

const PromoBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const { data: sectionSettings } = useSectionSettings("promo_banner");
  const settingsTyped = sectionSettings as SectionSetting | null;

  const { data: promo } = useQuery({
    queryKey: ["active-promo-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .eq("show_on_homepage", true)
        .maybeSingle();
      
      if (error) throw error;
      return data as Promotion | null;
    },
  });

  if (!promo || dismissed) return null;
  if (settingsTyped && !settingsTyped.is_visible) return null;

  const hasGradient = promo.banner_gradient && !promo.banner_image_url;
  const hasImage = promo.banner_image_url;
  const fontSize = (settingsTyped as any)?.font_size || 14;
  
  // Get background settings from section settings, fallback to promo settings
  const bgColor = settingsTyped?.background_color && settingsTyped.background_color !== 'transparent' 
    ? settingsTyped.background_color 
    : null;
  const bgOpacity = (settingsTyped?.background_opacity ?? 100) / 100;

  // Determine background style
  const getBackgroundStyle = () => {
    if (bgColor) {
      return bgColor;
    }
    if (hasGradient) {
      return promo.banner_gradient;
    }
    if (!hasImage) {
      return 'hsl(var(--primary))';
    }
    return undefined;
  };

  return (
    <Link
      to={`/promo/${promo.slug}`}
      className="block relative w-full group"
    >
      <div 
        className="relative h-16 md:h-20 overflow-hidden"
        style={{ 
          paddingTop: settingsTyped?.padding_top || 0,
          paddingBottom: settingsTyped?.padding_bottom || 0,
        }}
      >
        {/* Background layer with opacity */}
        <div 
          className="absolute inset-0"
          style={{
            background: getBackgroundStyle(),
            opacity: bgOpacity,
          }}
        />
        {hasImage && (
          <div className="absolute inset-0" style={{ opacity: bgOpacity }}>
            <img
              src={promo.banner_image_url}
              alt={promo.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-transparent to-primary/60" />
          </div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <span
              className="font-bold"
              style={{ 
                color: promo.banner_text_color || "#FFFFFF",
                fontSize: `${fontSize}px`,
                textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              {promo.banner_text || promo.title}
            </span>
            {promo.description && (
              <span
                className="hidden md:inline-block mx-3"
                style={{ 
                  color: promo.banner_text_color || "#FFFFFF",
                  fontSize: `${Math.max(fontSize - 4, 10)}px`,
                  textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                • {promo.description}
              </span>
            )}
            <span
              className="inline-block mr-3 underline underline-offset-2 group-hover:no-underline transition-all"
              style={{ 
                color: promo.banner_text_color || "#FFFFFF",
                fontSize: `${Math.max(fontSize - 4, 10)}px`,
                textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {promo.cta_text}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDismissed(true);
          }}
          className="absolute top-1/2 -translate-y-1/2 left-3 p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          aria-label="סגור באנר"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </Link>
  );
};

export default PromoBanner;
