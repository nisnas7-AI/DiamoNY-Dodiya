
-- Fix security definer view warning
CREATE OR REPLACE VIEW public.social_settings_public
WITH (security_invoker = true)
AS
  SELECT
    id,
    platform,
    is_enabled,
    config - 'access_token' AS config,
    created_at,
    updated_at
  FROM public.social_settings;
