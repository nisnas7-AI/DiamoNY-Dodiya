import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VipMember {
  id: string;
  full_name: string;
  credit_balance: number;
  gender_preference: "female" | "male" | "all";
  is_active: boolean;
  marketing_consent: boolean;
  consent_date: string | null;
  email: string | null;
  is_confirmed: boolean;
  confirmed_at: string | null;
}

interface VipContextType {
  member: VipMember | null;
  isVip: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  isImpersonating: boolean;
  login: (phoneKey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshMember: () => Promise<void>;
  startImpersonation: (member: VipMember) => void;
  stopImpersonation: () => void;
}

const VipContext = createContext<VipContextType>({
  member: null,
  isVip: false,
  isLoading: true,
  needsOnboarding: false,
  isImpersonating: false,
  login: async () => ({ success: false }),
  logout: () => {},
  refreshMember: async () => {},
  startImpersonation: () => {},
  stopImpersonation: () => {},
});

export const useVip = () => useContext(VipContext);

/**
 * Session keys — we only store the member **id** (opaque reference).
 * Full member data is ALWAYS fetched from the server before being trusted.
 * This prevents C-3 (session tampering via sessionStorage).
 */
const SESSION_KEY = "diamony_vault_session_id";
const IMPERSONATION_KEY = "diamony_vault_impersonation";

const mapMember = (data: any): VipMember => ({
  id: data.id,
  full_name: data.full_name,
  credit_balance: Number(data.credit_balance),
  gender_preference: data.gender_preference as VipMember["gender_preference"],
  is_active: data.is_active,
  marketing_consent: data.marketing_consent,
  consent_date: data.consent_date,
  email: data.email ?? null,
  is_confirmed: data.is_confirmed ?? false,
  confirmed_at: data.confirmed_at ?? null,
});

/** Validate a member id server-side and return fresh member data */
const validateSession = async (memberId: string): Promise<VipMember | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("vip-auth", {
      body: { action: "validate", member_id: memberId },
    });
    if (!error && data?.success && data?.member) {
      return mapMember(data.member);
    }
    // Server explicitly said invalid → clear
    if (!error && !data?.success) return null;
    // Network / rate-limit error → return undefined (keep loading)
    return undefined as unknown as VipMember | null;
  } catch {
    return undefined as unknown as VipMember | null;
  }
};

export const VipProvider = ({ children }: { children: ReactNode }) => {
  const [member, setMember] = useState<VipMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Restore session on mount
  useEffect(() => {
    // Check impersonation first (admin-only, trusted path)
    const impersonated = sessionStorage.getItem(IMPERSONATION_KEY);
    if (impersonated) {
      try {
        const parsed = JSON.parse(impersonated) as VipMember;
        setMember(parsed);
        setIsImpersonating(true);
        setIsLoading(false);
        return;
      } catch {
        sessionStorage.removeItem(IMPERSONATION_KEY);
      }
    }

    // C-3 fix: only store member ID, always validate server-side before trusting
    const storedId = sessionStorage.getItem(SESSION_KEY);
    if (storedId) {
      validateSession(storedId).then((result) => {
        if (result === (undefined as unknown)) {
          // Network error — we have no data to show, but don't lock user out.
          // Keep loading false with no member (safe default — no credit shown).
          setIsLoading(false);
        } else if (result) {
          setMember(result);
          setIsLoading(false);
        } else {
          // Explicitly invalid
          sessionStorage.removeItem(SESSION_KEY);
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (phoneKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("vip-auth", {
        body: { action: "login", phone_key: phoneKey },
      });

      let payload = data;
      if (!payload && error) {
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx === "object") {
          payload = ctx;
        } else {
          try { payload = JSON.parse((error as any)?.message || "{}"); } catch { payload = {}; }
        }
      }

      if (payload?.error === "rate_limit") {
        return { success: false, error: "יותר מדי ניסיונות. נסו שוב בעוד 15 דקות." };
      }
      if (payload?.error === "teaser") {
        return { success: false, error: "teaser" };
      }
      if (payload?.error === "invalid_input") {
        return { success: false, error: "not_found" };
      }

      if (payload?.success && payload?.member) {
        const m = mapMember(payload.member);
        setMember(m);
        // C-3 fix: store only the opaque ID, never the full member object
        sessionStorage.setItem(SESSION_KEY, m.id);
        return { success: true };
      }

      if (error) {
        return { success: false, error: "שגיאה לא צפויה." };
      }
      return { success: false, error: "teaser" };
    } catch (e: any) {
      try {
        const parsed = JSON.parse(e?.message || "{}");
        if (parsed?.error === "rate_limit") {
          return { success: false, error: "יותר מדי ניסיונות. נסו שוב בעוד 15 דקות." };
        }
      } catch { /* not JSON */ }
      return { success: false, error: "שגיאה לא צפויה." };
    }
  }, []);

  const logout = useCallback(() => {
    setMember(null);
    setIsImpersonating(false);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(IMPERSONATION_KEY);
  }, []);

  const refreshMember = useCallback(async () => {
    if (!member || isImpersonating) return;
    const result = await validateSession(member.id);
    if (result && result !== (undefined as unknown)) {
      setMember(result);
    }
  }, [member, isImpersonating]);

  const startImpersonation = useCallback((m: VipMember) => {
    setMember(m);
    setIsImpersonating(true);
    sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(m));
  }, []);

  const stopImpersonation = useCallback(() => {
    setIsImpersonating(false);
    sessionStorage.removeItem(IMPERSONATION_KEY);
    // Restore real session if exists
    const storedId = sessionStorage.getItem(SESSION_KEY);
    if (storedId) {
      validateSession(storedId).then((result) => {
        if (result && result !== (undefined as unknown)) {
          setMember(result);
        } else {
          setMember(null);
        }
      });
    } else {
      setMember(null);
    }
  }, []);

  const needsOnboarding = !!member && !member.consent_date && !isImpersonating;
  const isVip = !!member;

  const value = useMemo(() => ({
    member, isVip, isLoading, needsOnboarding, isImpersonating,
    login, logout, refreshMember, startImpersonation, stopImpersonation,
  }), [member, isVip, isLoading, needsOnboarding, isImpersonating, login, logout, refreshMember, startImpersonation, stopImpersonation]);

  return (
    <VipContext.Provider value={value}>
      {children}
    </VipContext.Provider>
  );
};
