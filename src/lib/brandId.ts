/**
 * Seeded default tenant (DiamoNY). Must match `supabase/migrations/20260415180000_white_label_brands_tenant_rls.sql`.
 */
export const SEEDED_DEFAULT_BRAND_ID = "b0000000-0000-4000-8000-000000000001";

/**
 * Active tenant for this deployment. Set `VITE_BRAND_ID` in the build environment for other brands.
 */
export function getBrandId(): string {
  const raw = import.meta.env.VITE_BRAND_ID as string | undefined;
  if (raw && raw.trim().length > 0) return raw.trim();
  return SEEDED_DEFAULT_BRAND_ID;
}
