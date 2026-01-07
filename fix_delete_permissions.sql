-- Fix Delete Permissions and Cascade

-- 1. Ensure `parent_id` has ON DELETE CASCADE
-- We drop the constraint if it exists (guessing the name standard) and recreate it.
-- This ensures that when you delete a folder, its children are also deleted from the DB.

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

-- 2. Ensure DELETE Policy is active for Authenticated Users
DROP POLICY IF EXISTS "Allow authenticated delete documents" ON documents;

CREATE POLICY "Allow authenticated delete documents"
ON documents FOR DELETE
TO authenticated
USING (true);

-- 3. Ensure Storage Deletion Permissions (Bucket RLS)
-- Project files bucket
DROP POLICY IF EXISTS "Allow authenticated delete project-files" ON storage.objects;

CREATE POLICY "Allow authenticated delete project-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');
