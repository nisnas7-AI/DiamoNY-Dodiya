-- Drop old check constraint and replace with one matching pipeline stages
ALTER TABLE public.custom_orders DROP CONSTRAINT custom_orders_status_check;

ALTER TABLE public.custom_orders ADD CONSTRAINT custom_orders_status_check
  CHECK (status = ANY (ARRAY[
    'consultation'::text,
    '3d_approval'::text,
    'production'::text,
    'qa'::text,
    'ready'::text,
    'delivered'::text,
    'cancelled'::text
  ]));
