-- Fix Storage Permissions for Project Files
-- Run this to allow admins to upload/delete files in the 'project-files' bucket.

-- 1. Create the bucket if it doesn't exist (Public = true)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop specific existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow authenticated upload project-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read project-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete project-files" ON storage.objects;

-- 3. Create Policies for 'project-files'

-- INSERT: Allow ONLY Authenticated users (Admins) to upload
CREATE POLICY "Allow authenticated upload project-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- UPDATE: Allow Authenticated users to update (overwrite)
CREATE POLICY "Allow authenticated update project-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files');

-- DELETE: Allow ONLY Authenticated users (Admins) to delete
CREATE POLICY "Allow authenticated delete project-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');

-- SELECT: Allow Public Read (so links work easily)
CREATE POLICY "Allow public read project-files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'project-files');
