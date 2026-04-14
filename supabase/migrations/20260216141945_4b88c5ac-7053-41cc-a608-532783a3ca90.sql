
-- Add per-category layout storage to admin_dashboard_preferences
ALTER TABLE public.admin_dashboard_preferences
ADD COLUMN IF NOT EXISTS category_layouts jsonb NOT NULL DEFAULT '{}'::jsonb;

-- category_layouts structure:
-- {
--   "dashboard": { "widget_order": ["leads","blog",...], "hidden_widgets": ["..."] },
--   "vip": { "widget_order": [...], "hidden_widgets": [...] },
--   "content": { ... },
--   ...
-- }
-- The existing widget_order/hidden_widgets columns serve as fallback for the "dashboard" category.
