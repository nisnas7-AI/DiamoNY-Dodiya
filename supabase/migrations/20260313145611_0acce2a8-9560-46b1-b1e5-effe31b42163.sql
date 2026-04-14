
-- Add customer_notes and customer_grade to custom_orders
ALTER TABLE public.custom_orders
  ADD COLUMN IF NOT EXISTS customer_notes text,
  ADD COLUMN IF NOT EXISTS customer_grade text;

-- Expected costs table
CREATE TABLE public.order_expected_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  gold_cost numeric NOT NULL DEFAULT 0,
  labor_cost numeric NOT NULL DEFAULT 0,
  stone_setting_cost numeric NOT NULL DEFAULT 0,
  contingencies numeric NOT NULL DEFAULT 0,
  final_quoted_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE public.order_expected_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage expected costs" ON public.order_expected_costs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Actual costs table (per-stage entries)
CREATE TABLE public.order_actual_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'general',
  gold_cost numeric NOT NULL DEFAULT 0,
  labor_cost numeric NOT NULL DEFAULT 0,
  setting_cost numeric NOT NULL DEFAULT 0,
  extras numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_actual_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage actual costs" ON public.order_actual_costs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
