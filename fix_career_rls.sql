-- Fix RLS Policies for Career Applications (v2)
-- Run this script in your Supabase SQL Editor.
-- This version enables INSERT and UPDATE for candidates (anon) to allow the 2-step application process.

-- 1. Enable RLS
ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;

-- 2. Drop all previous conflicting policies to start fresh
DROP POLICY IF EXISTS "Allow public insert" ON career_applications;
DROP POLICY IF EXISTS "Allow authenticated view" ON career_applications;
DROP POLICY IF EXISTS "Allow authenticated update" ON career_applications;
DROP POLICY IF EXISTS "Enable read/write for authenticated users only" ON career_applications;
DROP POLICY IF EXISTS "Allow public update" ON career_applications;

-- 3. Create Policies

-- INSERT: Allow EVERYONE (anon + authenticated) to submit the initial form.
-- We include 'authenticated' so admins can test the form too without errors.
CREATE POLICY "Allow public insert"
ON career_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- UPDATE: Allow EVERYONE (anon) to update their application (e.g. adding task file).
-- Security Note: Since 'anon' cannot SELECT (list) records, they can only update if they know the exact UUID.
CREATE POLICY "Allow public update"
ON career_applications
FOR UPDATE
TO anon, authenticated
USING (true);

-- SELECT: Allow ONLY ADMINS (authenticated) to view applications.
-- Candidates do NOT need to view the list.
CREATE POLICY "Allow authenticated view"
ON career_applications
FOR SELECT
TO authenticated
USING (true);

-- 4. Grant Permissions
GRANT INSERT, UPDATE ON career_applications TO anon, authenticated;
GRANT SELECT, DELETE ON career_applications TO authenticated;

-- 5. Storage Policies (Ensure public upload/read works)
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
CREATE POLICY "Allow public upload"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'career-uploads');

DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'career-uploads');
