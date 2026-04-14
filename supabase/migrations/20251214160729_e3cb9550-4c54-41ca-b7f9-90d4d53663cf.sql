-- Add video_url column to homepage_sections table
ALTER TABLE public.homepage_sections 
ADD COLUMN video_url TEXT;