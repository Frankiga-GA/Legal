-- ============================================================================
-- Migración: tabla `case_chats` para historial de conversaciones de IA
-- ============================================================================
-- Cada mensaje (del usuario o de la IA) se guarda como una fila. La clave
-- (case_id, user_id, created_at) permite cargar el historial ordenado de
-- un expediente específico. RLS filtra por user_id para que cada usuario
-- solo vea sus propios chats.
-- ============================================================================

begin;

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
  on public.case_chats
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
