
ALTER TABLE public.product_stories
  ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pull_quote text,
  ADD COLUMN IF NOT EXISTS story_part_1 text,
  ADD COLUMN IF NOT EXISTS story_part_2 text,
  ADD COLUMN IF NOT EXISTS story_images jsonb DEFAULT '[]'::jsonb;
