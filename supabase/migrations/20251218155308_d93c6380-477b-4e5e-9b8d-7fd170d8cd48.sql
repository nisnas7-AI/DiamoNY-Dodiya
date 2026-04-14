-- Add sale-related columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_on_sale boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_badge_text text DEFAULT 'מבצע!';

-- Add index for sale products query optimization
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON public.products(is_on_sale) WHERE is_on_sale = true;