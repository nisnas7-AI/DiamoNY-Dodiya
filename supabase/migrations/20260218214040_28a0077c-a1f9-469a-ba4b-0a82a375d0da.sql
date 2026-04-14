
-- Create analytics events table for tracking category views, WhatsApp clicks, etc.
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  event_value text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (public tracking)
CREATE POLICY "Public can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read analytics events"
  ON public.analytics_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete analytics
CREATE POLICY "Admins can delete analytics events"
  ON public.analytics_events FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast aggregation queries
CREATE INDEX idx_analytics_events_type ON public.analytics_events (event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at);
