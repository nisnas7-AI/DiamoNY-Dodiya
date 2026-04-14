-- Add is_pearl_jewelry boolean field
ALTER TABLE public.products 
ADD COLUMN is_pearl_jewelry boolean DEFAULT false;

-- Add search_tags array field for enhanced search
ALTER TABLE public.products 
ADD COLUMN search_tags text[] DEFAULT '{}';

-- Create index for efficient filtering
CREATE INDEX idx_products_is_pearl_jewelry 
ON public.products(is_pearl_jewelry) 
WHERE is_pearl_jewelry = true;