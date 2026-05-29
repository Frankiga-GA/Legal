# LUSTI Document Backend

Backend en Python para recibir archivos desde React, extraer texto y preparar el contenido que luego se enviara a la IA.

## Endpoints

- `GET /health`
- `POST /upload`
- `POST /chat`
- `POST /generate-document`

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

## Proximo paso

- Implementar extraccion real de PDF y DOCX.
- Conectar `src/services/documentBackendService.js` con este backend.
- Mover la llamada a la IA para que se haga desde Python.
