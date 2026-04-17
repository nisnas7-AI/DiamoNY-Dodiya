# Security: Row Level Security (RLS)

This document ties the **white-label tenant migration** to the threat model and how to re-verify a clone.

## Migration source of truth

Primary migration defining `brands`, `default_brand_id()`, `brand_id` columns, and replacement policies for catalog-adjacent tables:

- [`../supabase/migrations/20260415180000_white_label_brands_tenant_rls.sql`](../supabase/migrations/20260415180000_white_label_brands_tenant_rls.sql)

Earlier migrations created tables and historical policies; the file above **drops** overlapping policy names and replaces them with brand-scoped rules.

## Helper function

| Function | Purpose |
|----------|---------|
| `public.default_brand_id()` | `SECURITY DEFINER`, stable lookup of `brands.id` where `is_default = true`. Used for **anonymous** catalog/content policies so public traffic only sees the default tenant’s rows until JWT claims are extended per brand. |

Future pattern (optional): add `brand_id` to JWT app metadata and replace `default_brand_id()` in policies with `auth.jwt() ->> 'brand_id'` (cast to uuid) for per-session tenants — document and migrate consistently before enabling.

## Policy matrix (post-migration)

| Table | Anonymous (`anon`) | Authenticated customer | Admin (`has_role(..., 'admin')`) |
|-------|--------------------|-------------------------|-----------------------------------|
| `brands` | SELECT rows with `is_default = true` only | Same as anon for non-admins | Full CRUD via `brands_admin_all` |
| `products` | SELECT active rows where `brand_id = default_brand_id()` | Same | Full SELECT/insert/update/delete |
| `categories` | SELECT active rows for default brand | Same | ALL |
| `site_content` | SELECT active rows for default brand | Same | insert/update/delete |
| `homepage_sections` | SELECT rows for default brand (active semantics preserved) | Same | insert/update/delete |
| `nfc_catalog_cards` | SELECT active rows for default brand | Same | ALL |
| `orders` | INSERT with `brand_id = default_brand_id()` | SELECT own rows (`user_id = auth.uid()`) | ALL |
| `brand_settings` | SELECT default brand row | Same | insert/update |
| `product_images` | SELECT when parent `products.brand_id = default_brand_id()` | Same | ALL |

**Threat model notes**

- **Public catalog read**: Must not leak another brand’s SKUs or prices; enforced by `brand_id = default_brand_id()` on anon paths.
- **Admin**: Retains broad access for operations; the app additionally filters by `getBrandId()` so a single admin UI deployment targets one tenant.
- **Service role**: Bypasses RLS — use only on trusted servers (Edge functions, batch jobs), never in the browser.

## Verification SQL

Runnable checks (anon vs authenticated) live in:

- [`../supabase/tests/rls_smoke.sql`](../supabase/tests/rls_smoke.sql)

Run fragments in the Supabase SQL editor with appropriate role context as documented in that file.
