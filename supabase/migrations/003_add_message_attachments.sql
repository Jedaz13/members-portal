-- Migration: Add attachments support to messages
-- Run this in Supabase SQL Editor

-- 1. Add attachments column to messages table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'attachments'
    ) THEN
        ALTER TABLE messages ADD COLUMN attachments JSONB DEFAULT NULL;
    END IF;
END $$;

-- 2. Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'message-attachments',
    'message-attachments',
    true,
    20971520, -- 20MB in bytes
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                               'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                               'text/plain'];

-- 3. Set up storage policies for the bucket

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload attachments to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'message-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own attachments
CREATE POLICY "Users can read own attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'message-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (for sharing with practitioners)
CREATE POLICY "Public can read attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-attachments');

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'message-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: Run these statements one at a time if you get errors about policies already existing
-- You can also run this to check existing policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
