-- =============================================================================
-- LUSTI Legal Intelligence - Schema v3.0 (single-user)
-- =============================================================================
-- Version: 3.0
-- Ejecutar en: Supabase SQL Editor del proyecto (Settings -> API -> URL debe
-- coincidir con la URL configurada en .env).
-- Idempotente: se puede correr varias veces.
--
-- Modelo:
--   - Cada usuario autenticado es dueno pleno de sus expedientes.
--   - Sin organizaciones, sin roles, sin invitaciones, sin audit log.
--   - RLS: auth.uid() = user_id en todas las tablas.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Trigger generico para updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Profiles (vinculado a auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  full_name text,
  phone text,
  avatar_url text,
  locale text not null default 'es-PE',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

create policy "Profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Trigger: cuando se crea un auth.user, crear su profile vacio
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, full_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    'es-PE'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. Cases (expedientes)
-- -----------------------------------------------------------------------------
create table if not exists public.cases (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  dni text not null,
  type text not null,
  status text not null default 'Activo',
  summary text default '',
  latest_progress text default '',
  hearing_link text default '',
  urgency text not null default 'Media',
  last_update date not null default current_date,
  documents jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  important_dates jsonb not null default '[]'::jsonb,
  official_references jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cases enable row level security;

create index if not exists cases_user_id_idx on public.cases(user_id);
create index if not exists cases_status_idx on public.cases(status);
create index if not exists cases_urgency_idx on public.cases(urgency);
create index if not exists cases_last_update_idx on public.cases(last_update desc);

drop trigger if exists trg_cases_updated_at on public.cases;
create trigger trg_cases_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

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

-- -----------------------------------------------------------------------------
-- 4. Case assignments (abogado asignado a un caso)
-- -----------------------------------------------------------------------------
create table if not exists public.case_assignments (
  case_id text not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'lead',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null,
  primary key (case_id, user_id)
);

alter table public.case_assignments enable row level security;

create index if not exists case_assignments_user_idx on public.case_assignments(user_id);

drop policy if exists "Users can read assignments for their cases" on public.case_assignments;
drop policy if exists "Case owners can create assignments" on public.case_assignments;
drop policy if exists "Case owners can delete assignments" on public.case_assignments;

create policy "Users can read assignments for their cases"
on public.case_assignments for select
to authenticated
using (
  exists (
    select 1 from public.cases c
    where c.id = case_assignments.case_id and c.user_id = auth.uid()
  )
);

create policy "Case owners can create assignments"
on public.case_assignments for insert
to authenticated
with check (
  exists (
    select 1 from public.cases c
    where c.id = case_assignments.case_id and c.user_id = auth.uid()
  )
);

create policy "Case owners can delete assignments"
on public.case_assignments for delete
to authenticated
using (
  exists (
    select 1 from public.cases c
    where c.id = case_assignments.case_id and c.user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- 5. Saved registry items
-- -----------------------------------------------------------------------------
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

drop trigger if exists trg_saved_registry_items_updated_at on public.saved_registry_items;
create trigger trg_saved_registry_items_updated_at
before update on public.saved_registry_items
for each row execute function public.set_updated_at();

drop policy if exists "Users can read their own saved registry items" on public.saved_registry_items;
drop policy if exists "Users can save their own registry items" on public.saved_registry_items;
drop policy if exists "Users can delete their own saved registry items" on public.saved_registry_items;

create policy "Users can read their own saved registry items"
on public.saved_registry_items for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can save their own registry items"
on public.saved_registry_items for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own saved registry items"
on public.saved_registry_items for delete
to authenticated
using (auth.uid() = user_id);
