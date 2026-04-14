-- Create robots_txt_history table for version control
CREATE TABLE public.robots_txt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  note TEXT
);

-- Enable RLS
ALTER TABLE public.robots_txt_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only admins can access
CREATE POLICY "Admins can manage robots history"
  ON public.robots_txt_history FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default robots.txt into site_settings if not exists
INSERT INTO public.site_settings (key, value) 
VALUES (
  'robots_txt',
  '{"content": "User-agent: Googlebot\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: Twitterbot\nAllow: /\n\nUser-agent: facebookexternalhit\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: https://diamony.lovable.app/sitemap.xml"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;