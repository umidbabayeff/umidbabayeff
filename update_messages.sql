-- Add is_converted column to messages table to track project conversion status
alter table public.messages add column if not exists is_converted boolean default false;
