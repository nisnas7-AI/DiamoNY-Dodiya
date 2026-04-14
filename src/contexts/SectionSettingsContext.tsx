/**
 * SectionSettingsContext
 * Fetches ALL homepage section settings in a single query at the layout level
 * and distributes data to child components, eliminating per-component round-trips.
 */
import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SectionSetting } from "@/hooks/useSectionSettings";

interface SectionSettingsContextValue {
  settings: SectionSetting[];
  isLoading: boolean;
}

const SectionSettingsContext = createContext<SectionSettingsContextValue>({
  settings: [],
  isLoading: false,
});

export const SectionSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["homepage-section-settings-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_section_settings")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as SectionSetting[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — settings change infrequently
  });

  return (
    <SectionSettingsContext.Provider value={{ settings: data ?? [], isLoading }}>
      {children}
    </SectionSettingsContext.Provider>
  );
};

/** Internal hook consumed by useSectionSettings to read from the shared cache */
export const useSectionSettingsContext = () => useContext(SectionSettingsContext);
