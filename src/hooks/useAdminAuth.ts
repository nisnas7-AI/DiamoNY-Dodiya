import { useState, useEffect, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AdminAuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  hasPasskey: boolean;
}

export const useAdminAuth = () => {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    session: null,
    isAdmin: false,
    isLoading: true,
    hasPasskey: false,
  });

  // Prevent duplicate role checks from racing
  const roleCheckRef = useRef(0);

  const checkAdminRole = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  }, []);

  const checkHasPasskey = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("webauthn_credentials")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    return data && data.length > 0;
  }, []);

  useEffect(() => {
    // Single resolution path via onAuthStateChange (fires INITIAL_SESSION on mount)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const checkId = ++roleCheckRef.current;

        if (session?.user) {
          // Set user immediately so UI can show something
          setState(prev => ({
            ...prev,
            session,
            user: session.user,
          }));

          try {
            const [isAdmin, hasPasskey] = await Promise.all([
              checkAdminRole(session.user.id),
              checkHasPasskey(session.user.id),
            ]);

            // Only apply if this is still the latest check
            if (checkId === roleCheckRef.current) {
              setState(prev => ({ ...prev, isAdmin, hasPasskey, isLoading: false }));
            }
          } catch {
            // On network error, keep isLoading true to avoid false redirect
            if (checkId === roleCheckRef.current) {
              setState(prev => ({ ...prev, isLoading: false }));
            }
          }
        } else {
          setState({
            user: null,
            session: null,
            isAdmin: false,
            isLoading: false,
            hasPasskey: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdminRole, checkHasPasskey]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...state,
    signIn,
    signOut,
  };
};
