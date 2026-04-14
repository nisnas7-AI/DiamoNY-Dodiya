
-- Phase 1 & 2: Add confirmation columns to vip_members
ALTER TABLE public.vip_members
  ADD COLUMN IF NOT EXISTS is_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Phase 1: Retroactive backfill — set confirmed for members with login_count > 0
-- Use the earliest login attempt as the confirmed_at timestamp
UPDATE public.vip_members m
SET is_confirmed = true,
    confirmed_at = COALESCE(
      (SELECT MIN(a.attempted_at) FROM public.vip_login_attempts a WHERE a.phone_key = m.phone_key),
      m.created_at
    )
WHERE m.login_count > 0 AND m.is_confirmed = false;

-- Phase 3: Create system_logs table for error tracking
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL DEFAULT 'error',
  source text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read system_logs" ON public.system_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role inserts system_logs" ON public.system_logs
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions (service role) to insert
CREATE POLICY "Anon can insert system_logs" ON public.system_logs
  FOR INSERT TO anon
  WITH CHECK (true);
