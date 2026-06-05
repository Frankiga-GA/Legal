"""Vercel serverless entry point.

Vercel ejecuta este archivo como AWS Lambda. FastAPI es ASGI puro,
asi que usamos Mangum como adaptador. Esto convierte cada request HTTP
entrante (con el formato que Vercel/lambda entrega) en una llamada ASGI
para FastAPI.

El backend real vive en `backend/main.py`. Lo importamos desde aca.
"""
import logging
import os
import sys

# Agregar `backend/` al path para que los imports de `from auth import ...`
# y `from main import app` funcionen
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vercel-entry")

from main import app  # noqa: E402
from mangum import Mangum  # noqa: E402


class LustiMangum(Mangum):
    """Wrapper que muestra la ruta entrante para depurar el routing en Vercel."""

    def __call__(self, event, context):
        path = event.get("rawPath") or event.get("path") or ""
        method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod") or ""
        logger.info("vercel-entry: %s %s", method, path)
        return super().__call__(event, context)


# `lifespan="off"` evita que Mangum intente ejecutar el lifespan de FastAPI
# (startup/shutdown), porque en serverless no hay ciclo de vida real.
handler = LustiMangum(app, lifespan="off")
