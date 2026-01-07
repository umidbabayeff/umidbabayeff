-- RESET DOCUMENTS RLS (The "Nuclear" Option)
-- This script clears all complexity and sets a simple rule: 
-- "If you are logged in (Authenticated), you can do ANYTHING to documents."

-- 1. Enable RLS (just in case)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to ensure no conflicts
DROP POLICY IF EXISTS "Allow authenticated insert documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated update documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated delete documents" ON documents;
DROP POLICY IF EXISTS "Allow public read documents" ON documents;
DROP POLICY IF EXISTS "Enable read access for all users" ON documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON documents;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON documents;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON documents;

-- 3. Create ONE simple policy for ALL actions (Select, Insert, Update, Delete)
CREATE POLICY "Allow Full Access for Authenticated ID 1370"
ON documents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Create Public Read Policy (so links work)
CREATE POLICY "Allow Public Read 1370"
ON documents
FOR SELECT
TO anon
USING (true);

-- 5. Re-Apply Cascade Constraint (Just to be 100% sure)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'documents_parent_id_fkey' AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents DROP CONSTRAINT documents_parent_id_fkey;
    END IF;
END $$;

ALTER TABLE documents 
ADD CONSTRAINT documents_parent_id_fkey 
FOREIGN KEY (parent_id) 
REFERENCES documents(id) 
ON DELETE CASCADE;
