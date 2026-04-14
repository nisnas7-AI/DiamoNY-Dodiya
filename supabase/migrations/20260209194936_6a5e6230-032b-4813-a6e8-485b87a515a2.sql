
-- ============================================================================
-- VIP Portal: vip_users, vip_cards, access_logs
-- ============================================================================

-- 1. VIP Users table (must be created first due to FK)
CREATE TABLE public.vip_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  dates_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. VIP Cards table
CREATE TABLE public.vip_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  user_id UUID REFERENCES public.vip_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Access Logs table
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.vip_cards(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  page TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.vip_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- vip_cards: public can SELECT to validate UIDs
CREATE POLICY "Anyone can validate vip card uid"
  ON public.vip_cards FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage vip cards"
  ON public.vip_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- vip_users: public can read
CREATE POLICY "Anyone can read vip users"
  ON public.vip_users FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage vip users"
  ON public.vip_users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- access_logs: anyone can insert, only admins can read
CREATE POLICY "Anyone can log vip access"
  ON public.access_logs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read access logs"
  ON public.access_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Timestamps triggers
CREATE TRIGGER update_vip_cards_updated_at
  BEFORE UPDATE ON public.vip_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vip_users_updated_at
  BEFORE UPDATE ON public.vip_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_vip_cards_uid ON public.vip_cards (uid);
CREATE INDEX idx_access_logs_card_id ON public.access_logs (card_id);
