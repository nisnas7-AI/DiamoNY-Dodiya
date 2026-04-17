# New brand checklist

Ordered steps to spin up a **new** storefront against the shared engine.

1. **Clone** this repository and install dependencies (`npm ci`).
2. **Supabase**: create or reuse a project; note `VITE_SUPABASE_URL` and anon key.
3. **Run migrations** (`supabase db push` or CI pipeline) so `brands`, `brand_id`, and RLS exist.
4. **Insert brand row** in `public.brands` (unique `slug`). See [`docs/sql/onboard_new_brand.sql`](./sql/onboard_new_brand.sql).
5. **Seed content** for that `brand_id`: categories, products, `brand_settings`, `site_content`, `homepage_sections`, NFC data as needed.
6. **Configure env** for the deployment: `VITE_BRAND_ID`, all `VITE_SUPABASE_*`, optional `VITE_FEATURE_*`, `VITE_SITE_URL`.
7. **Build**: `npm run build` with the same env vars the CDN/server will use.
8. **DNS + TLS**: point the live domain at the host; verify HTTPS.
9. **Smoke test**: run key flows (home, catalog, product, checkout stub, admin login) and execute [`supabase/tests/rls_smoke.sql`](../supabase/tests/rls_smoke.sql) snippets.
