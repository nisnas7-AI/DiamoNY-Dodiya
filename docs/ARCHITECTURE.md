# Architecture

This document maps how the DiamoNY / white-label storefront is structured after the multi-tenant template work.

## High-level flow

```mermaid
flowchart LR
  subgraph client [Vite React app]
    UI[Pages and components]
    Core[Hooks and Supabase queries]
  end
  subgraph supabase [Supabase Postgres]
    RLS[RLS by brand_id / default tenant]
    Data[(Tenant-scoped tables)]
  end
  UI --> Core
  Core --> RLS
  RLS --> Data
```

- **UI**: Routes in [`src/App.tsx`](../src/App.tsx), marketing and catalog pages under [`src/pages/`](../src/pages/), shared UI in [`src/components/`](../src/components/).
- **Admin**: [`src/pages/admin/AdminDashboard.tsx`](../src/pages/admin/AdminDashboard.tsx) with sidebar config in [`src/components/admin/dashboard/AdminSidebar.tsx`](../src/components/admin/dashboard/AdminSidebar.tsx).
- **Brand surface**: Runtime brand fields (name, logo, footer copy, etc.) come from Supabase `brand_settings`, loaded in [`src/contexts/BrandSettingsContext.tsx`](../src/contexts/BrandSettingsContext.tsx). Static defaults and URLs also appear in [`src/lib/siteConfig.ts`](../src/lib/siteConfig.ts).
- **Supabase client**: [`src/integrations/supabase/client.ts`](../src/integrations/supabase/client.ts) — anon key on the storefront; Row Level Security enforces access patterns documented in [`SECURITY_RLS.md`](./SECURITY_RLS.md).

## Tenant identity (`brand_id`)

- Each deployed instance should set `VITE_BRAND_ID` to the UUID of its row in `public.brands`. If unset, the app uses the seeded default id (DiamoNY) — see [`src/lib/brandId.ts`](../src/lib/brandId.ts).
- Queries for catalog content, NFC cards, homepage sections, site content keys, and brand settings include `.eq("brand_id", getBrandId())` so the correct tenant’s rows are requested even when using a key that could theoretically see more via service tooling.
- Postgres RLS is still the **source of truth** for isolation; the UI must not be trusted alone.

## Feature flags

Central registry: [`src/lib/featureFlags.ts`](../src/lib/featureFlags.ts). Variables use the `VITE_FEATURE_*` prefix. When a variable is **unset**, behavior matches the previous single-brand site (features stay on).

## Build and deploy

- Vite inlines `import.meta.env` at build time. Any `VITE_*` variable required in production must be present when `npm run build` runs (see [`scripts/cloudways/README.md`](../scripts/cloudways/README.md)).

## Further reading

- [`WHITE_LABEL.md`](./WHITE_LABEL.md) — onboarding and env conventions
- [`SECURITY_RLS.md`](./SECURITY_RLS.md) — policies and verification SQL
- [`NEW_BRAND_CHECKLIST.md`](./NEW_BRAND_CHECKLIST.md) — ordered clone checklist
