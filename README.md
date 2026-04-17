# DiamoNY — storefront (Vite + React + Supabase)

Production jewelry storefront with an admin surface backed by a single Supabase database. Row Level Security controls public catalog reads and admin writes (see [`docs/SECURITY_RLS.md`](docs/SECURITY_RLS.md)).

## Quick start (local)

```sh
git clone <YOUR_REPO_URL>
cd diamony
npm install
cp .env.example .env   # if present; otherwise set VITE_SUPABASE_* and optional VITE_* per README below
npm run dev
```

Required environment variables for the app:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Optional:

- `VITE_SITE_URL`
- `VITE_FEATURE_NFC_CATALOG`, `VITE_FEATURE_DIGITAL_CARD` (see [`src/lib/featureFlags.ts`](src/lib/featureFlags.ts))

## Database migrations

Apply migrations from [`supabase/migrations/`](supabase/migrations/) so the database matches the app (including [`supabase/migrations/20260417100000_revert_white_label_brands.sql`](supabase/migrations/20260417100000_revert_white_label_brands.sql) if you previously deployed the white-label migration).

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
| [`docs/SECURITY_RLS.md`](docs/SECURITY_RLS.md) | RLS policies and verification |
| [`docs/CHANGELOG_CLIENT.md`](docs/CHANGELOG_CLIENT.md) | Non-technical changelog |
| [`docs/CHANGELOG_ENGINEERING.md`](docs/CHANGELOG_ENGINEERING.md) | Technical changelog |
| [`docs/legacy-lovable.md`](docs/legacy-lovable.md) | Historical Lovable editor notes |

## History

Early iterations of this repo used the Lovable hosted editor; local and SSH-based workflows are now the primary path for production changes.
