-- Fix Storage Permissions for Career Uploads
-- Run this to allow file uploads to the 'career-uploads' bucket.

-- 1. Create the bucket if it doesn't exist (Public = true)
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-uploads', 'career-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop specific existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Give anon/auth access to career-uploads" ON storage.objects;

-- 3. Create Permissive Policies for this specific bucket
-- Allow Insert (Upload) for Anon and Authenticated
CREATE POLICY "Allow public upload"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'career-uploads');

-- Allow Select (Download/View) for Anon and Authenticated
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'career-uploads');

-- 4. Grant usage just in case
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
