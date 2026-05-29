from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import httpx
import pdfplumber
from docx import Document
from dotenv import load_dotenv

try:
    import fitz
except ImportError:
    fitz = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BACKEND_DIR.parent / ".env", override=False)


app = FastAPI(title="LUSTI Document Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    prompt: str | None = None
    file_name: str | None = None
    file_type: str | None = None
    file_text: str | None = None


class ChatResponse(BaseModel):
    message: str
    extracted_text: str | None = None
    file_name: str | None = None
    file_type: str | None = None


def _read_text_from_upload(upload: UploadFile) -> str:
    content = upload.file.read()
    if not content:
        return ""

    filename = (upload.filename or "").lower()
    content_type = (upload.content_type or "").lower()

    if filename.endswith((".txt", ".md", ".csv", ".json")) or content_type.startswith("text/"):
        return content.decode("utf-8", errors="ignore").strip()

    if filename.endswith(".pdf") or content_type == "application/pdf":
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pages = [page.extract_text() or "" for page in pdf.pages]
            text = "\n\n".join(part.strip() for part in pages if part.strip()).strip()
            if text:
                return text
        except Exception:
            pass

        if fitz is not None:
            try:
                document = fitz.open(stream=content, filetype="pdf")
                pages = [page.get_text("text") or "" for page in document]
                text = "\n\n".join(part.strip() for part in pages if part.strip()).strip()
                if text:
                    return text

                if pytesseract is not None:
                    ocr_pages = []
                    for page in document:
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                        image = pix.tobytes("png")
                        try:
                            ocr_text = pytesseract.image_to_string(io.BytesIO(image), lang="spa+eng")
                        except Exception:
                            ocr_text = ""
                        if ocr_text.strip():
                            ocr_pages.append(ocr_text.strip())
                    ocr_text = "\n\n".join(part for part in ocr_pages if part).strip()
                    if ocr_text:
                        return ocr_text
            except Exception:
                return ""

        return ""

    if filename.endswith(".docx") or content_type in {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }:
        try:
            doc = Document(io.BytesIO(content))
            paragraphs = [paragraph.text.strip() for paragraph in doc.paragraphs if paragraph.text.strip()]
            return "\n".join(paragraphs).strip()
        except Exception:
            return ""

    return content.decode("utf-8", errors="ignore").strip()


def _build_document_prompt(message: str, prompt: str, file_name: str | None, file_type: str | None, file_text: str | None) -> str:
    clean_file_text = (file_text or "").strip()
    return f"""
Eres LUSTI, un asistente documental legal.
Responde en espanol claro, profesional y util.
No uses Markdown.
No inventes informacion.
Si el texto adjunto contiene campos, variables o placeholders como {{nombre}}, {{dni}} o similares, tratalo como una plantilla valida.
No digas que el documento esta vacio si hay texto real, aunque sea una plantilla corta o tenga campos por completar.
Si el documento es una plantilla, primero identifica su estructura y luego explica que datos faltan para completarla.
Si el texto adjunto realmente esta vacio o no se pudo leer, dilo claramente y pide los datos faltantes.

Prompt del asistente:
{prompt or 'Sin prompt adicional.'}

Archivo adjunto:
Nombre: {file_name or 'Sin archivo'}
Tipo: {file_type or 'Desconocido'}
Texto extraido:
{clean_file_text or 'No se pudo extraer texto util del archivo.'}

Instruccion del usuario:
{message}

Respuesta esperada:
Organiza la respuesta segun lo que pida el usuario.
Si pide resumen o analisis de documento, usa este orden:
1. Resumen breve
2. Datos clave encontrados
3. Riesgos o puntos de atencion
4. Informacion faltante
5. Siguientes pasos recomendados

Si pide extraer datos, usa este orden:
1. Partes
2. Fechas
3. Montos o remuneracion
4. Obligaciones principales
5. Observaciones

Si pide completar una plantilla:
1. Identifica la plantilla
2. Lista los campos detectados
3. Indica que campos faltan
4. Entrega el borrador completado cuando haya datos suficientes

Reglas finales:
- Lee el texto adjunto.
- No cortes frases ni dejes campos a medias.
- Si el documento es largo, prioriza una respuesta resumida pero cerrada.
- Si falta informacion, indica exactamente que falta.
""".strip()


async def _ask_gemini(prompt_text: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY no esta configurada")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload: dict[str, Any] = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt_text}],
            }
        ],
        "generationConfig": {
            "temperature": 0.25,
            "topP": 0.9,
            "maxOutputTokens": 4096,
        },
    }

    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(url, json=payload)

    if response.status_code >= 400:
        raise RuntimeError(response.text)

    data = response.json()
    text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [])
    )
    extracted = "\n".join(part.get("text", "") for part in text if part.get("text")).strip()
    if not extracted:
        raise RuntimeError("Gemini devolvio una respuesta vacia")
    return extracted


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "gemini_configured": "yes" if (os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")) else "no",
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    }


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)) -> dict[str, str]:
    extracted_text = _read_text_from_upload(file)
    return {
        "file_name": file.filename or "",
        "file_type": file.content_type or "application/octet-stream",
        "extracted_text": extracted_text,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="message is required")

    prompt_text = _build_document_prompt(
        message=payload.message,
        prompt=payload.prompt or "",
        file_name=payload.file_name,
        file_type=payload.file_type,
        file_text=payload.file_text,
    )

    try:
        response_text = await _ask_gemini(prompt_text)
    except Exception as error:
        response_text = (
            "No se pudo usar Gemini en el backend. "
            f"Detalle: {str(error).strip() or 'error desconocido'}."
        )

    return ChatResponse(
        message=response_text,
        extracted_text=payload.file_text,
        file_name=payload.file_name,
        file_type=payload.file_type,
    )


@app.post("/generate-document")
async def generate_document(
    message: str = Form(...),
    prompt: str = Form(""),
    file: UploadFile | None = File(None),
):
    extracted_text = ""
    file_name = None
    file_type = None

    if file is not None:
        file_name = file.filename
        file_type = file.content_type
        extracted_text = _read_text_from_upload(file)

    output = {
        "message": message,
        "prompt": prompt,
        "file_name": file_name,
        "file_type": file_type,
        "extracted_text": extracted_text,
        "status": "ready",
    }

    return output
