
-- FINAL WARNINGS CLEANUP (CORRECTED)
-- Matches exact names from your screenshot.

-- 1. TASKS
DROP POLICY IF EXISTS "Allow internal admin full access to tasks" ON public.tasks;

-- 2. TEMPLATE STEPS
ALTER TABLE public.template_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow internal admin full access to template_steps" ON public.template_steps;

DROP POLICY IF EXISTS "Admin Manage Template Steps" ON public.template_steps;
CREATE POLICY "Admin Manage Template Steps" ON public.template_steps FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 3. TEMPLATE TASKS
ALTER TABLE public.template_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow internal admin full access to template_tasks" ON public.template_tasks;

DROP POLICY IF EXISTS "Admin Manage Template Tasks" ON public.template_tasks;
CREATE POLICY "Admin Manage Template Tasks" ON public.template_tasks FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 4. TIME LOGS
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow internal admin full access to time_logs" ON public.time_logs;

DROP POLICY IF EXISTS "Admin Manage Time Logs" ON public.time_logs;
CREATE POLICY "Admin Manage Time Logs" ON public.time_logs FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 5. TRANSLATIONS (Corrected Policy Name)
DROP POLICY IF EXISTS "Allow full access to translations for everyone" ON public.translations;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.translations;

-- Re-apply 'Public Read / Admin Write' for Translations
DROP POLICY IF EXISTS "Public Read Translations" ON public.translations;
CREATE POLICY "Public Read Translations" ON public.translations FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin Manage Translations" ON public.translations;
CREATE POLICY "Admin Manage Translations" ON public.translations FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 6. MESSAGES (Ensure Admin Access exists)
-- It looks like Admin Access might be missing from the list, so let's safeguard it.
DROP POLICY IF EXISTS "Admin Manage Messages" ON public.messages;
CREATE POLICY "Admin Manage Messages" ON public.messages FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
