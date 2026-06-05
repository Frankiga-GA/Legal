-- =============================================================================
-- Migracion: tabla global_chats
-- =============================================================================
-- Almacena el historial de conversaciones del Chat IA global (standalone,
-- no asociado a ningun expediente). Cada fila es un mensaje (user o ai).
--
-- (user_id, assistant_id) particiona el historial: cada asistente tiene su
-- propia conversacion. assistant_id NULL = chat libre sin asistente.
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
