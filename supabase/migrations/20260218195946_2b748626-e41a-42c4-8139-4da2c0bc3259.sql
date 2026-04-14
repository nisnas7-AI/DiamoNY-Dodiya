
-- Add production-specific columns to custom_orders
ALTER TABLE public.custom_orders
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ring_size text,
  ADD COLUMN IF NOT EXISTS gold_color_override text,
  ADD COLUMN IF NOT EXISTS designer_notes text;
