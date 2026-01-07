-- Add Folder Support to Documents Table

-- 1. Add new columns
ALTER TABLE documents 
ADD COLUMN is_folder BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_id UUID REFERENCES documents(id) ON DELETE CASCADE,
ADD COLUMN name TEXT;

-- 2. Migrate existing display names from file_url (optional but helpful)
-- Only for existing rows where name is null
UPDATE documents 
SET name = substring(file_url from '[^/]+$') 
WHERE name IS NULL AND file_url IS NOT NULL;
