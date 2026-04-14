-- Add product_id and display_name columns to media table
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add index for product lookups
CREATE INDEX IF NOT EXISTS idx_media_product_id ON public.media(product_id);

-- Create function to sync media display names when product name/sku changes
CREATE OR REPLACE FUNCTION public.sync_media_display_names()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.media
  SET display_name = CASE 
    WHEN NEW.sku IS NOT NULL AND NEW.sku != '' THEN NEW.sku || ' - ' || NEW.name
    ELSE NEW.name
  END
  WHERE product_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic sync
DROP TRIGGER IF EXISTS product_name_change_sync ON public.products;
CREATE TRIGGER product_name_change_sync
AFTER UPDATE OF name, sku ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_media_display_names();

-- Add comments for documentation
COMMENT ON COLUMN public.media.product_id IS 'Links media to a product for synchronization';
COMMENT ON COLUMN public.media.display_name IS 'Auto-generated display name in format [SKU] - [Product Name]';