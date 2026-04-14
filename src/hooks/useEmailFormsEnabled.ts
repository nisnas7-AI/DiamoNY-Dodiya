import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmailFormsSettingRaw {
  id: string;
  key: string;
  value: { enabled: boolean };
  created_at: string;
  updated_at: string;
}

export const useEmailFormsEnabled = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["email-forms-enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "email_forms_enabled")
        .maybeSingle();
      
      if (error) throw error;
      return data as EmailFormsSettingRaw | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Default to true if no setting exists (forms enabled by default)
  const isEmailFormsEnabled = data?.value?.enabled ?? true;

  return {
    isEmailFormsEnabled,
    isLoading,
  };
};
