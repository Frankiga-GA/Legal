# LUSTI Document Backend

Backend en Python para recibir archivos desde React, extraer texto y preparar el contenido que luego se enviara a la IA.

## Endpoints

- `GET /health`
- `POST /upload`
- `POST /chat`
- `POST /generate-document`
- `POST /generate-file`

## Arranque local

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Variables de entorno

Copia `backend/.env.example` a `backend/.env` y completa:

```env
GEMINI_API_KEY=tu_clave
GEMINI_MODEL=gemini-2.5-flash
```

## Arranque rapido en Windows

```powershell
cd backend
.\start_backend.ps1
```

## Produccion

Despliega este directorio como servicio Python y configura la URL publica en el frontend:

```env
VITE_DOCUMENT_BACKEND_URL=https://api.tu-dominio.com
```

Comando sugerido:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
