-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Clients Table
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  company text,
  status text check (status in ('lead', 'active', 'archived')) default 'lead',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Projects Table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  type text,
  status text check (status in ('draft', 'active', 'paused', 'completed')) default 'draft',
  start_date date,
  deadline date,
  price numeric(10, 2), -- Store price with cents support
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Steps Table
create table public.steps (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  "order" integer not null default 0,
  status text check (status in ('not_started', 'active', 'done')) default 'not_started',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tasks Table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  step_id uuid references public.steps(id) on delete set null,
  title text not null,
  description text,
  status text check (status in ('todo', 'in_progress', 'review', 'done')) default 'todo',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  scheduled_date date,
  start_time time without time zone,
  end_time time without time zone,
  completed_at timestamp with time zone, -- New column for Daily Review
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Time Logs Table
create table public.time_logs (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade,
  start_at timestamp with time zone default now(),
  end_at timestamp with time zone,
  duration integer, -- Duration in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Documents Table
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  type text not null, -- e.g., 'invoice', 'contract', 'mockup'
  file_url text not null,
  status text, -- e.g., 'draft', 'signed', 'approved'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Simple "allow all" for internal tool convenience, or stick to authenticated users)
-- Since it's for ONE admin user who is likely authenticated, we can allow full access to authenticated users.

alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.steps enable row level security;
alter table public.tasks enable row level security;
alter table public.time_logs enable row level security;
alter table public.documents enable row level security;

-- Policy: Allow full access to all authenticated users (The Admin)
create policy "Allow internal admin full access to clients" on public.clients for all using (true) with check (true);
create policy "Allow internal admin full access to projects" on public.projects for all using (true) with check (true);
create policy "Allow internal admin full access to steps" on public.steps for all using (true) with check (true);
create policy "Allow internal admin full access to tasks" on public.tasks for all using (true) with check (true);
create policy "Allow internal admin full access to time_logs" on public.time_logs for all using (true) with check (true);
create policy "Allow internal admin full access to documents" on public.documents for all using (true) with check (true);

-- Indexes for performance
create index idx_projects_client_id on public.projects(client_id);
create index idx_steps_project_id on public.steps(project_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_step_id on public.tasks(step_id);
create index idx_time_logs_task_id on public.time_logs(task_id);
create index idx_documents_project_id on public.documents(project_id);

-- 7. Project Templates System
create table public.project_templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.template_steps (
  id uuid default uuid_generate_v4() primary key,
  template_id uuid references public.project_templates(id) on delete cascade,
  title text not null,
  "order" integer not null default 0
);

create table public.template_tasks (
  id uuid default uuid_generate_v4() primary key,
  template_step_id uuid references public.template_steps(id) on delete cascade,
  title text not null,
  description text,
  priority text default 'medium'
);

-- RLS for Templates
alter table public.project_templates enable row level security;
alter table public.template_steps enable row level security;
alter table public.template_tasks enable row level security;

create policy "Allow internal admin full access to project_templates" on public.project_templates for all using (true) with check (true);
create policy "Allow internal admin full access to template_steps" on public.template_steps for all using (true) with check (true);
create policy "Allow internal admin full access to template_tasks" on public.template_tasks for all using (true) with check (true);

