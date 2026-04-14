import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "./useAdminAuth";

export const useSuperAdminAuth = () => {
  const adminAuth = useAdminAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkSuperAdminRole = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();
    return !!data;
  }, []);

  useEffect(() => {
    if (adminAuth.user) {
      checkSuperAdminRole(adminAuth.user.id).then(setIsSuperAdmin);
    } else {
      setIsSuperAdmin(false);
    }
  }, [adminAuth.user, checkSuperAdminRole]);

  return {
    ...adminAuth,
    isSuperAdmin,
  };
};
