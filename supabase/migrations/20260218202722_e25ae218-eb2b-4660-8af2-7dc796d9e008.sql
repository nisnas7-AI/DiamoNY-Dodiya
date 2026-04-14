
ALTER TABLE public.custom_orders
  ALTER COLUMN customer_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_email text;
