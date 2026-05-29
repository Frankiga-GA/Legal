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

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'starter',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

drop policy if exists "Organization members can read organizations" on public.organizations;
drop policy if exists "Organization creators can read organizations" on public.organizations;
drop policy if exists "Organization creators can insert organizations" on public.organizations;
drop policy if exists "Organization owners can update organizations" on public.organizations;
drop policy if exists "Organization owners can delete organizations" on public.organizations;

create policy "Organization creators can read organizations"
on public.organizations for select
to authenticated
using (auth.uid() = created_by);

create policy "Organization creators can insert organizations"
on public.organizations for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Organization owners can update organizations"
on public.organizations for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

create policy "Organization owners can delete organizations"
on public.organizations for delete
to authenticated
using (auth.uid() = created_by);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

alter table public.organization_members enable row level security;

create index if not exists organization_members_org_idx on public.organization_members(organization_id);
create index if not exists organization_members_user_idx on public.organization_members(user_id);

drop policy if exists "Members can read membership rows" on public.organization_members;
drop policy if exists "Members can insert membership rows" on public.organization_members;
drop policy if exists "Members can update membership rows" on public.organization_members;
drop policy if exists "Members can delete membership rows" on public.organization_members;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  );
$$;

create policy "Members can read membership rows"
on public.organization_members for select
to authenticated
using (auth.uid() = user_id or public.is_org_admin(organization_id));

create policy "Members can insert membership rows"
on public.organization_members for insert
to authenticated
with check (
  (
    auth.uid() = user_id
    and role = 'owner'
    and exists (
      select 1
      from public.organizations org
      where org.id = organization_members.organization_id
        and org.created_by = auth.uid()
    )
  )
  or public.is_org_admin(organization_id)
);

create policy "Members can update membership rows"
on public.organization_members for update
to authenticated
using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "Members can delete membership rows"
on public.organization_members for delete
to authenticated
using (public.is_org_admin(organization_id));

create policy "Organization members can read organizations"
on public.organizations for select
to authenticated
using (
  public.is_org_member(organizations.id)
  or auth.uid() = organizations.created_by
);

create or replace function public.ensure_default_organization()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_organization_id uuid;
  new_organization_id uuid;
  base_slug text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select om.organization_id
  into existing_organization_id
  from public.organization_members om
  where om.user_id = current_user_id
  order by om.created_at asc
  limit 1;

  if existing_organization_id is not null then
    return existing_organization_id;
  end if;

  select org.id
  into existing_organization_id
  from public.organizations org
  where org.created_by = current_user_id
  order by org.created_at asc
  limit 1;

  if existing_organization_id is not null then
    insert into public.organization_members (organization_id, user_id, role)
    values (existing_organization_id, current_user_id, 'owner')
    on conflict (organization_id, user_id) do nothing;

    return existing_organization_id;
  end if;

  base_slug := 'estudio-' || replace(current_user_id::text, '-', '');

  insert into public.organizations (name, slug, created_by, plan)
  values ('Mi estudio legal', base_slug, current_user_id, 'starter')
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization_id, current_user_id, 'owner')
  on conflict (organization_id, user_id) do nothing;

  return new_organization_id;
end;
$$;

grant execute on function public.ensure_default_organization() to authenticated;

create table if not exists public.assistants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  prompt_folder_id text,
  template_folder_id text,
  drive_folder_id text,
  templates jsonb not null default '[]'::jsonb,
  selected_prompt_file_ids jsonb not null default '[]'::jsonb,
  documents_count integer not null default 0,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assistants enable row level security;

create index if not exists assistants_organization_id_idx on public.assistants(organization_id);

drop policy if exists "Org members can read assistants" on public.assistants;
drop policy if exists "Org members can insert assistants" on public.assistants;
drop policy if exists "Org members can update assistants" on public.assistants;
drop policy if exists "Org members can delete assistants" on public.assistants;

create policy "Org members can read assistants"
on public.assistants for select
to authenticated
using (
  public.is_org_member(assistants.organization_id)
);

create policy "Org members can insert assistants"
on public.assistants for insert
to authenticated
with check (
  auth.uid() = created_by
  and public.is_org_member(assistants.organization_id)
);

create policy "Org members can update assistants"
on public.assistants for update
to authenticated
using (public.is_org_member(assistants.organization_id))
with check (public.is_org_member(assistants.organization_id));

create policy "Org members can delete assistants"
on public.assistants for delete
to authenticated
using (public.is_org_member(assistants.organization_id));

create table if not exists public.assistant_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  description text not null default '',
  prompt text not null default '',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assistant_templates enable row level security;

create index if not exists assistant_templates_organization_id_idx on public.assistant_templates(organization_id);

drop policy if exists "Org members can read assistant templates" on public.assistant_templates;
drop policy if exists "Org members can insert assistant templates" on public.assistant_templates;
drop policy if exists "Org members can update assistant templates" on public.assistant_templates;
drop policy if exists "Org members can delete assistant templates" on public.assistant_templates;

