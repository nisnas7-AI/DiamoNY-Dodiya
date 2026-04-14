-- Add product_link column to testimonials table for conversion tracking
ALTER TABLE public.testimonials 
ADD COLUMN product_link TEXT;