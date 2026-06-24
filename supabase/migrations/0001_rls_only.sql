-- =============================================================================
-- LUSTI - SOLO RLS (seguridad, no borra datos)
-- =============================================================================
-- 100% seguro: solo agrega policies, no borra ni modifica datos existentes.
-- =============================================================================

-- RLS para tablas existentes
alter table public.cases enable row level security;
alter table public.saved_registry_items enable row level security;
alter table public.profiles enable row level security;

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

drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Profiles are inserted on signup" on public.profiles;

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Profiles are inserted on signup"
  on public.profiles for insert to authenticated
  with check (auth.uid() = user_id);

-- Crear tablas que FALTAN (si no existen)
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
