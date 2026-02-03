-- Storage bucket for pin images
-- Created: 2026-02-02

-- Create the pin-images bucket (if storage extension available)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pin-images',
  'pin-images',
  true,  -- public bucket for image URLs
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pin-images bucket
CREATE POLICY "Anyone can view pin images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pin-images');

CREATE POLICY "Authenticated users can upload pin images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pin-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own pin images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
