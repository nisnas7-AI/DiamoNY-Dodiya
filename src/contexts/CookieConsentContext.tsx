import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CookiePreferences {
  necessary: boolean;   // always true
  functional: boolean;
  analytics: boolean;
  performance: boolean;
  advertisement: boolean;
  uncategorized: boolean;
}

export type ConsentStatus = "pending" | "accepted" | "rejected" | "custom";

interface CookieConsentState {
  status: ConsentStatus;
  preferences: CookiePreferences;
  isFormsBlocked: boolean;
}

interface CookieConsentContextValue extends CookieConsentState {
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: Partial<CookiePreferences>) => void;
  openSettings: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
}

const STORAGE_KEY = "diamony_cookie_consent_v2";

const defaultPrefs: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  performance: false,
  advertisement: false,
  uncategorized: false,
};

const allAccepted: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: true,
  performance: true,
  advertisement: true,
  uncategorized: true,
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function loadState(): CookieConsentState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsentState;
  } catch {
    return null;
  }
}

function persistState(state: CookieConsentState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CookieConsentState>(() => {
    const saved = loadState();
    if (saved) return saved;
    // migrate v1
    if (localStorage.getItem("diamony_cookie_consent") || sessionStorage.getItem("diamony_cookie_consent")) {
      const s: CookieConsentState = { status: "accepted", preferences: allAccepted, isFormsBlocked: false };
      persistState(s);
      return s;
    }
    return { status: "pending", preferences: defaultPrefs, isFormsBlocked: false };
  });

  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    persistState(state);
  }, [state]);

  const acceptAll = useCallback(() => {
    setState({ status: "accepted", preferences: allAccepted, isFormsBlocked: false });
  }, []);

  const rejectAll = useCallback(() => {
    setState({ status: "rejected", preferences: { ...defaultPrefs }, isFormsBlocked: true });
  }, []);

  const savePreferences = useCallback((prefs: Partial<CookiePreferences>) => {
    const merged = { ...defaultPrefs, ...prefs, necessary: true };
    const allOn = Object.values(merged).every(Boolean);
    const noneOptional = !merged.functional && !merged.analytics && !merged.performance && !merged.advertisement && !merged.uncategorized;
    setState({
      status: allOn ? "accepted" : noneOptional ? "rejected" : "custom",
      preferences: merged,
      isFormsBlocked: noneOptional,
    });
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);

  return (
    <CookieConsentContext.Provider value={{ ...state, acceptAll, rejectAll, savePreferences, openSettings, settingsOpen, setSettingsOpen }}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
};
