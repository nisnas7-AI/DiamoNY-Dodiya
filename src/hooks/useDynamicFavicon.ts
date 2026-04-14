import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FAVICON_SIZES = [
  { size: 16, rel: "icon" },
  { size: 32, rel: "icon" },
  { size: 48, rel: "icon" },
  { size: 180, rel: "apple-touch-icon" },
  { size: 192, rel: "icon" },
  { size: 512, rel: "icon" },
] as const;

export const useDynamicFavicon = () => {
  const { data } = useQuery({
    queryKey: ["web-presence-head"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web_presence_settings" as any)
        .select("favicon_16,favicon_32,favicon_48,favicon_180,favicon_192,favicon_512,favicon_version,theme_color,og_image_url")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, any> | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data) return;
    const v = data.favicon_version || 1;

    // Remove old dynamic favicon links
    document.querySelectorAll('link[data-dynamic-favicon]').forEach(el => el.remove());

    // Inject sized favicon links
    for (const { size, rel } of FAVICON_SIZES) {
      const url = data[`favicon_${size}`];
      if (!url) continue;
      const link = document.createElement("link");
      link.rel = rel;
      link.type = "image/png";
      link.setAttribute("sizes", `${size}x${size}`);
      link.href = `${url}?v=${v}`;
      link.setAttribute("data-dynamic-favicon", "true");
      document.head.appendChild(link);
    }

    // Update theme-color
    if (data.theme_color) {
      let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
      if (meta) {
        meta.content = data.theme_color;
      } else {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = data.theme_color;
        document.head.appendChild(meta);
      }
    }

    // Update OG image
    if (data.og_image_url) {
      for (const prop of ["og:image", "twitter:image"]) {
        const attr = prop.startsWith("og") ? "property" : "name";
        let meta = document.querySelector(`meta[${attr}="${prop}"]`) as HTMLMetaElement | null;
        if (meta) {
          meta.content = data.og_image_url;
        }
      }
    }
  }, [data]);
};
