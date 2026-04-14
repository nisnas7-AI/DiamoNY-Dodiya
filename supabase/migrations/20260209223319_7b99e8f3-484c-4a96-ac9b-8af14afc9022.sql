
-- Add new columns to vip_users
ALTER TABLE public.vip_users
  ADD COLUMN IF NOT EXISTS total_spend numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_email_sent timestamp with time zone,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS anniversary date;

-- Create admin_notes table
CREATE TABLE public.admin_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.vip_users(id) ON DELETE CASCADE,
  note_content text NOT NULL,
  admin_name text NOT NULL DEFAULT 'Admin',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can manage admin notes
CREATE POLICY "Admins can manage admin notes"
  ON public.admin_notes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
