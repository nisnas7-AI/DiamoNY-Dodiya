-- RLS smoke checks for white-label migration (run manually in SQL editor).
-- Adjust UUIDs if your default brand id differs from the seeded template.

-- Expected default brand id (must match migration seed + VITE_BRAND_ID default)
-- b0000000-0000-4000-8000-000000000001

-- 1) default_brand_id() resolves
select public.default_brand_id() as default_brand;

-- 2) As superuser / postgres: confirm policies exist on products
select polname, polcmd, polroles::regrole[]
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'products'
order by polname;

-- 3) Anonymous read: use Supabase "Run as anon" or set role in a safe session:
--    set local role anon;
--    select count(*) from public.products where is_active = true;
--    Expect only rows for default_brand_id() (RLS enforced).

-- 4) Negative: if you insert a second brand and attach products to it, anon must not see them:
--    (verify separately after creating test data; clean up after.)

comment on schema public is 'rls_smoke.sql — companion to docs/SECURITY_RLS.md';
