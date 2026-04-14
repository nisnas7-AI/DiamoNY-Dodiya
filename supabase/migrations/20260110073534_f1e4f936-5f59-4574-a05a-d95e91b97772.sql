-- Add is_default column to product_stories table for global/default story functionality
ALTER TABLE public.product_stories 
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.product_stories.is_default IS 'When true, this story is automatically assigned to new products in matching category';

-- Create index for faster default story lookups
CREATE INDEX IF NOT EXISTS idx_product_stories_default ON public.product_stories(is_default) WHERE is_default = true;