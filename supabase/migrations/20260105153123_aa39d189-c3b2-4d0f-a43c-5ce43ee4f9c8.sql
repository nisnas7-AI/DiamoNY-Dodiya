-- Add google_review_url field to testimonials table
ALTER TABLE public.testimonials 
ADD COLUMN google_review_url text;