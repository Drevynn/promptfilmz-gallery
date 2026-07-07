-- Create public storage bucket for storyboard frame images
INSERT INTO storage.buckets (id, name, public)
VALUES ('storyboard-images', 'storyboard-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload storyboard images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'storyboard-images');

-- Allow public read access
CREATE POLICY "Public can view storyboard images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'storyboard-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete storyboard images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'storyboard-images');