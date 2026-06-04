-- =============================================================================
-- LUSTI - Hotfix de simplificacion: drop TODO lo de organizaciones
-- =============================================================================
-- Ejecutar en: SQL Editor del proyecto hpxtnzcnvtqinchqarms.supabase.co
-- (o el proyecto que estes usando). Es idempotente.
-- =============================================================================

-- 1. Eliminar tablas con dependencias (cascade borra policies e indices)
drop table if exists public.organization_invitations cascade;
drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.generated_documents cascade;
drop table if exists public.file_templates cascade;
drop table if exists public.assistant_templates cascade;
drop table if exists public.assistants cascade;

-- 2. Quitar columnas de org en tablas que quedan.
--    CASCADE borra las policies de la v2 que dependen de organization_id.
alter table public.cases drop column if exists organization_id cascade;
alter table public.cases drop column if exists created_by cascade;
alter table public.saved_registry_items drop column if exists organization_id cascade;
alter table public.profiles drop column if exists is_super_admin cascade;

-- 3. Quitar funciones (antes de dropear el enum al que referencia)
drop function if exists public.ensure_default_organization() cascade;
drop function if exists public.accept_invitation(text) cascade;
drop function if exists public.is_org_member(uuid) cascade;
drop function if exists public.get_org_role(uuid) cascade;
drop function if exists public.has_org_role(uuid, public.app_role) cascade;
drop function if exists public.is_super_admin() cascade;
drop function if exists public.log_audit_event(uuid, text, text, text, jsonb) cascade;

-- 4. Quitar el enum
drop type if exists public.app_role cascade;

-- =============================================================================
-- RLS nuevo: solo auth.uid() = user_id en cada tabla del usuario
-- =============================================================================

-- cases
drop policy if exists "Org members can read cases" on public.cases;
drop policy if exists "Lawyer+ can insert cases" on public.cases;
drop policy if exists "Paralegal+ can update cases" on public.cases;
drop policy if exists "Lawyer+ can delete cases" on public.cases;
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
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own cases"
on public.cases for delete to authenticated
using (auth.uid() = user_id);

-- case_assignments
drop policy if exists "Org members can read case assignments" on public.case_assignments;
drop policy if exists "Lawyer+ can create assignments" on public.case_assignments;
drop policy if exists "Lawyer+ can delete assignments" on public.case_assignments;
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
drop policy if exists "Org members can read saved registry items" on public.saved_registry_items;
drop policy if exists "Org members can insert saved registry items" on public.saved_registry_items;
drop policy if exists "Org members can delete saved registry items" on public.saved_registry_items;
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

-- profiles: quitar WITH CHECK que mencionaba is_super_admin
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Profiles are inserted on signup" on public.profiles;
create policy "Profiles are inserted on signup"
on public.profiles for insert to authenticated
with check (auth.uid() = user_id);

-- =============================================================================
-- Verificacion final
-- =============================================================================
select
  (select count(*) from public.cases) as cases,
  (select count(*) from public.saved_registry_items) as saved_registry_items,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from pg_tables where schemaname = 'public' and tablename in (
    'organizations', 'organization_members', 'organization_invitations',
    'assistants', 'assistant_templates', 'file_templates',
    'generated_documents', 'audit_log'
  )) as org_tables_remaining;
-- esperado: org_tables_remaining = 0
