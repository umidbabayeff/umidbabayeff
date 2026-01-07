-- Fix RPC Permissions
-- Explicitly grant execute permission to the authenticated role.
-- Sometimes creating a function doesn't automatically grant access to it in Supabase API.

GRANT EXECUTE ON FUNCTION delete_document_and_children(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_document_and_children(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION delete_document_and_children(UUID) TO anon; 

-- Log that we ran this (optional, just ensuring the script runs)
NOTIFY pgrst, 'permissions updated';
