
-- FINAL CLEANUP SCRIPT
-- This removes all the "Leftover" permissive policies shown in your screenshots.

-- 1. CLEANUP BENEFITS (Remove Public Write/Update/Delete)
DROP POLICY IF EXISTS "Enable delete for all users" ON public.benefits;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.benefits;
DROP POLICY IF EXISTS "Enable update for all users" ON public.benefits;

-- 2. CLEANUP BOT MESSAGES (Remove Public Access)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bot_messages;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.bot_messages;

-- 3. CLEANUP CAREER APPLICATIONS (Remove Duplicate)
DROP POLICY IF EXISTS "Allow public insert" ON public.career_applications;

-- 4. CLEANUP DOCUMENTS (Remove Public/Anon Access & Duplicates)
DROP POLICY IF EXISTS "Allow internal admin full access to documents" ON public.documents;
DROP POLICY IF EXISTS "Allow Public Read 1370" ON public.documents;
DROP POLICY IF EXISTS "Enable All Actions for Users" ON public.documents;
DROP POLICY IF EXISTS "Enable Public Read" ON public.documents;

-- Note: The "Good" policies we created (like "Admin Manage Documents") will stay. 
-- This just removes the bad ones.
