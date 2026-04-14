import { CSSProperties } from "react";
import { useSectionSettingsContext } from "@/contexts/SectionSettingsContext";

export interface SectionSetting {
  id: string;
  section_key: string;
  section_name: string;
  display_order: number;
  is_visible: boolean;
  padding_top: number;
  padding_bottom: number;
  background_color: string;
  background_opacity: number;
  background_image_url: string | null;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any> | null;
  font_size: number | null;
}

/**
 * Returns section settings from the shared SectionSettingsContext.
 * No individual DB query is fired — data comes from the single provider-level fetch.
 *
 * @param sectionKey  - Return only the matching setting (as SectionSetting | null).
 *                      Omit to receive the full array (SectionSetting[]).
 */
export const useSectionSettings = (sectionKey?: string) => {
  const { settings, isLoading } = useSectionSettingsContext();

  if (sectionKey) {
    const match = settings.find(s => s.section_key === sectionKey) ?? null;
    return { data: match, isLoading };
  }

  return { data: settings, isLoading };
};

export const getSectionStyle = (settings: SectionSetting | null | undefined): CSSProperties => {
  if (!settings) return {};

  const style: CSSProperties = {
    paddingTop: `${settings.padding_top}px`,
    paddingBottom: `${settings.padding_bottom}px`,
  };

  if (settings.background_color && settings.background_color !== "transparent") {
    style.backgroundColor = settings.background_color;
    style.opacity = settings.background_opacity / 100;
  }

  if (settings.background_image_url) {
    style.backgroundImage = `url(${settings.background_image_url})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }

  return style;
};

export const getSectionClasses = (settings: SectionSetting | null | undefined): string => {
  if (settings && !settings.is_visible) return "hidden";
  return "";
};
