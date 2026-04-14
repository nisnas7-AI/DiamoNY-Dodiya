-- Add is_gold_linked column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_gold_linked BOOLEAN DEFAULT true;

-- Update existing gold_pricing settings with new structure for multi-metal support
UPDATE public.site_settings 
SET value = jsonb_build_object(
  'gold_14k_previous', COALESCE((value->>'previous_gold_price')::numeric, 0),
  'gold_14k_multiplier', 12,
  'gold_14k_last_updated', value->>'last_updated',
  'gold_18k_previous', COALESCE((value->>'previous_gold_price')::numeric, 0),
  'gold_18k_multiplier', COALESCE((value->>'gold_multiplier')::numeric, 15),
  'gold_18k_last_updated', value->>'last_updated',
  'platinum_previous', 0,
  'platinum_multiplier', 18,
  'platinum_last_updated', NULL,
  'spot_api_key', NULL,
  'spot_api_provider', 'goldapi'
),
updated_at = now()
WHERE key = 'gold_pricing';