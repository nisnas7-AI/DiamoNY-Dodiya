
-- Create reviews storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reviews', 'reviews', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read reviews" ON storage.objects
  FOR SELECT USING (bucket_id = 'reviews');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload reviews" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reviews');

-- Allow authenticated users to update/delete
CREATE POLICY "Authenticated manage reviews" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'reviews');

CREATE POLICY "Authenticated update reviews" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'reviews');
