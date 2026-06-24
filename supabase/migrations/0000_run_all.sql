-- =============================================================================
-- LUSTI - Migracion completa (todas las migraciones en orden)
-- =============================================================================
-- Ejecutar en: Supabase SQL Editor del proyecto
-- Idempotente: se puede correr varias veces.
-- =============================================================================

-- =============================================================================
-- 1. Limpiar tablas viejas de organizaciones (si existen)
-- =============================================================================
drop table if exists public.organization_invitations cascade;
drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.generated_documents cascade;
drop table if exists public.file_templates cascade;
drop table if exists public.assistant_templates cascade;
drop table if exists public.assistants cascade;

alter table public.cases drop column if exists organization_id cascade;
alter table public.cases drop column if exists created_by cascade;
alter table public.saved_registry_items drop column if exists organization_id cascade;
alter table public.profiles drop column if exists is_super_admin cascade;

drop function if exists public.ensure_default_organization() cascade;
drop function if exists public.accept_invitation(text) cascade;
drop function if exists public.is_org_member(uuid) cascade;
drop function if exists public.get_org_role(uuid) cascade;
drop function if exists public.has_org_role(uuid, public.app_role) cascade;
drop function if exists public.is_super_admin() cascade;
drop function if exists public.log_audit_event(uuid, text, text, text, jsonb) cascade;

drop type if exists public.app_role cascade;

-- =============================================================================
-- 2. Tablas principales (idempotente)
-- =============================================================================

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- profiles
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
drop policy if exists "Profiles are inserted on signup" on public.profiles;

create policy "Profiles are readable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Profiles are inserted on signup"
  on public.profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name, full_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    'es-PE'
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- cases
create table if not exists public.cases (
  id text not null,
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
  counterparty text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

alter table public.cases enable row level security;

create index if not exists cases_user_id_idx on public.cases(user_id);
create index if not exists cases_status_idx on public.cases(status);
create index if not exists cases_urgency_idx on public.cases(urgency);
create index if not exists cases_last_update_idx on public.cases(last_update desc);
create index if not exists cases_id_user_id_idx on public.cases(id, user_id);

drop trigger if exists trg_cases_updated_at on public.cases;
create trigger trg_cases_updated_at
  before update on public.cases for each row execute function public.set_updated_at();

drop policy if exists "Users can read their own cases" on public.cases;
drop policy if exists "Users can insert their own cases" on public.cases;
drop policy if exists "Users can update their own cases" on public.cases;
drop policy if exists "Users can delete their own cases" on public.cases;

create policy "Users can read their own cases"
  on public.cases for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own cases"
  on public.cases for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own cases"
  on public.cases for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own cases"
  on public.cases for delete to authenticated
  using (auth.uid() = user_id);

-- case_assignments
create table if not exists public.case_assignments (
  case_id text not null,
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
  on public.case_assignments for select to authenticated
  using (exists (select 1 from public.cases c where c.id = case_assignments.case_id and c.user_id = auth.uid()));

create policy "Case owners can create assignments"
  on public.case_assignments for insert to authenticated
  with check (exists (select 1 from public.cases c where c.id = case_assignments.case_id and c.user_id = auth.uid()));

create policy "Case owners can delete assignments"
  on public.case_assignments for delete to authenticated
  using (exists (select 1 from public.cases c where c.id = case_assignments.case_id and c.user_id = auth.uid()));

-- saved_registry_items
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
  before update on public.saved_registry_items for each row execute function public.set_updated_at();

drop policy if exists "Users can read their own saved registry items" on public.saved_registry_items;
drop policy if exists "Users can save their own registry items" on public.saved_registry_items;
drop policy if exists "Users can delete their own saved registry items" on public.saved_registry_items;

create policy "Users can read their own saved registry items"
  on public.saved_registry_items for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can save their own registry items"
  on public.saved_registry_items for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved registry items"
  on public.saved_registry_items for delete to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- 3. Migracion: case_chats (historial de chat por expediente)
-- =============================================================================
create table if not exists public.case_chats (
  id uuid primary key default gen_random_uuid(),
  case_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'ai')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists case_chats_lookup_idx
  on public.case_chats (case_id, user_id, created_at);

alter table public.case_chats enable row level security;

drop policy if exists "Users can manage their own chats" on public.case_chats;
create policy "Users can manage their own chats"
  on public.case_chats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================================
-- 4. Migracion: global_chats (chat IA standalone)
-- =============================================================================
create table if not exists public.global_chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  assistant_id text,
  role text not null check (role in ('user', 'ai')),
  content text not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_global_chats_lookup
  on public.global_chats (user_id, assistant_id, created_at desc);

alter table public.global_chats enable row level security;

drop policy if exists "Users can view own global chats" on public.global_chats;
create policy "Users can view own global chats"
  on public.global_chats for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own global chats" on public.global_chats;
create policy "Users can insert own global chats"
  on public.global_chats for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own global chats" on public.global_chats;
create policy "Users can delete own global chats"
  on public.global_chats for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- 5. Migracion: personalizacion (asistentes + prompts guardados)
-- =============================================================================
create table if not exists public.personal_assistants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text not null default '',
  system_prompt text not null default '',
  specialty text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_personal_assistants_user
  on public.personal_assistants (user_id, created_at desc);

alter table public.personal_assistants enable row level security;

drop policy if exists "Users can manage own assistants" on public.personal_assistants;
create policy "Users can manage own assistants"
  on public.personal_assistants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.personal_prompts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  content text not null,
  category text not null default 'Consulta general',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_personal_prompts_user
  on public.personal_prompts (user_id, created_at desc);

alter table public.personal_prompts enable row level security;

drop policy if exists "Users can manage own prompts" on public.personal_prompts;
create policy "Users can manage own prompts"
  on public.personal_prompts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================================
-- Verificacion
-- =============================================================================
select
  (select count(*) from public.cases) as total_cases,
  (select count(*) from public.profiles) as total_profiles,
  (select count(*) from pg_tables where schemaname = 'public' and tablename = 'organizations') as org_tables_remaining;
-- esperado: org_tables_remaining = 0
