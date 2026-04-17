# Engineering changelog

Technical notes for migrations, RLS, and infrastructure.

## 2026-04-15

- Added `public.brands`, `public.default_brand_id()`, `brand_id` columns (with backfill to default tenant), per-brand uniqueness for product/category slugs and content keys, and tightened RLS on catalog-related tables. Migration: `supabase/migrations/20260415180000_white_label_brands_tenant_rls.sql`.
- Follow-up: `supabase/migrations/20260416120000_fix_homepage_sections_public_read.sql` — public `homepage_sections` SELECT no longer requires `is_active` so draft/inactive hero rows match prior “read all sections” behavior for the default tenant.
- App: removed redundant client `.eq("brand_id", …)` on reads (RLS remains the gate); feature flags `VITE_FEATURE_NFC_CATALOG`, `VITE_FEATURE_DIGITAL_CARD` (default on when unset).
- Cloudways deploy script optionally exports all `VITE_*` from the loaded env file into the remote shell before `npm run build`.
- Docs: `docs/ARCHITECTURE.md`, `SECURITY_RLS.md`, `sql/onboard_new_brand.sql`, `supabase/tests/rls_smoke.sql`.

## 2026-04-17

- Reverted white-label multi-tenancy: migration `supabase/migrations/20260417100000_revert_white_label_brands.sql` drops `public.brands`, `brand_id` columns, and `default_brand_id()`, restores global uniqueness and pre-tenant RLS policies.
- App: removed `VITE_BRAND_ID`, `src/lib/brandId.ts`, and React Query keys that depended on `getBrandId()`.
- Docs: removed `WHITE_LABEL.md`, `COPY_AND_RUN_NEW_BRAND.md`, `NEW_BRAND_CHECKLIST.md`; updated `README.md`, `ARCHITECTURE.md`, `SECURITY_RLS.md`, `CHANGELOG_CLIENT.md`.
