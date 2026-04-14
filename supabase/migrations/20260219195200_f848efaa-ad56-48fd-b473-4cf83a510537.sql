
-- ── Phase 4: Server-Side Analytics Aggregation RPCs ──────────────────────────

-- 1. Time-Series: returns one row per day for the last N days,
--    aggregating ALL event types. Max payload = N rows (default 30).
CREATE OR REPLACE FUNCTION public.get_analytics_time_series(days_back integer DEFAULT 30)
RETURNS TABLE(event_date date, event_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Generate a complete date spine so zero-traffic days still appear
  WITH spine AS (
    SELECT generate_series(
      (CURRENT_DATE - (days_back - 1) * INTERVAL '1 day')::date,
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date AS d
  ),
  counts AS (
    SELECT
      date_trunc('day', created_at AT TIME ZONE 'UTC')::date AS d,
      COUNT(*) AS n
    FROM public.analytics_events
    WHERE created_at >= (CURRENT_DATE - (days_back - 1) * INTERVAL '1 day')
    GROUP BY 1
  )
  SELECT
    spine.d   AS event_date,
    COALESCE(counts.n, 0) AS event_count
  FROM spine
  LEFT JOIN counts USING (d)
  ORDER BY spine.d ASC;
$$;

-- 2. Device Distribution: returns one row per device type with its count.
--    Payload is always tiny (2-4 rows).
CREATE OR REPLACE FUNCTION public.get_analytics_device_distribution()
RETURNS TABLE(device_type text, device_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(device_type, 'Desktop') AS device_type,
    COUNT(*) AS device_count
  FROM public.analytics_events
  WHERE device_type IS NOT NULL
  GROUP BY 1
  ORDER BY 2 DESC;
$$;

-- Grant execute to the anon role so the dashboard (anon key) can call them.
-- Admin RLS on the underlying table still restricts direct reads.
GRANT EXECUTE ON FUNCTION public.get_analytics_time_series(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_device_distribution() TO anon, authenticated;
