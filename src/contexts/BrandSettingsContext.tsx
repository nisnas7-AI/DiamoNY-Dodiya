import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BrandSettings {
  brand_name: string;
  logo_url: string;
  footer_about_text: string;
  support_email: string;
  whatsapp_number: string;
  site_url: string;
}

const DEFAULTS: BrandSettings = {
  brand_name: "DiamoNY",
  logo_url: "/lovable-uploads/083379c4-874c-46e2-949d-4b7023e62bc4.png",
  footer_about_text: "צורפות עילית בעיצוב אישי. תכשיטי יוקרה בהתאמה אישית וקולקציות ייחודיות מאז 2010.",
  support_email: "info@diamony.me",
  whatsapp_number: "972546290534",
  site_url: "https://diamony.me",
};

const BrandSettingsContext = createContext<BrandSettings>(DEFAULTS);

export const useBrandSettings = () => useContext(BrandSettingsContext);

export const BrandSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data } = useQuery({
    queryKey: ["brand-settings"],
    queryFn: async (): Promise<BrandSettings> => {
      const { data: rows, error } = await supabase
        .from("brand_settings")
        .select("brand_name, logo_url, footer_about_text, support_email, whatsapp_number, site_url")
        .maybeSingle();
      if (error || !rows) return DEFAULTS;
      return { ...DEFAULTS, ...rows } as BrandSettings;
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <BrandSettingsContext.Provider value={data || DEFAULTS}>
      {children}
    </BrandSettingsContext.Provider>
  );
};
