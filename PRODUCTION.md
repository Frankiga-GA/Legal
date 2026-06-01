# LUSTI Production Checklist

Guia corta para pasar LUSTI a produccion con Supabase, Google Drive OAuth, Gemini y el backend documental.

## 1. Dominios

Define primero los dominios reales:

- Frontend: `https://tu-dominio.com`
- Backend documental: `https://api.tu-dominio.com`

El frontend debe usar HTTPS en produccion. Google OAuth para web requiere origenes y redirects autorizados con dominios validos.

## 2. Google Cloud

En Google Cloud Console:

1. Crea un proyecto separado para produccion.
2. Habilita Google Drive API.
3. Configura OAuth consent screen:
   - User type: `External` si venderas a estudios legales fuera de tu organizacion.
   - App name: `LUSTI`.
   - Support email y developer contact reales.
   - Authorized domains: agrega `tu-dominio.com`.
4. Agrega el scope usado por la app:
   - `https://www.googleapis.com/auth/drive.readonly`
5. Crea credenciales OAuth Client ID:
   - Application type: `Web application`.
   - Authorized JavaScript origins:
     - `https://tu-dominio.com`
   - Authorized redirect URIs:
     - `https://tu-dominio.com`
6. Copia el Client ID en produccion como:

```env
VITE_GOOGLE_OAUTH_CLIENT_ID=...
```

Si el OAuth consent screen esta en `Testing`, Google limita el acceso a usuarios de prueba. Para venderlo, cambia la audiencia/publicacion a produccion. Si Google solicita verificacion por el scope de Drive, prepara politica de privacidad, dominio verificado y explicacion clara del uso de Drive.

## 3. Supabase

En Supabase:

1. Ejecuta `supabase/schema.sql` en SQL Editor.
2. En Authentication > URL Configuration:
   - Site URL: `https://tu-dominio.com`
   - Redirect URLs: `https://tu-dominio.com`
3. En produccion configura:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Usa solo la publishable key en el frontend. No pongas service role keys en Vite.

## 4. Backend documental

Despliega `backend/` como servicio Python. Variables:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

Comando sugerido:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Cuando tengas la URL publica del backend, configura el frontend:

```env
VITE_DOCUMENT_BACKEND_URL=https://api.tu-dominio.com
```

Verifica:

```bash
curl https://api.tu-dominio.com/health
```

## 5. Frontend

Variables de produccion:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=gemini-2.5-flash
VITE_GOOGLE_OAUTH_CLIENT_ID=...
VITE_DOCUMENT_BACKEND_URL=https://api.tu-dominio.com
```

Build:

```bash
npm install
npm run build
```

Deploya la carpeta `dist/` si usas hosting estatico, o conecta el repo y usa:

- Build command: `npm run build`
- Output directory: `dist`

## 6. Pruebas antes de vender

- Login con Supabase en dominio real.
- Crear expediente.
- Crear asistente.
- Conectar Google Drive.
- Listar carpetas y archivos.
- Subir/leer PDF.
- Pedir a la IA: `generame un pdf con esta informacion`.
- Confirmar que el PDF aparece en Documentos generados.
- Descargar PDF.
- Probar con una cuenta Google que no sea la tuya.
