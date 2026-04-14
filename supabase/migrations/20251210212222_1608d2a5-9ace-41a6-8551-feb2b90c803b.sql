-- Add category_id to media table for category association
ALTER TABLE public.media 
ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for faster category filtering
CREATE INDEX idx_media_category_id ON public.media(category_id);