-- Add product_interests array to vip_members
ALTER TABLE public.vip_members 
ADD COLUMN IF NOT EXISTS product_interests text[] DEFAULT '{}'::text[];