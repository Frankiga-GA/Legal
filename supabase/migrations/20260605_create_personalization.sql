-- =============================================================================
-- Migracion: tablas de personalizacion (asistentes + prompts guardados)
-- =============================================================================
-- Cada usuario tiene sus propios asistentes y prompts. El ID lo genera
-- Supabase con gen_random_uuid() para evitar colisiones.
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
