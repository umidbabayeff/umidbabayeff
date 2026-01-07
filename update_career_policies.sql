-- Update RLS policies to allow admins to insert test applications and view all data

-- 1. Allow authenticated users (Admins) to INSERT applications (useful for testing)
DROP POLICY IF EXISTS "Allow public insert" ON career_applications;
CREATE POLICY "Allow public and admin insert" 
ON career_applications 
FOR INSERT 
TO public -- 'public' includes both anon and authenticated roles
WITH CHECK (true);

-- 2. Ensure Storage Policies allow authenticated users to upload/read too
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
CREATE POLICY "Allow public and admin upload" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'career-uploads');

DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
CREATE POLICY "Allow public and admin read" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'career-uploads');

-- 3. Verify Select Policy (Ensure admins can see everything)
DROP POLICY IF EXISTS "Allow authenticated view" ON career_applications;
CREATE POLICY "Allow authenticated view" 
ON career_applications 
FOR SELECT 
TO authenticated 
USING (true);
