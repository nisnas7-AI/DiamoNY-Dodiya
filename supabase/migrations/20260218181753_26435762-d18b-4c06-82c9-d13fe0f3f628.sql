
-- Personalized concierge offers from admin to VIP members
CREATE TABLE public.vip_personalized_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.vip_members(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  heading text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vip_personalized_offers ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage personalized offers"
  ON public.vip_personalized_offers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public read (for VIP login flow - filtered by member_id in app)
CREATE POLICY "Public can read personalized offers"
  ON public.vip_personalized_offers FOR SELECT
  USING (true);

-- Public can mark as read
CREATE POLICY "Public can update is_read on offers"
  ON public.vip_personalized_offers FOR UPDATE
  USING (true);
