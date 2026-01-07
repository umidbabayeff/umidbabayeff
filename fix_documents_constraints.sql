-- Relax constraints for Folder Support
-- Folders don't have file_urls or specific file types, so we need to allow these to be NULL.

-- 1. Make file_url nullable
ALTER TABLE documents ALTER COLUMN file_url DROP NOT NULL;

-- 2. Make type nullable (or we can start storing 'folder' as type)
ALTER TABLE documents ALTER COLUMN type DROP NOT NULL;

-- 3. Ensure RLS allows INSERT/UPDATE on documents for authenticated users
-- (Dropping existing policies first to strictly avoid conflicts is safer, but 'CREATE POLICY IF NOT EXISTS' isn't standard in all Postgres versions supported by Supabase easily without a function blocks. We'll use DO blocks or just try CREATE and user can ignore "already exists".)

DROP POLICY IF EXISTS "Allow authenticated insert documents" ON documents;
CREATE POLICY "Allow authenticated insert documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update documents" ON documents;
CREATE POLICY "Allow authenticated update documents"
ON documents FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete documents" ON documents;
CREATE POLICY "Allow authenticated delete documents"
ON documents FOR DELETE
TO authenticated
USING (true);
