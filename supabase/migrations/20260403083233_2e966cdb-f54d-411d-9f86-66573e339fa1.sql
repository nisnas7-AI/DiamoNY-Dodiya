
CREATE OR REPLACE FUNCTION public.get_category_product_counts()
RETURNS TABLE(category_slug text, product_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH parent_cats AS (
    SELECT id, slug
    FROM public.categories
    WHERE is_active = true AND parent_id IS NULL
  ),
  child_cats AS (
    SELECT c.id, p.slug AS parent_slug
    FROM public.categories c
    JOIN parent_cats p ON c.parent_id = p.id
    WHERE c.is_active = true
  ),
  all_mappings AS (
    SELECT id, slug AS parent_slug FROM parent_cats
    UNION ALL
    SELECT id, parent_slug FROM child_cats
  )
  SELECT
    m.parent_slug AS category_slug,
    COUNT(pr.id) AS product_count
  FROM all_mappings m
  LEFT JOIN public.products pr ON pr.category_id = m.id AND pr.is_active = true
  GROUP BY m.parent_slug;
$$;