create policy "Org members can read assistant templates"
on public.assistant_templates for select
to authenticated
using (public.is_org_member(assistant_templates.organization_id));

create policy "Org members can insert assistant templates"
on public.assistant_templates for insert
to authenticated
with check (
  auth.uid() = created_by
  and public.is_org_member(assistant_templates.organization_id)
);

create policy "Org members can update assistant templates"
on public.assistant_templates for update
to authenticated
using (public.is_org_member(assistant_templates.organization_id))
with check (public.is_org_member(assistant_templates.organization_id));

create policy "Org members can delete assistant templates"
on public.assistant_templates for delete
to authenticated
using (public.is_org_member(assistant_templates.organization_id));

create table if not exists public.file_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text,
  description text default '',
  file_name text not null,
  file_type text,
  file_size bigint not null default 0,
  storage_path text,
  source_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.file_templates enable row level security;

create index if not exists file_templates_organization_id_idx on public.file_templates(organization_id);

drop policy if exists "Org members can read file templates" on public.file_templates;
drop policy if exists "Org members can insert file templates" on public.file_templates;
drop policy if exists "Org members can update file templates" on public.file_templates;
drop policy if exists "Org members can delete file templates" on public.file_templates;

create policy "Org members can read file templates"
on public.file_templates for select
to authenticated
using (public.is_org_member(file_templates.organization_id));

create policy "Org members can insert file templates"
on public.file_templates for insert
to authenticated
with check (
  auth.uid() = created_by
  and public.is_org_member(file_templates.organization_id)
);

create policy "Org members can update file templates"
on public.file_templates for update
to authenticated
using (public.is_org_member(file_templates.organization_id))
with check (public.is_org_member(file_templates.organization_id));

create policy "Org members can delete file templates"
on public.file_templates for delete
to authenticated
using (public.is_org_member(file_templates.organization_id));

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assistant_id uuid references public.assistants(id) on delete set null,
  file_template_id uuid references public.file_templates(id) on delete set null,
  title text not null,
  content text not null default '',
  format text not null default 'txt',
  share_url text,
  status text not null default 'draft',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.generated_documents enable row level security;

create index if not exists generated_documents_organization_id_idx on public.generated_documents(organization_id);

drop policy if exists "Org members can read generated documents" on public.generated_documents;
drop policy if exists "Org members can insert generated documents" on public.generated_documents;
drop policy if exists "Org members can update generated documents" on public.generated_documents;
drop policy if exists "Org members can delete generated documents" on public.generated_documents;

create policy "Org members can read generated documents"
on public.generated_documents for select
to authenticated
using (public.is_org_member(generated_documents.organization_id));

create policy "Org members can insert generated documents"
on public.generated_documents for insert
to authenticated
with check (
  auth.uid() = created_by
  and public.is_org_member(generated_documents.organization_id)
);

create policy "Org members can update generated documents"
on public.generated_documents for update
to authenticated
using (public.is_org_member(generated_documents.organization_id))
with check (public.is_org_member(generated_documents.organization_id));

create policy "Org members can delete generated documents"
on public.generated_documents for delete
to authenticated
using (public.is_org_member(generated_documents.organization_id));

alter table public.cases
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.cases
add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists cases_organization_id_idx on public.cases(organization_id);

drop policy if exists "Users can read their own cases" on public.cases;
drop policy if exists "Users can insert their own cases" on public.cases;
drop policy if exists "Users can update their own cases" on public.cases;
drop policy if exists "Users can delete their own cases" on public.cases;
drop policy if exists "Org members can read cases" on public.cases;
drop policy if exists "Org members can insert cases" on public.cases;
drop policy if exists "Org members can update cases" on public.cases;
drop policy if exists "Org members can delete cases" on public.cases;

create policy "Org members can read cases"
on public.cases for select
to authenticated
using (
  (
    organization_id is not null
    and public.is_org_member(cases.organization_id)
  )
  or (
    organization_id is null
    and auth.uid() = user_id
  )
);

create policy "Org members can insert cases"
on public.cases for insert
to authenticated
with check (
  (
    organization_id is not null
    and auth.uid() = created_by
    and public.is_org_member(cases.organization_id)
  )
  or (
    organization_id is null
    and auth.uid() = user_id
  )
);

create policy "Org members can update cases"
on public.cases for update
to authenticated
using (
  (
    organization_id is not null
    and public.is_org_member(cases.organization_id)
  )
  or (
    organization_id is null
    and auth.uid() = user_id
  )
)
with check (
  (
    organization_id is not null
    and public.is_org_member(cases.organization_id)
  )
  or (
    organization_id is null
    and auth.uid() = user_id
  )
);

create policy "Org members can delete cases"
on public.cases for delete
to authenticated
using (
  (
    organization_id is not null
    and public.is_org_member(cases.organization_id)
  )
  or (
    organization_id is null
    and auth.uid() = user_id
  )
);
