-- Add external_url column for external product links
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS external_url text;

-- Add ai_status column for tracking AI processing status
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS ai_status text;