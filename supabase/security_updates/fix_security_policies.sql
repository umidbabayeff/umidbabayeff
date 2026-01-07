
-- Enable RLS for all public tables that have it disabled
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- 1. Services: Public Read, Admin Write
DROP POLICY IF EXISTS "Enable read access for all users" ON public.services;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.services;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.services;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.services;

CREATE POLICY "Public Read Services" ON public.services FOR SELECT TO public USING (true);
CREATE POLICY "Admin All Services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Technologies: Public Read, Admin Write
DROP POLICY IF EXISTS "Enable read access for all users" ON public.technologies;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.technologies;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.technologies;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.technologies;

CREATE POLICY "Public Read Technologies" ON public.technologies FOR SELECT TO public USING (true);
CREATE POLICY "Admin All Technologies" ON public.technologies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. FAQs: Public Read, Admin Write
DROP POLICY IF EXISTS "Enable read access for all users" ON public.faqs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.faqs;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.faqs;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.faqs;

CREATE POLICY "Public Read FAQs" ON public.faqs FOR SELECT TO public USING (true);
CREATE POLICY "Admin All FAQs" ON public.faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Clarify "Always True" policies for other tables
-- The warnings "RLS Policy Always True" often come from `USING (true)`.
-- By scoping them TO authenticated, we make them safer and explicit.

-- Benefits
DROP POLICY IF EXISTS "Enable read access for all users" ON public.benefits;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.benefits;
CREATE POLICY "Public Read Benefits" ON public.benefits FOR SELECT TO public USING (true);
CREATE POLICY "Admin All Benefits" ON public.benefits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Career Applications (Should probably NOT be public read, strictly speaking, but depends on usage. Assuming admin only read, public write?)
-- Actually, public needs to WRITE (submit application) but NOT READ (privacy).
DROP POLICY IF EXISTS "Enable all access for all users" ON public.career_applications;
CREATE POLICY "Public Submit Applications" ON public.career_applications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin Manage Applications" ON public.career_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Documents (Usually Admin only)
DROP POLICY IF EXISTS "Enable all access for all users" ON public.documents;
CREATE POLICY "Admin Manage Documents" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Clients (Admin only)
DROP POLICY IF EXISTS "Enable all access for all users" ON public.clients;
CREATE POLICY "Admin Manage Clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bot Messages (Usually Admin only or System)
DROP POLICY IF EXISTS "Enable all access for all users" ON public.bot_messages;
CREATE POLICY "Admin Manage Bot Messages" ON public.bot_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
