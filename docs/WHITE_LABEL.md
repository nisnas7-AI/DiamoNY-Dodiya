# White-label conventions

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon (publishable) key |
| `VITE_BRAND_ID` | No | UUID of this deployment’s tenant in `public.brands`. Defaults to the seeded DiamoNY id if omitted. |
| `VITE_SITE_URL` | No | Canonical public site URL where applicable (prefer over hardcoding). |
| `VITE_FEATURE_NFC_CATALOG` | No | `true` / `false` — NFC catalog routes and admin NFC tools. Default when unset: **on**. |
| `VITE_FEATURE_DIGITAL_CARD` | No | `true` / `false` — `/digital-card` and QR shortcut. Default when unset: **on**. |

All `VITE_*` values must be available at **build** time for Vite.

## Database: new brand

1. Insert a row into `public.brands` (unique `slug`, `display_name`, exactly one row with `is_default = true` per **logical** database if you rely on `default_brand_id()` for anonymous catalog reads).
2. Run app and admin against that brand’s `id` using `VITE_BRAND_ID`.
3. Seed or duplicate content tables with the same `brand_id` (products, categories, `site_content`, `homepage_sections`, `brand_settings`, NFC tables, etc.). See [`docs/sql/onboard_new_brand.sql`](./sql/onboard_new_brand.sql) for a starting pattern.

## DNS and deploy

1. Point DNS to your host (for example Cloudways application URL or custom domain).
2. Configure the host to serve the Vite `dist/` output and SPA fallback.
3. Ensure production build receives the same `VITE_*` values as production traffic expects.

## Naming

- **brand**: tenant row in `public.brands`.
- **brand_id**: foreign key on tenant-owned tables referencing `brands.id`.
