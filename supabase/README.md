# Supabase - LUSTI

Esquema completo con RLS, roles, invitaciones, audit log y assignments.

## 1. Aplicar el schema

1. Abre https://supabase.com/dashboard/project/TU_PROYECTO/sql
2. Pega el contenido de `schema.sql` y ejecuta.
3. El script es **idempotente**: correlo varias veces si necesitas.

> Si vienes de una version anterior, los `drop policy if exists` y
> `create type if not exists` evitan errores. Los `alter table ... add
> column if not exists` se mantienen en sus propias secciones mas abajo
> si necesitas una version incremental.

## 2. Configurar Auth

En `Authentication -> Providers`:

- **Email** -> activado, confirmacion de email **obligatoria** en produccion.
- **Google** -> activado, Client ID/Secret de Google Cloud.
- En `Authentication -> URL Configuration` agrega tu dominio.

## 3. Crear buckets de Storage

Ve a `Storage -> New bucket`:

| Bucket               | Publico | Uso                                         |
| -------------------- | ------- | ------------------------------------------- |
| `case-files`         | NO      | PDFs, docx y archivos de expedientes        |
| `organization-files` | NO      | Logos y assets privados del estudio         |

Las policies de storage **no se generan desde SQL** (limitation de
Supabase). Para activarlas:

1. Ve a `Storage -> Policies` en cada bucket.
2. Aplica el template "Custom policy" con esta condicion (sustituye
   `bucket_name` por el nombre del bucket):

```sql
-- Lectura: solo miembros de la org a la que pertenece el archivo
create policy "Org members can read case-files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'case-files'
  and public.is_org_member((storage.foldername(name))[1]::uuid)
);
```

Para `organization-files`, el path del archivo es `<organization_id>/logo.png`,
asi que la policy es identica pero con `bucket_id = 'organization-files'`.

## 4. Roles y permisos

Jerarquia de menor a mayor privilegio:

| Rol         | Lee org | Lee casos | Crea casos | Edita casos | Borra casos | Admin org |
| ----------- | ------- | --------- | ---------- | ----------- | ----------- | --------- |
| `viewer`    | si      | si        | no         | no          | no          | no        |
| `paralegal` | si      | si        | no         | **si**      | no          | no        |
| `lawyer`    | si      | si        | **si**     | si          | **si**      | no        |
| `admin`     | si      | si        | si         | si          | si          | **si**    |
| `owner`     | si      | si        | si         | si          | si          | si        |

`viewer` es el rol por defecto cuando aceptas una invitacion.

## 5. Invitaciones

Las invitaciones se crean desde la app (`MembersManager` -> "Invitar
miembro"). Se almacenan en `organization_invitations` con un `token`
unico. El flujo es:

1. Admin crea invitacion con email + rol.
2. Backend (o el `accept_invitation` RPC) agrega al usuario a
   `organization_members` con el rol elegido.
3. Audit log registra `invitation.accepted`.

## 6. Audit log

`public.audit_log` registra eventos sensibles:

- Login / logout
- Cambios de rol
- Borrado de expedientes
- Generacion de documentos

El frontend **no puede escribir** directamente en `audit_log` (policy
`with check (false)`). Usa el RPC `public.log_audit_event(...)` o el
backend (que usa `service_role`).

Los **admins** de la organizacion pueden leer el log completo.
`is_super_admin` (en `profiles`) puede ver eventos de todas las orgs.

## 7. Funciones utiles

| Funcion                                       | Uso                                            |
| --------------------------------------------- | ---------------------------------------------- |
| `public.is_org_member(uuid)`                  | true si el usuario actual pertenece a la org   |
| `public.get_org_role(uuid)`                   | devuelve el `app_role` del usuario en la org   |
| `public.has_org_role(uuid, app_role)`         | true si el rol >= minimo requerido             |
| `public.ensure_default_organization()`        | crea/le devuelve su org por defecto al usuario  |
| `public.accept_invitation(text)`              | acepta una invitacion por token                |
| `public.log_audit_event(...)`                 | registra un evento (solo usuarios autenticados)|

## 8. Verificacion

Despues de correr el schema:

```sql
-- Todas las tablas con RLS
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- Todas las policies
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Si alguna tabla tiene `rowsecurity = false` o no aparece en
`pg_policies`, el script no se ejecuto completo.
