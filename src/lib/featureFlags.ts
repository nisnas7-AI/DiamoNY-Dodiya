/**
 * Build-time feature flags (`VITE_FEATURE_*`).
 * When a variable is unset or empty, behavior matches the legacy single-brand site (features ON).
 */
function envFlag(key: keyof ImportMetaEnv, defaultOn: boolean): boolean {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === null || raw === "") return defaultOn;
  const s = String(raw).toLowerCase().trim();
  if (s === "0" || s === "false" || s === "no" || s === "off") return false;
  if (s === "1" || s === "true" || s === "yes" || s === "on") return true;
  return defaultOn;
}

export const featureFlags = {
  nfcCatalog: envFlag("VITE_FEATURE_NFC_CATALOG", true),
  digitalCard: envFlag("VITE_FEATURE_DIGITAL_CARD", true),
} as const;
