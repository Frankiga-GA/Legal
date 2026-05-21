create table if not exists public.cases (
  id text primary key,
  client_name text not null,
  dni text not null,
  type text not null,
  status text not null default 'Activo',
  summary text default '',
  last_update date not null default current_date,
  documents jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  important_dates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cases enable row level security;

create policy "Allow public demo reads"
on public.cases for select
using (true);

create policy "Allow public demo inserts"
on public.cases for insert
with check (true);

create policy "Allow public demo updates"
on public.cases for update
using (true)
with check (true);

create policy "Allow public demo deletes"
on public.cases for delete
using (true);
