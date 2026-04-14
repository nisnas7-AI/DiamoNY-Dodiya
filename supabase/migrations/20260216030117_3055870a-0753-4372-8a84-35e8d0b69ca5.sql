
-- Create leads table with all columns the edge function expects
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  closure_status TEXT DEFAULT 'open',
  consent_privacy_policy BOOLEAN DEFAULT false,
  consent_privacy_timestamp TIMESTAMPTZ,
  consent_marketing_timestamp TIMESTAMPTZ,
  ip_address TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  referral_source TEXT,
  landing_page TEXT,
  jewelry_interest_type TEXT,
  estimated_budget TEXT,
  metal_preference TEXT,
  ring_size TEXT,
  event_target_date TEXT,
  source TEXT DEFAULT 'contact_form',
  form_completed_at TIMESTAMPTZ,
  conversation_summary TEXT,
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public can insert leads (protected by edge function validation, reCAPTCHA, honeypot)
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
CREATE POLICY "Public can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Only admins can read leads
DROP POLICY IF EXISTS "Admins can read leads" ON public.leads;
CREATE POLICY "Admins can read leads"
  ON public.leads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update leads
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete leads
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Rate limiting function for leads
CREATE OR REPLACE FUNCTION public.validate_lead_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Rate limit: max 5 leads per hour per email
  IF (SELECT COUNT(*) FROM public.leads 
      WHERE email = NEW.email 
      AND created_at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded for this email';
  END IF;
  
  -- Sanitize: enforce max lengths
  NEW.name := LEFT(NEW.name, 100);
  NEW.email := LEFT(NEW.email, 255);
  NEW.phone := LEFT(NEW.phone, 20);
  NEW.message := LEFT(NEW.message, 2000);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS validate_lead_insert_trigger ON public.leads;
CREATE TRIGGER validate_lead_insert_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_insert();

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vip_updated_at();
