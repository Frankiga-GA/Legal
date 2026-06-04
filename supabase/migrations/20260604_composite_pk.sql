-- ============================================================================
-- Migración: PRIMARY KEY compuesta en `cases` y `case_assignments`
-- ============================================================================
-- Problema: `cases.id` es PK global, así que un caso no se puede repetir entre
-- usuarios. Cuando hay 2+ cuentas con el mismo "EXP-2026-001" los updates
-- chocan con 409 y RLS bloquea con 403.
--
-- Solución: PK compuesta (id, user_id) en `cases`. Actualizar la FK en
-- `case_assignments` para que también sea compuesta y no rompa.
-- ============================================================================

begin;

-- 1) Drop la PK actual de cases (CASCADE elimina la FK dependiente en case_assignments)
alter table public.cases
  drop constraint if exists cases_pkey cascade;

-- 2) Nueva PK compuesta en cases
alter table public.cases
  add primary key (id, user_id);

-- 3) Re-crear la FK compuesta en case_assignments
alter table public.case_assignments
  add constraint case_assignments_case_id_user_id_fkey
  foreign key (case_id, user_id)
  references public.cases(id, user_id)
  on delete cascade;

-- 5) Asegurar que el upsert del frontend pueda usar (id, user_id) como target
create index if not exists cases_id_user_id_idx on public.cases(id, user_id);

-- 6) RLS policies siguen funcionando (ya filtran por auth.uid() = user_id).
--    No hace falta cambiarlas.

commit;

-- Verificación
select 'cases PK' as check, pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
where t.relname = 'cases' and c.contype = 'p';
