"""Vercel serverless entry point.

Vercel ejecuta este archivo como AWS Lambda. FastAPI es ASGI puro,
asi que usamos Mangum como adaptador. Esto convierte cada request HTTP
entrante (con el formato que Vercel/lambda entrega) en una llamada ASGI
para FastAPI.

El backend real vive en `backend/main.py`. Lo importamos desde aca.
"""
import os
import sys

# Agregar `backend/` al path para que los imports de `from auth import ...`
# y `from main import app` funcionen
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app  # noqa: E402
from mangum import Mangum  # noqa: E402


def _strip_api_prefix(event):
    """Vercel entrega la ruta con el prefijo `/api/...` (ej. /api/upload).
    FastAPI tiene las rutas registradas SIN ese prefijo (ej. /upload),
    igual que en local, donde el proxy de Vite ya lo recorta. Esta funcion
    reescribe el evento para que el resto del pipeline (Mangum -> FastAPI)
    vea la ruta limpia. Si en el futuro Vercel recorta el prefijo solo,
    esta funcion no hace daño (no encuentra `/api/` y deja el path igual).
    """
    api_prefix = "/api/"
    for key in ("rawPath", "path"):
        value = event.get(key)
        if isinstance(value, str) and value.startswith(api_prefix):
            event[key] = "/" + value[len(api_prefix):]
    rc = event.get("requestContext") or {}
    http = rc.get("http") if isinstance(rc, dict) else None
    if isinstance(http, dict):
        path = http.get("path")
        if isinstance(path, str) and path.startswith(api_prefix):
            http["path"] = "/" + path[len(api_prefix):]
    return event


class LustiMangum(Mangum):
    def __call__(self, event, context):
        return super().__call__(_strip_api_prefix(event), context)


# `lifespan="off"` evita que Mangum intente ejecutar el lifespan de FastAPI
# (startup/shutdown), porque en serverless no hay ciclo de vida real.
handler = LustiMangum(app, lifespan="off")
