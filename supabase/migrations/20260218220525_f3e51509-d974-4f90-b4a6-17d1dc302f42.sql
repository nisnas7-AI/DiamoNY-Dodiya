
-- Add new columns to analytics_events
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_device ON public.analytics_events (device_type);
