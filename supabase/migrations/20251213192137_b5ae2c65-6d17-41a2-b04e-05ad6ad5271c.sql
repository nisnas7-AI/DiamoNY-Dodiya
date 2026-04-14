
-- Add template column to promotions table
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS banner_template TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS banner_gradient TEXT DEFAULT NULL;
