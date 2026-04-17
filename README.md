# DiamoNY — white-label storefront (Vite + React + Supabase)

Production jewelry storefront with an admin surface. The codebase is structured as a **multi-tenant template**: one Supabase database can host multiple brands using `brand_id` and Row Level Security (see [`docs/SECURITY_RLS.md`](docs/SECURITY_RLS.md)).

## Quick start (local)

```sh
git clone <YOUR_REPO_URL>
cd diamony
npm install
cp .env.example .env   # if present; otherwise configure VITE_* per docs/WHITE_LABEL.md
npm run dev
```

Required environment variables for the app:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_BRAND_ID` (optional; defaults to seeded DiamoNY tenant UUID — [`src/lib/brandId.ts`](src/lib/brandId.ts))

## Database migrations

**This frontend expects the white-label migration to be applied** (columns such as `brand_id` on catalog tables). Deploy the database **before** or together with this app version.

Use the Supabase CLI from the repo root:

```sh
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

After schema changes, regenerate TypeScript types if you use generated `Database` types:

```sh
npx supabase gen types typescript --project-id "<PROJECT_REF>" --schema public > src/integrations/supabase/types.ts
```

## Deploy (Cloudways / SSH)

See [`scripts/cloudways/README.md`](scripts/cloudways/README.md). The deploy script can sync sources and run `npm ci` / `npm run build` on the server, exporting any `VITE_*` variables from your env file into the remote shell so the build matches production.

## Documentation

| Doc | Description |
|-----|-------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Module map and data flow |
| [`docs/WHITE_LABEL.md`](docs/WHITE_LABEL.md) | Env vars and onboarding |
| [`docs/SECURITY_RLS.md`](docs/SECURITY_RLS.md) | RLS policies and verification |
| [`docs/NEW_BRAND_CHECKLIST.md`](docs/NEW_BRAND_CHECKLIST.md) | Clone-to-live checklist |
| [`docs/COPY_AND_RUN_NEW_BRAND.md`](docs/COPY_AND_RUN_NEW_BRAND.md) | Client steps: copy repo, new server / brand |
| [`docs/CHANGELOG_CLIENT.md`](docs/CHANGELOG_CLIENT.md) | Non-technical changelog |
| [`docs/CHANGELOG_ENGINEERING.md`](docs/CHANGELOG_ENGINEERING.md) | Technical changelog |
| [`docs/legacy-lovable.md`](docs/legacy-lovable.md) | Historical Lovable editor notes |

## History

Early iterations of this repo used the Lovable hosted editor; local and SSH-based workflows are now the primary path for production changes.
