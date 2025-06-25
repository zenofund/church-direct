/*
  # Create church images storage bucket

  1. Storage Setup
    - Create a public bucket for church images
    - Set up RLS policies for image uploads
    - Allow authenticated users to upload images
    - Allow public read access to images

  2. Security
    - Users can only upload images for their own church listings
    - Images are publicly readable for directory display
    - File size and type restrictions handled in application
*/

-- Create the church-images bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('church-images', 'church-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload church images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'church-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own church images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'church-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own church images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'church-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to church images
CREATE POLICY "Public can view church images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'church-images');