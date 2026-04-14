
-- Add VIP-specific columns to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS vip_discount_percentage numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_vip_exclusive boolean DEFAULT false;

-- Create vip-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vip-assets', 'vip-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads on vip-assets bucket
CREATE POLICY "Public can view vip assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'vip-assets');

-- Allow authenticated users (admins) to upload vip assets
CREATE POLICY "Authenticated users can upload vip assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vip-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to update vip assets
CREATE POLICY "Authenticated users can update vip assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vip-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete vip assets
CREATE POLICY "Authenticated users can delete vip assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'vip-assets' AND auth.role() = 'authenticated');
