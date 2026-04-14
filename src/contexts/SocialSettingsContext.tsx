import { createContext, useContext, useMemo, useCallback, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SocialPlatform {
  id: string;
  platform: string;
  is_enabled: boolean;
  url: string;
  show_in_header: boolean;
  show_in_footer: boolean;
  show_in_sticky_bar: boolean;
}

interface SocialSettingsContextType {
  platforms: SocialPlatform[];
  stickyBarEnabled: boolean;
  isLoading: boolean;
  getPlatformUrl: (platform: string) => string | null;
  isPlatformEnabled: (platform: string) => boolean;
  getEnabledPlatforms: (location: 'header' | 'footer' | 'sticky_bar') => SocialPlatform[];
}

const SocialSettingsContext = createContext<SocialSettingsContextType | undefined>(undefined);

interface SocialConfig {
  page_url?: string;
  profile_url?: string;
  username?: string;
  channel_url?: string;
  show_in_header?: boolean;
  show_in_footer?: boolean;
  show_in_sticky_bar?: boolean;
}

interface SocialSettingRaw {
  id: string;
  platform: string;
  is_enabled: boolean;
  config: SocialConfig;
}

interface SiteSettingRaw {
  key: string;
  value: { enabled?: boolean };
}

const getUrlFromConfig = (platform: string, config: SocialConfig): string => {
  switch (platform) {
    case "instagram":
      return config.username 
        ? `https://instagram.com/${config.username.replace('@', '')}` 
        : "";
    case "facebook":
      return config.page_url || "";
    case "youtube":
      return config.channel_url || "";
    case "tiktok":
      return config.username 
        ? `https://tiktok.com/@${config.username.replace('@', '')}` 
        : "";
    case "pinterest":
      return config.profile_url || "";
    case "whatsapp":
      return config.page_url || "";
    default:
      return config.page_url || config.profile_url || "";
  }
};

export const SocialSettingsProvider = ({ children }: { children: ReactNode }) => {
  // Fetch social settings from public view (excludes access_token)
  const { data: socialSettingsRaw, isLoading: isLoadingSocial } = useQuery({
    queryKey: ["social-settings-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_settings_public")
        .select("*");
      if (error) throw error;
      return data as unknown as SocialSettingRaw[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch sticky bar master toggle from site_settings
  const { data: stickyBarSetting, isLoading: isLoadingSticky } = useQuery({
    queryKey: ["sticky-bar-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "sticky_social_bar")
        .maybeSingle();
      if (error) throw error;
      return data as SiteSettingRaw | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Transform raw data to SocialPlatform array — memoized to prevent re-renders
  const platforms = useMemo<SocialPlatform[]>(() => 
    (socialSettingsRaw || []).map((setting) => ({
      id: setting.id,
      platform: setting.platform,
      is_enabled: setting.is_enabled,
      url: getUrlFromConfig(setting.platform, setting.config),
      show_in_header: setting.config.show_in_header ?? true,
      show_in_footer: setting.config.show_in_footer ?? true,
      show_in_sticky_bar: setting.config.show_in_sticky_bar ?? true,
    })),
    [socialSettingsRaw]
  );

  const stickyBarEnabled = stickyBarSetting?.value?.enabled ?? true;

  const getPlatformUrl = useCallback((platform: string): string | null => {
    const found = platforms.find(p => p.platform === platform && p.is_enabled);
    return found?.url || null;
  }, [platforms]);

  const isPlatformEnabled = useCallback((platform: string): boolean => {
    const found = platforms.find(p => p.platform === platform);
    return found?.is_enabled ?? false;
  }, [platforms]);

  const getEnabledPlatforms = useCallback((location: 'header' | 'footer' | 'sticky_bar'): SocialPlatform[] => {
    return platforms.filter(p => {
      if (!p.is_enabled || !p.url) return false;
      switch (location) {
        case 'header':
          return p.show_in_header;
        case 'footer':
          return p.show_in_footer;
        case 'sticky_bar':
          return p.show_in_sticky_bar;
        default:
          return true;
      }
    });
  }, [platforms]);

  const isLoading = isLoadingSocial || isLoadingSticky;

  const value = useMemo(() => ({
    platforms,
    stickyBarEnabled,
    isLoading,
    getPlatformUrl,
    isPlatformEnabled,
    getEnabledPlatforms,
  }), [platforms, stickyBarEnabled, isLoading, getPlatformUrl, isPlatformEnabled, getEnabledPlatforms]);

  return (
    <SocialSettingsContext.Provider value={value}>
      {children}
    </SocialSettingsContext.Provider>
  );
};

export const useSocialSettings = () => {
  const context = useContext(SocialSettingsContext);
  if (context === undefined) {
    throw new Error("useSocialSettings must be used within a SocialSettingsProvider");
  }
  return context;
};
