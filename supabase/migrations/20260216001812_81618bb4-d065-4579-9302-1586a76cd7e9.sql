
-- Add preference fields and login_count to vip_members
ALTER TABLE public.vip_members
  ADD COLUMN IF NOT EXISTS pref_jewelry_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pref_gold_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pref_stone text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0;
