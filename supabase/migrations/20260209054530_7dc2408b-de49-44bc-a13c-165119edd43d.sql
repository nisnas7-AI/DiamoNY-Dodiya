-- =====================================================
-- SECURITY FIX: Restrict sensitive table access
-- =====================================================

-- 1. WELCOME_EMAIL_SETTINGS: Remove public access
-- Only the edge function (using service role key) needs to read this
DROP POLICY IF EXISTS "Welcome email settings are viewable by system" ON public.welcome_email_settings;

-- Create admin-only SELECT policy
CREATE POLICY "Only admins can view welcome email settings"
  ON public.welcome_email_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. SITE_SETTINGS: Create public view for non-sensitive settings only
-- First, create a view that only exposes safe settings
CREATE OR REPLACE VIEW public.site_settings_public
WITH (security_invoker=on) AS
  SELECT id, key, value, created_at, updated_at
  FROM public.site_settings
  WHERE key IN (
    'email_forms_enabled',      -- Public form toggle
    'sticky_social_bar'         -- UI toggle
    -- Intentionally excluding: gold_pricing, looker_studio_url, robots_txt
  );

-- Grant SELECT on the view
GRANT SELECT ON public.site_settings_public TO anon, authenticated;

-- Update RLS policy to restrict public SELECT to only non-sensitive keys
DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON public.site_settings;

-- Create new policy for public SELECT (only non-sensitive settings)
CREATE POLICY "Public can view non-sensitive settings"
  ON public.site_settings
  FOR SELECT
  USING (
    key IN ('email_forms_enabled', 'sticky_social_bar')
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. PRODUCT_STORIES: Create public view that hides AI prompts
CREATE OR REPLACE VIEW public.product_stories_public
WITH (security_invoker=on) AS
  SELECT 
    id, 
    title, 
    content_body, 
    category, 
    is_default, 
    created_at, 
    updated_at
    -- Intentionally excluding: ai_prompt_context
  FROM public.product_stories;

-- Grant SELECT on the view
GRANT SELECT ON public.product_stories_public TO anon, authenticated;

-- Update RLS policy - public can only see via the view (without ai_prompt_context)
DROP POLICY IF EXISTS "Product stories are viewable by everyone" ON public.product_stories;

-- Deny direct public access to base table, require admin for direct access
CREATE POLICY "Only admins can directly view product stories"
  ON public.product_stories
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. SOCIAL_SETTINGS: Create public view that hides access tokens
CREATE OR REPLACE VIEW public.social_settings_public
WITH (security_invoker=on) AS
  SELECT 
    id, 
    platform, 
    is_enabled,
    -- Extract safe config fields, removing access_token
    jsonb_build_object(
      'display_posts', COALESCE((config->>'display_posts')::int, 6),
      'post_ids', COALESCE(config->'post_ids', '[]'::jsonb),
      'video_ids', COALESCE(config->'video_ids', '[]'::jsonb),
      'url', COALESCE(config->>'url', ''),
      'phone', COALESCE(config->>'phone', ''),
      'channel_title', COALESCE(config->>'channel_title', '')
      -- Intentionally excluding: access_token
    ) as config,
    created_at, 
    updated_at
  FROM public.social_settings;

-- Grant SELECT on the view
GRANT SELECT ON public.social_settings_public TO anon, authenticated;

-- Update RLS policy - deny direct public access to base table
DROP POLICY IF EXISTS "Anyone can view social settings" ON public.social_settings;

-- Only admins can directly access base table (with access tokens)
CREATE POLICY "Only admins can directly view social settings"
  ON public.social_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));