
-- KILL THE ROGUE POLICY
-- This is the specific rule that was leaking your data.

DROP POLICY IF EXISTS "Allow internal admin full access to clients" ON public.clients;

-- Verification: After running this, the only policy left should be "Admin Manage Clients".
