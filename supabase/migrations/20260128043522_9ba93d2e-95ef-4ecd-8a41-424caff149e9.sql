-- Add is_engagement_ring boolean field to products table
ALTER TABLE public.products 
ADD COLUMN is_engagement_ring boolean DEFAULT false;