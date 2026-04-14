-- Create product_variants table for metal/material variants
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL DEFAULT 'gold_type',
  variant_value TEXT NOT NULL,
  sku TEXT,
  is_available BOOLEAN DEFAULT true,
  price_modifier NUMERIC DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_type, variant_value)
);

-- Create product_variant_images table for variant-specific images
CREATE TABLE public.product_variant_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variants
CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product variants" 
ON public.product_variants 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for product_variant_images
CREATE POLICY "Product variant images are viewable by everyone" 
ON public.product_variant_images 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product variant images" 
ON public.product_variant_images 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();