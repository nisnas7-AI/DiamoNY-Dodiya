
-- Admin dashboard widget preferences (per admin user)
CREATE TABLE public.admin_dashboard_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  widget_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden_widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Admins can manage their own preferences
CREATE POLICY "Admins read own dashboard prefs"
  ON public.admin_dashboard_preferences
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id);

CREATE POLICY "Admins insert own dashboard prefs"
  ON public.admin_dashboard_preferences
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id);

CREATE POLICY "Admins update own dashboard prefs"
  ON public.admin_dashboard_preferences
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER update_admin_dashboard_prefs_updated_at
  BEFORE UPDATE ON public.admin_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vip_updated_at();
