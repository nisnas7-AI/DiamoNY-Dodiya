import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import LegalPageLayout from "@/components/layout/LegalPageLayout";

const Privacy = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["privacy-policy-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content, title")
        .eq("key", "privacy-policy")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <LegalPageLayout
      metaTitle="מדיניות פרטיות | DiamoNY - תכשיטי יוקרה"
      metaDescription="מדיניות הפרטיות והגנת המידע של DiamoNY. הגנה על פרטיות הלקוחות בהתאם לחוק הגנת הפרטיות."
      badgeText="PRIVACY POLICY"
      title="מדיניות פרטיות והגנת מידע"
      subtitle="DiamoNY מכבדת את פרטיותכם ומחויבת להגן על המידע האישי שלכם"
      content={data?.content}
      isLoading={isLoading}
      emptyMessage="תוכן מדיניות הפרטיות טרם הוזן. ניתן לערוך אותו מלוח הניהול."
    />
  );
};

export default Privacy;
