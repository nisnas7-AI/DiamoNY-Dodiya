# Row Level Security (RLS)

The storefront uses the Supabase **anon** key in the browser; Postgres RLS defines what anonymous and authenticated users can read or write.

## Canonical migrations

- Historical white-label migration (superseded): [`../supabase/migrations/20260415180000_white_label_brands_tenant_rls.sql`](../supabase/migrations/20260415180000_white_label_brands_tenant_rls.sql)
- **Revert** (single-tenant catalog, no `brands` / `brand_id`): [`../supabase/migrations/20260417100000_revert_white_label_brands.sql`](../supabase/migrations/20260417100000_revert_white_label_brands.sql)

## Current pattern (after revert)

| Table | Anonymous (`anon`) | Authenticated non-admin | Admin |
| --- | --- | --- | --- |
| `products` | SELECT rows with `is_active = true` | Same | Full SELECT / insert / update / delete |
| `categories` | SELECT rows with `is_active = true` | Same | Full CRUD |
| `site_content` | SELECT all rows | — | Insert / update / delete |
| `homepage_sections` | SELECT all rows | — | Insert / update / delete |
| `nfc_catalog_cards` | SELECT rows with `is_active = true` | Same | Full CRUD |
| `orders` | INSERT with `WITH CHECK (true)` | SELECT own rows (`user_id = auth.uid()`) | ALL |
| `brand_settings` | SELECT all rows | — | Insert / update |
| `product_images` | SELECT all rows | — | Insert / update / delete |

Admin checks use `public.has_role(auth.uid(), 'admin'::public.app_role)` where applicable.

## Verification

See [`../supabase/tests/rls_smoke.sql`](../supabase/tests/rls_smoke.sql) for optional smoke queries after `supabase db push`.
