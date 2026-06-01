# LUSTI Legal Intelligence

App React + Vite para gestion de expedientes legales con autenticacion y persistencia en Supabase.

## Setup local

1. Instala dependencias:

```bash
npm install
```

2. Copia las variables de entorno:

```bash
cp .env.example .env
```

3. Crea un proyecto en Supabase y completa:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_GOOGLE_OAUTH_CLIENT_ID=...
VITE_DOCUMENT_BACKEND_URL=http://127.0.0.1:8000
```

4. En Supabase SQL Editor, ejecuta `supabase/schema.sql`.

5. Levanta la app:

```bash
npm run dev
```

## Supabase

La tabla `public.cases` usa RLS. Cada usuario autenticado solo puede leer, crear, actualizar y borrar sus propios expedientes mediante `user_id = auth.uid()`.

Si Supabase no esta configurado, la app cae a almacenamiento local para mantener la demo usable.

## Produccion

Revisa [PRODUCTION.md](./PRODUCTION.md) antes de vender o mostrar el sistema en un dominio real. Ahi esta la checklist para Google Cloud OAuth, Supabase, backend documental y variables de entorno.
