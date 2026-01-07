-- FINAL FIX DOCUMENTS (Standardization)
-- Reverting to standard constraints and simple RLS.

-- 1. Drop the RPC function (we are going back to standard DELETE)
DROP FUNCTION IF EXISTS delete_document_and_children(UUID);

-- 2. Reset the Foreign Key to ensure ON DELETE CASCADE is native
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_parent_id_fkey;

ALTER TABLE documents 
ADD CONSTRAINT documents_parent_id_fkey 
FOREIGN KEY (parent_id) 
REFERENCES documents(id) 
ON DELETE CASCADE;

-- 3. Reset RLS to Open/Permissive for Authenticated Users
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Full Access for Authenticated ID 1370" ON documents;
DROP POLICY IF EXISTS "Allow authenticated insert documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated update documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated delete documents" ON documents;
DROP POLICY IF EXISTS "Allow public read documents" ON documents;

-- Single Policy: Authenticated users can do EVERYTHING
CREATE POLICY "Enable All Actions for Users"
ON documents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Single Policy: Public can READ (for file downloads)
CREATE POLICY "Enable Public Read"
ON documents
FOR SELECT
TO anon
USING (true);

-- 4. Grant Table Permissions (Fixes 'permission denied' for table access)
GRANT ALL ON TABLE documents TO authenticated;
GRANT ALL ON TABLE documents TO service_role;
GRANT SELECT ON TABLE documents TO anon;
-- GRANT USAGE, SELECT ON SEQUENCE documents_id_seq TO authenticated; -- REMOVED: Table uses UUID, no sequence.

-- 5. Notify
NOTIFY pgrst, 'reload schema';
