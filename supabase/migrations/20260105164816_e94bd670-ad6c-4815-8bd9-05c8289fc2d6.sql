-- Create social_settings table for Instagram and YouTube configuration
CREATE TABLE public.social_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - admin only can modify, public can read
CREATE POLICY "Anyone can view social settings" 
ON public.social_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage social settings" 
ON public.social_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_settings_updated_at
BEFORE UPDATE ON public.social_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default records for Instagram and YouTube
INSERT INTO public.social_settings (platform, is_enabled, config) VALUES
('instagram', false, '{"username": "", "access_token": "", "posts": []}'),
('youtube', false, '{"channel_url": "", "featured_video_id": "", "video_ids": []}');