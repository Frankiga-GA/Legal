create table if not exists public.cases (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  dni text not null,
  type text not null,
  status text not null default 'Activo',
  summary text default '',
  last_update date not null default current_date,
  documents jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  important_dates jsonb not null default '[]'::jsonb,
  official_references jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cases enable row level security;

create index if not exists cases_user_id_idx on public.cases(user_id);

drop policy if exists "Allow public demo reads" on public.cases;
drop policy if exists "Allow public demo inserts" on public.cases;
drop policy if exists "Allow public demo updates" on public.cases;
drop policy if exists "Allow public demo deletes" on public.cases;
drop policy if exists "Users can read their own cases" on public.cases;
drop policy if exists "Users can insert their own cases" on public.cases;
drop policy if exists "Users can update their own cases" on public.cases;
drop policy if exists "Users can delete their own cases" on public.cases;

create policy "Users can read their own cases"
on public.cases for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own cases"
on public.cases for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own cases"
on public.cases for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own cases"
on public.cases for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.saved_registry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  registry_id text not null,
  title text not null,
  registry_date text,
  registry_type text,
  source text,
  entity text,
  summary text,
  impact text,
  url text,
  category text,
  urgency text,
  scraped_at text,
  official boolean not null default true,
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, registry_id)
);

alter table public.saved_registry_items enable row level security;

create index if not exists saved_registry_items_user_id_idx on public.saved_registry_items(user_id);
create index if not exists saved_registry_items_registry_id_idx on public.saved_registry_items(registry_id);

drop policy if exists "Users can read their own saved registry items" on public.saved_registry_items;
drop policy if exists "Users can insert their own saved registry items" on public.saved_registry_items;
drop policy if exists "Users can update their own saved registry items" on public.saved_registry_items;
drop policy if exists "Users can delete their own saved registry items" on public.saved_registry_items;

create policy "Users can read their own saved registry items"
on public.saved_registry_items for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own saved registry items"
on public.saved_registry_items for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own saved registry items"
on public.saved_registry_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own saved registry items"
on public.saved_registry_items for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.assistants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  templates jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assistants enable row level security;

create index if not exists assistants_user_id_idx on public.assistants(user_id);

drop policy if exists "Users can read their own assistants" on public.assistants;
drop policy if exists "Users can insert their own assistants" on public.assistants;
drop policy if exists "Users can update their own assistants" on public.assistants;
drop policy if exists "Users can delete their own assistants" on public.assistants;

create policy "Users can read their own assistants"
on public.assistants for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own assistants"
on public.assistants for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own assistants"
on public.assistants for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own assistants"
on public.assistants for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.assistant_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  description text,
  prompt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.assistant_templates enable row level security;

create index if not exists assistant_templates_user_id_idx on public.assistant_templates(user_id);

drop policy if exists "Users can read their own assistant templates" on public.assistant_templates;
drop policy if exists "Users can insert their own assistant templates" on public.assistant_templates;
drop policy if exists "Users can update their own assistant templates" on public.assistant_templates;
drop policy if exists "Users can delete their own assistant templates" on public.assistant_templates;

create policy "Users can read their own assistant templates"
on public.assistant_templates for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own assistant templates"
on public.assistant_templates for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own assistant templates"
on public.assistant_templates for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own assistant templates"
on public.assistant_templates for delete
to authenticated
using (auth.uid() = user_id);
