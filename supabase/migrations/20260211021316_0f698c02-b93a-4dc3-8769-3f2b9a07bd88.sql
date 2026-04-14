
-- This migration is optional in environments where the legacy deals module
-- is not present. Keep it safe by guarding all statements.
DO $$
BEGIN
  IF to_regclass('public.deals') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS client_feedback text';
  END IF;
END $$;

-- Create RPCs even when legacy tables are absent in new environments.
-- Queries are validated lazily for this migration to avoid hard failure.
SET check_function_bodies = off;

-- RPC: Public read-only deal preview (limited fields)
CREATE OR REPLACE FUNCTION public.public_get_deal_preview(p_deal_id uuid)
RETURNS TABLE(id uuid, title text, stone_details jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.title, d.stone_details
  FROM public.deals d
  WHERE d.id = p_deal_id;
END;
$$;

RESET check_function_bodies;

-- RPC: Public read-only design assets for a deal
CREATE OR REPLACE FUNCTION public.public_get_deal_designs(p_deal_id uuid)
RETURNS TABLE(id uuid, file_url text, notes text, client_approved boolean, version_number integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT da.id, da.file_url, da.notes, da.client_approved, da.version_number
  FROM public.design_assets da
  WHERE da.deal_id = p_deal_id
  ORDER BY da.version_number ASC;
END;
$$;

-- RPC: Public approve all designs + move deal to production
CREATE OR REPLACE FUNCTION public.public_approve_deal(p_deal_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.design_assets SET client_approved = true, approval_date = now()
  WHERE deal_id = p_deal_id;

  UPDATE public.deals SET current_stage = 'production'
  WHERE id = p_deal_id;
END;
$$;

-- RPC: Public submit client feedback
CREATE OR REPLACE FUNCTION public.public_submit_deal_feedback(p_deal_id uuid, p_feedback text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF p_feedback IS NULL OR LENGTH(TRIM(p_feedback)) < 5 THEN
    RAISE EXCEPTION 'Feedback must be at least 5 characters';
  END IF;

  UPDATE public.deals SET client_feedback = p_feedback, current_stage = 'approval'
  WHERE id = p_deal_id;
END;
$$;
