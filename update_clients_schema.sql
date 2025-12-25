-- Add new columns to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_contact_date date;

-- Update status check constraint to include 'paused'
-- Note: 'lead', 'active', 'archived' are already there. We just need to ensure 'paused' is allowed.
-- Postgres doesn't easily allow altering a check constraint text without dropping and re-adding.
-- Or if it's just a text column with a check, we can handle it.
-- Let's drop the constraint and add a new one.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_status_check') THEN
    ALTER TABLE public.clients DROP CONSTRAINT clients_status_check;
  END IF;
END $$;

ALTER TABLE public.clients ADD CONSTRAINT clients_status_check CHECK (status IN ('lead', 'active', 'paused', 'archived'));
