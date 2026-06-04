# SECURITY.md

Guia de seguridad operativa para LUSTI Legal Intelligence. Este documento
cubre la politica de claves, la rotacion y los controles automaticos.

---

## 1. Principios

1. **Cero secretos en el repo.** Solo `.env.example` (placeholders) y `.env`
   en el working tree, excluido por `.gitignore`.
2. **Frontend y backend tienen claves distintas.** Ningun secreto del
   backend llega al bundle del navegador.
3. **Lo minimo indispensable en `VITE_*`.** Solo Client IDs publicos y la
   URL del backend documental.
4. **Todo lo que se conecta a Gemini, Drive o Supabase con privilegios
   vive en el backend.**

## 2. Separacion de claves

| Variable                              | Frontend (`VITE_*`) | Backend (`backend/.env`) | Notas                                              |
| ------------------------------------- | ------------------- | ------------------------ | -------------------------------------------------- |
| `SUPABASE_URL`                        | si                  | si                       | URL publica, no es un secreto                     |
| `SUPABASE_PUBLISHABLE_KEY` / `anon`   | si                  | no                       | Diseñada para ser expuesta (RLS protege los datos) |
| `SUPABASE_SERVICE_ROLE_KEY`           | **NO**              | solo si es necesario     | Bypass de RLS. Mantenerla en el backend            |
| `GOOGLE_OAUTH_CLIENT_ID`              | si                  | no                       | Publico por diseno                                 |
| `GEMINI_API_KEY`                      | **NO**              | si                       | El frontend siempre debe llamar al backend         |
| `ALLOWED_ORIGINS`                     | no                  | si                       | CORS estricto en el backend                        |

## 3. Rotacion - hazla hoy

### 3.1 Google Gemini
1. Ve a https://aistudio.google.com/app/apikey
2. **Borra** la clave actual (`AQ.Ab8RNIzm...`) - ya esta en `.env` viejo.
3. **Crea** una clave nueva.
4. **Restringe** por dominio HTTP y por IP de tu backend.
5. Pegala SOLO en `backend/.env` (no en el frontend).

### 3.2 Supabase
1. https://supabase.com/dashboard/project/grqfsseqqudxvrnrjjgx/settings/api
2. **Roll** la `service_role` secret (si la usaste).
3. Confirma que la `publishable` (anon) no expone politicas sin RLS.
4. Revisa `Authentication -> Sign In/Up` y desactiva "Confirm email" solo
   en staging, dejalo activo en produccion.
5. Rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con la
   publishable NUEVA.

### 3.3 Google OAuth
1. https://console.cloud.google.com/apis/credentials
2. **Borra** el Client ID actual (`823586246603-...`) y crea uno nuevo.
3. Configura el nuevo Client con:
   - JavaScript origins: `http://localhost:5173`, `https://tu-dominio.com`
   - Redirect URIs: **Authorization Code + PKCE** (no implicit)
4. Pega el nuevo ID en `VITE_GOOGLE_OAUTH_CLIENT_ID`.

## 4. Limpieza de archivos

Despues de rotar:

```powershell
# 1. Verifica que .env no esta tracked
git ls-files | Select-String "\.env"   # solo .env.example debe salir

# 2. Escanea secretos en tracked
npm run security:check

# 3. Instala el hook de pre-commit (una sola vez)
npm run security:install-hooks
```

Si en algun momento `.env` fue committed por error (antes de tener
`.gitignore`), limpia el historial con `git filter-repo`:

```bash
pip install git-filter-repo
git filter-repo --path .env --path backend/.env --invert-paths
git push --force-with-lease
```

**Importante:** cambia TODAS las claves despues de limpiar el historial,
porque ya fueron expuestas.

## 5. Controles automaticos

- `npm run security:check` - escanea el repo por patrones de secretos.
- `.githooks/pre-commit` - bloquea commits con secretos staged.
- `.gitignore` - excluye `.env`, `.env.*`, `backend/.env`, `backend/.venv`.

## 6. Antes de vender

- [ ] Cambiar `allow_origins=["*"]` a lista explicita en `backend/main.py`.
- [ ] Anadir JWT auth al backend (`Authorization: Bearer ...`).
- [ ] Mover todas las llamadas Gemini al backend.
- [ ] Migrar OAuth a Authorization Code + PKCE (no implicit).
- [ ] Almacenar el token de Drive en `sessionStorage` (no `localStorage`).
- [ ] Activar 2FA en Supabase, Google Cloud, Vercel, GitHub.
- [ ] Anadir un "panic button" para invalidar todas las sesiones.
