
-- Create saved items table for VIP Private Collection
CREATE TABLE public.vip_saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.vip_members(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, product_id)
);

-- Enable RLS
ALTER TABLE public.vip_saved_items ENABLE ROW LEVEL SECURITY;

-- Public can read/insert/delete their own saved items (via edge function or direct)
CREATE POLICY "Public can read saved items"
  ON public.vip_saved_items FOR SELECT
  USING (true);

CREATE POLICY "Public can insert saved items"
  ON public.vip_saved_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can delete saved items"
  ON public.vip_saved_items FOR DELETE
  USING (true);

-- Admins full access
CREATE POLICY "Admins can manage saved items"
  ON public.vip_saved_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
