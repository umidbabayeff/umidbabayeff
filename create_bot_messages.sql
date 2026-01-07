-- Create bot_messages table (no RLS for simplicity as per quick demo, or public read/write for now)
-- In a real app, strict RLS based on user_id or session_id is needed.
-- For now, we'll allow public access to facilitate the demo without auth requirements if the user is a guest.

create table if not exists public.bot_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id), -- Nullable for guests
  session_id text, -- To track guest conversations
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.bot_messages enable row level security;

-- Policy: Allow anonymous/public access for now (or strictly bound to session_id if implemented)
-- Ideally:
-- create policy "Allow public insert" on bot_messages for insert with check (true);
-- create policy "Allow public select" on bot_messages for select using (true);
-- For this task, let's open it up to verify it works easily.

create policy "Enable read access for all users" on public.bot_messages for select using (true);
create policy "Enable insert access for all users" on public.bot_messages for insert with check (true);
