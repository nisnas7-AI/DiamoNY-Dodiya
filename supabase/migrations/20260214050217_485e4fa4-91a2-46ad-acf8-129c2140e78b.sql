
-- Step 0: Create the has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 1: Create enum for gender preference
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_preference') THEN
    CREATE TYPE public.gender_preference AS ENUM ('female', 'male', 'all');
  END IF;
END $$;

-- Step 2: VIP Members table
CREATE TABLE IF NOT EXISTS public.vip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_key TEXT NOT NULL,
  full_name TEXT NOT NULL,
  credit_balance NUMERIC NOT NULL DEFAULT 0,
  gender_preference gender_preference NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT true,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vip_members_phone_key_unique UNIQUE (phone_key)
);
CREATE INDEX IF NOT EXISTS idx_vip_members_phone_key ON public.vip_members (phone_key);

-- Step 3: VIP Special Dates
CREATE TABLE IF NOT EXISTS public.vip_special_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.vip_members(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vip_special_dates_member ON public.vip_special_dates (member_id);

-- Step 4: VIP Settings (key-value store)
CREATE TABLE IF NOT EXISTS public.vip_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 5: VIP Product Rules
CREATE TABLE IF NOT EXISTS public.vip_product_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  is_vip_exclusive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vip_product_rules_product_unique UNIQUE (product_id)
);
CREATE INDEX IF NOT EXISTS idx_vip_product_rules_product ON public.vip_product_rules (product_id);

-- Step 6: Login attempts for rate limiting
CREATE TABLE IF NOT EXISTS public.vip_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_key TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hint TEXT
);

-- Step 7: Enable RLS
ALTER TABLE public.vip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_special_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_product_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_login_attempts ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies

-- vip_settings
DROP POLICY IF EXISTS "Anyone can read vip_settings" ON public.vip_settings;
CREATE POLICY "Anyone can read vip_settings" ON public.vip_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage vip_settings" ON public.vip_settings;
CREATE POLICY "Admins can manage vip_settings" ON public.vip_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- vip_product_rules
DROP POLICY IF EXISTS "Anyone can read vip_product_rules" ON public.vip_product_rules;
CREATE POLICY "Anyone can read vip_product_rules" ON public.vip_product_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage vip_product_rules" ON public.vip_product_rules;
CREATE POLICY "Admins can manage vip_product_rules" ON public.vip_product_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- vip_members
DROP POLICY IF EXISTS "Admins can manage vip_members" ON public.vip_members;
CREATE POLICY "Admins can manage vip_members" ON public.vip_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Public can lookup active members" ON public.vip_members;
CREATE POLICY "Public can lookup active members" ON public.vip_members FOR SELECT USING (is_active = true);

-- vip_special_dates
DROP POLICY IF EXISTS "Admins can manage vip_special_dates" ON public.vip_special_dates;
CREATE POLICY "Admins can manage vip_special_dates" ON public.vip_special_dates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Public can read special dates" ON public.vip_special_dates;
CREATE POLICY "Public can read special dates" ON public.vip_special_dates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can insert special dates" ON public.vip_special_dates;
CREATE POLICY "Public can insert special dates" ON public.vip_special_dates FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update special dates" ON public.vip_special_dates;
CREATE POLICY "Public can update special dates" ON public.vip_special_dates FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public can delete special dates" ON public.vip_special_dates;
CREATE POLICY "Public can delete special dates" ON public.vip_special_dates FOR DELETE USING (true);

-- vip_login_attempts
DROP POLICY IF EXISTS "Public can insert login attempts" ON public.vip_login_attempts;
CREATE POLICY "Public can insert login attempts" ON public.vip_login_attempts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can read login attempts" ON public.vip_login_attempts;
CREATE POLICY "Admins can read login attempts" ON public.vip_login_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 9: Triggers
CREATE OR REPLACE FUNCTION public.update_vip_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_vip_members_updated_at ON public.vip_members;
CREATE TRIGGER update_vip_members_updated_at BEFORE UPDATE ON public.vip_members
  FOR EACH ROW EXECUTE FUNCTION public.update_vip_updated_at();
DROP TRIGGER IF EXISTS update_vip_settings_updated_at ON public.vip_settings;
CREATE TRIGGER update_vip_settings_updated_at BEFORE UPDATE ON public.vip_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_vip_updated_at();

-- Step 10: Rate limit check function
CREATE OR REPLACE FUNCTION public.check_vip_rate_limit(p_phone TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT (SELECT COUNT(*) FROM public.vip_login_attempts
    WHERE phone_key = p_phone AND attempted_at > now() - interval '15 minutes') < 5;
$$;

-- Step 11: Seed default settings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vip_settings'
      AND column_name = 'key'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vip_settings'
      AND column_name = 'value'
  ) THEN
    INSERT INTO public.vip_settings (key, value) VALUES
      ('teaser_message', 'גישה בלעדית ללקוחות DiamoNY... רכשו את התכשיט הראשון שלכם וקבלו מפתח גישה.'),
      ('welcome_message', 'ברוכים הבאים לכספת – המועדון הבלעדי של DiamoNY'),
      ('lounge_title', 'הטרקלין'),
      ('theme_accent_color', '#A68966'),
      ('theme_bg_color', '#F9F7F2')
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;
