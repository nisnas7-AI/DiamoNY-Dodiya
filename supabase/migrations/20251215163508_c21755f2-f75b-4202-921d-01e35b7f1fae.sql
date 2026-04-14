-- Add font_size column to section settings
ALTER TABLE public.homepage_section_settings 
ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 14;