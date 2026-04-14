import { useEffect } from "react";
import { SITE_URL } from "@/lib/siteConfig";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LegalPageLayout from "@/components/layout/LegalPageLayout";

const Terms = () => {
  const { data: content, isLoading } = useQuery({
    queryKey: ["site-content", "terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "terms")
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const metadata = content?.metadata as { meta_title?: string; meta_description?: string } | null;

  return (
    <LegalPageLayout
      metaTitle={metadata?.meta_title || "תקנון האתר | DiamoNY תכשיטים"}
      metaDescription={metadata?.meta_description || "תקנון האתר של DiamoNY - מדיניות אחריות, תעודות אותנטיות, משלוחים ותיקונים."}
      canonicalUrl={`${SITE_URL}/terms`}
      badgeText="TERMS OF SERVICE"
      title="תקנון האתר"
      subtitle="תנאי השימוש והמדיניות של DiamoNY"
      content={content?.content}
      isLoading={isLoading}
      emptyMessage="תוכן התקנון טרם הוזן. ניתן לערוך אותו מלוח הניהול."
    />
  );
};

export default Terms;
