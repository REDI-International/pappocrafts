-- Create a public storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated service-role uploads (handled via admin API)
CREATE POLICY "Service role upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

-- Allow service-role deletes
CREATE POLICY "Service role delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');
