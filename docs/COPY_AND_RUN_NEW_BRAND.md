# Copy this project and run another brand (simple steps)

This guide is for teams who **clone the same Git repository** and want a **separate website** (different domain / server / brand) without rewriting the codebase.

---

## 1. Get the code

```bash
git clone <YOUR_REPOSITORY_URL>
cd diamony
npm ci
```

Use your own fork or the upstream repo your vendor gives you.

---

## 2. Decide how you use Supabase

**Option A — One database, many brands (recommended when you control one Supabase project)**  
- Add a new row in `public.brands` (new `slug`, `display_name`, etc.).  
- Point this deployment at that brand’s UUID with `VITE_BRAND_ID`.  
- Seed or copy content for that `brand_id` (products, homepage, settings, etc.).  
- SQL starting point: [`docs/sql/onboard_new_brand.sql`](./sql/onboard_new_brand.sql).

**Option B — New Supabase project per client**  
- Create a new Supabase project.  
- Apply all migrations from this repo (`supabase db push` or your CI).  
- Then add your brand row and data as in Option A (or keep the default seeded brand if you only have one tenant in that project).

---

## 3. Apply database migrations

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) installed and logged in):

```bash
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

The storefront and admin expect the schema in `supabase/migrations/` (including `brands`, `brand_id`, RLS). Deploy the database **before** you rely on production traffic.

---

## 4. Set environment variables (build time)

Vite reads `VITE_*` when you run **`npm run build`**. The same values must exist on whatever machine runs the build (your laptop, CI, or the server).

| Variable | Required | What it is |
|----------|----------|------------|
| `VITE_SUPABASE_URL` | Yes | Project URL, e.g. `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase **anon** (publishable) key |
| `VITE_BRAND_ID` | No* | UUID of this site’s row in `public.brands`. *If omitted, the app uses the default seeded brand id — see `src/lib/brandId.ts`. |
| `VITE_SITE_URL` | No | Public site URL (canonical links, redirects where used) |
| `VITE_FEATURE_NFC_CATALOG` | No | `true` / `false` — NFC catalog + admin tools |
| `VITE_FEATURE_DIGITAL_CARD` | No | `true` / `false` — digital card route |

Put them in a **local** `.env` (never commit secrets). For Cloudways-style deploys, see [`scripts/cloudways/README.md`](../scripts/cloudways/README.md) — the deploy script can export `VITE_*` before `npm run build` on the server.

More detail: [`docs/WHITE_LABEL.md`](./WHITE_LABEL.md).

---

## 5. Admin access (first time on a new project)

1. In **Supabase → Authentication → Users**, create or invite an admin user (email + password).  
2. In **SQL Editor**, grant admin role (replace email):

   ```sql
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin'::public.app_role
   FROM auth.users
   WHERE lower(email) = lower('admin@example.com')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

3. After login, the app may ask for a **6-digit admin PIN**. That value lives in **`public.admin_settings.pin_code`** (default from migrations is often `123456` until someone changes it). You can read or reset it in the SQL Editor if needed.

---

## 6. Logo and visual changes (admin only — no code / no Git)

After you can open **`/admin`**, most **customer-visible** branding is driven by **Supabase data** (and media in Storage), not by editing React files. Use the **Hebrew** sidebar labels below; they match the live admin UI.

### Global brand identity (logo, name, contact strip)

- Sidebar: **הגדרות מותג** (palette icon) → opens **הגדרות מערכת ומותג**.  
- There you can set **שם המותג** (brand name), **לוגו** (upload an image or paste a public **HTTPS** image URL), footer/about text, support email, and WhatsApp.  
- These values are stored in **`public.brand_settings`** for the current `VITE_BRAND_ID` and feed the header/footer via `BrandSettingsProvider`.

### Homepage “look” (hero, header bar colors, sections)

- Sidebar: **ניהול תוכן** (pen icon) → open the **עמוד הבית / homepage** widget (**ניהול עמוד הבית**).  
- Inside that area you can manage, without code:
  - **Hero**: background video/image, **logo on the hero**, titles and copy.  
  - **Header design**: header and mobile menu **background colors** and opacity (stored under `site_content` key `header_design`).  
  - **Visual sections**: other homepage blocks (imagery, promos, etc., depending on what your team enabled).

Uploaded images usually go to Supabase **Storage** (e.g. catalog/media buckets) through the admin pickers.

### Digital business card (optional)

- If **`VITE_FEATURE_DIGITAL_CARD`** / NFC tools are on: **קטלוג NFC** in the sidebar includes **digital card theme** controls (e.g. fonts, hero/avatar, card logo) stored as settings for that feature.

### What still needs a developer

- **Global design system** changes (default Tailwind palette, typography scale, new layouts across many pages) are still done in **source code** (`tailwind.config`, CSS, components).  
- The admin screens above cover **per-brand content and many visible colors/images**, not a full redesign of the whole template.

---

## 7. Build and host the site

```bash
npm run build
```

Serve the **`dist/`** folder as a static site with **SPA fallback** (all routes should return `index.html` so client-side routing works). Point your **DNS** and **HTTPS (TLS)** at that host.

---

## 8. Checklist before go-live

- [ ] Migrations applied on the Supabase project you use in `VITE_SUPABASE_URL`.  
- [ ] `VITE_BRAND_ID` matches a real `brands.id` that has the content you expect.  
- [ ] Production build was made with the **same** `VITE_*` as production (rebuild after any env change).  
- [ ] At least one Auth user has `user_roles.role = 'admin'`.  
- [ ] Smoke: home, catalog, product, admin login, PIN if enabled.  
- [ ] Brand: logo and homepage hero look correct under **הגדרות מותג** and **ניהול עמוד הבית** (Section 6).

Deeper checks: [`docs/NEW_BRAND_CHECKLIST.md`](./NEW_BRAND_CHECKLIST.md), [`docs/SECURITY_RLS.md`](./SECURITY_RLS.md).

---

## Where to get help in this repo

| Topic | Doc |
|--------|-----|
| Env and tenant naming | [`WHITE_LABEL.md`](./WHITE_LABEL.md) |
| Ordered brand onboarding | [`NEW_BRAND_CHECKLIST.md`](./NEW_BRAND_CHECKLIST.md) |
| RLS / security | [`SECURITY_RLS.md`](./SECURITY_RLS.md) |
| Architecture overview | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| SSH deploy + `VITE_*` on server | [`../scripts/cloudways/README.md`](../scripts/cloudways/README.md) |
