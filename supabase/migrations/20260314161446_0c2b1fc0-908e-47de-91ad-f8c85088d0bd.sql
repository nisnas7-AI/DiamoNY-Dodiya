
-- Add is_updating_soon column to categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_updating_soon boolean NOT NULL DEFAULT false;

-- Create trigger function: auto-toggle is_updating_soon to false
-- when a published+active product is added/updated in that category
CREATE OR REPLACE FUNCTION public.auto_clear_updating_soon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _category_id uuid;
  _active_count integer;
BEGIN
  -- Determine the relevant category_id
  _category_id := COALESCE(NEW.category_id, OLD.category_id);
  
  IF _category_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count published + active products in this category
  SELECT COUNT(*) INTO _active_count
  FROM public.products
  WHERE category_id = _category_id
    AND is_active = true
    AND published_at IS NOT NULL;

  -- If at least one active+published product exists, clear the flag
  IF _active_count >= 1 THEN
    UPDATE public.categories
    SET is_updating_soon = false
    WHERE id = _category_id
      AND is_updating_soon = true;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on products table
CREATE TRIGGER trg_auto_clear_updating_soon
AFTER INSERT OR UPDATE OF is_active, category_id, published_at
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.auto_clear_updating_soon();

-- Enable realtime for categories table
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
