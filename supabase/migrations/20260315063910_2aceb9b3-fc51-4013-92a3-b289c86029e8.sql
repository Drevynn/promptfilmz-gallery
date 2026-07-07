-- Make storyboard-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'storyboard-images';

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own storyboard images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'storyboard-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own images
CREATE POLICY "Users can view own storyboard images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'storyboard-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own storyboard images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'storyboard-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own storyboard images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'storyboard-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);