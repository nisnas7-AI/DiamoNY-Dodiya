# Engineering changelog

Technical notes for migrations, RLS, and infrastructure.

## 2026-04-15

- Added `public.brands`, `public.default_brand_id()`, `brand_id` columns (with backfill to default tenant), per-brand uniqueness for product/category slugs and content keys, and tightened RLS on catalog-related tables. Migration: `supabase/migrations/20260415180000_white_label_brands_tenant_rls.sql`.
- Follow-up: `supabase/migrations/20260416120000_fix_homepage_sections_public_read.sql` — public `homepage_sections` SELECT no longer requires `is_active` so draft/inactive hero rows match prior “read all sections” behavior for the default tenant.
- App: removed redundant client `.eq("brand_id", …)` on reads (RLS remains the gate); feature flags `VITE_FEATURE_NFC_CATALOG`, `VITE_FEATURE_DIGITAL_CARD` (default on when unset).
- Cloudways deploy script optionally exports all `VITE_*` from the loaded env file into the remote shell before `npm run build`.
- Docs: `docs/ARCHITECTURE.md`, `WHITE_LABEL.md`, `SECURITY_RLS.md`, `NEW_BRAND_CHECKLIST.md`, `sql/onboard_new_brand.sql`, `supabase/tests/rls_smoke.sql`.
