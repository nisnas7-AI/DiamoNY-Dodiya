-- Add published_at (display date) to testimonials table
ALTER TABLE public.testimonials 
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add published_at (display date) to products table
ALTER TABLE public.products 
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing records to use created_at as initial published_at
UPDATE public.testimonials SET published_at = created_at WHERE published_at IS NULL;
UPDATE public.products SET published_at = created_at WHERE published_at IS NULL;

-- Add comment to clarify field purposes
COMMENT ON COLUMN public.testimonials.published_at IS 'Public display date - editable by admin';
COMMENT ON COLUMN public.testimonials.created_at IS 'System timestamp - immutable';
COMMENT ON COLUMN public.products.published_at IS 'Public display date - editable by admin';
COMMENT ON COLUMN public.products.created_at IS 'System timestamp - immutable';