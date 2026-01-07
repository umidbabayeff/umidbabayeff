-- Recursive Delete Function for Documents
-- This function handles deleting a document/folder and ALL its descendants efficiently.
-- It runs as SECURITY DEFINER, meaning it bypasses RLS for the deletion itself (assuming the user is allowed to call it).

CREATE OR REPLACE FUNCTION delete_document_and_children(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Recursive CTE to find all child document IDs
    WITH RECURSIVE doc_tree AS (
        -- Base case: the target document
        SELECT id FROM documents WHERE id = target_id
        UNION ALL
        -- Recursive step: children of items in the tree
        SELECT d.id FROM documents d
        INNER JOIN doc_tree dt ON d.parent_id = dt.id
    )
    -- Delete everything found in the tree
    DELETE FROM documents
    WHERE id IN (SELECT id FROM doc_tree);
END;
$$;
