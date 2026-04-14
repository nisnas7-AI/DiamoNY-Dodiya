-- Add pricing fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS gold_weight_grams numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS base_labor_markup numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_diamond_jewelry boolean DEFAULT false;

-- Add comments to clarify field usage
COMMENT ON COLUMN public.products.gold_weight_grams IS 'Gold weight in grams - ADMIN ONLY, never expose to frontend';
COMMENT ON COLUMN public.products.base_labor_markup IS 'Fixed production cost + profit markup';
COMMENT ON COLUMN public.products.is_diamond_jewelry IS 'If true, display price with "Starting from" prefix';

-- Insert global gold price setting if not exists
INSERT INTO public.site_settings (key, value)
VALUES ('gold_pricing', '{"current_gold_price_per_gram": 350, "last_updated": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;