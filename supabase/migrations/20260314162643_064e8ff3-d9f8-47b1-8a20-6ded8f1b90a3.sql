
-- Deactivate "תליונים" from homepage categories grid
UPDATE public.homepage_categories 
SET is_active = false, updated_at = now()
WHERE id = '588e5abf-e9e1-4b6d-bb79-43b554303013';

-- Add "תליון לגבר" to homepage categories grid at position 3
INSERT INTO public.homepage_categories (name, name_en, category_slug, link_url, display_order, is_active)
VALUES ('תליון לגבר', 'Men''s Pendant', 'Men Pendant', '/category/mens-pendants', 3, true);

-- Ensure תליון לגבר category is NOT marked as "updating soon"
UPDATE public.categories 
SET is_updating_soon = false 
WHERE slug IN ('Men Pendant', 'תליון-לגבר');
