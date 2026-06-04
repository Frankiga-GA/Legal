"""
backend/auth.py
===============

Validacion de tokens JWT emitidos por Supabase Auth para el backend
de LUSTI. El frontend envia `Authorization: Bearer <access_token>` y
este modulo:

  1. Lee el header del JWT para detectar el algoritmo.
  2. Si es HS256/HS384/HS512 -> verifica con SUPABASE_JWT_SECRET (legacy).
  3. Si es ES256/RS256 -> descarga JWKS y verifica con clave publica
     (proyectos nuevos de Supabase, post-2024).
  4. Verifica `exp` y `aud`.
  5. Devuelve un `CurrentUser` con `user_id` y `email`.

Dependencia FastAPI:
  - `current_user`: requiere token valido, devuelve `CurrentUser`.

Configuracion en `backend/.env`:
  SUPABASE_JWT_SECRET=<valor del dashboard de Supabase>
  SUPABASE_URL=https://tu-proyecto.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service role para bypass de RLS>
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional

import httpx
import jwt
from fastapi import Header, HTTPException, status


# =============================================================================
# Tipos
# =============================================================================

@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    email: str
    role: str
    app_metadata: dict
    raw_claims: dict


class AuthError(HTTPException):
    def __init__(self, detail: str = "Unauthorized") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


# =============================================================================
# Configuracion
# =============================================================================

@lru_cache(maxsize=1)
def get_jwt_secret() -> str:
    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    if not secret:
        raise AuthError(
            "SUPABASE_JWT_SECRET no esta configurado en el backend. "
            "Copia el valor de Supabase Dashboard -> Settings -> API -> JWT Secret."
        )
    return secret


@lru_cache(maxsize=1)
def get_supabase_url() -> str:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if not url:
        raise AuthError("SUPABASE_URL no esta configurado en el backend.")
    return url


@lru_cache(maxsize=1)
def get_service_role_key() -> str:
    return os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()


# =============================================================================
# JWKS (para tokens ES256 / RS256)
# =============================================================================

@lru_cache(maxsize=1)
def get_jwks() -> dict:
    """Descarga y cachea las claves publicas de Supabase."""
    url = f"{get_supabase_url()}/auth/v1/.well-known/jwks.json"
    try:
        response = httpx.get(url, timeout=10.0)
        response.raise_for_status()
    except httpx.HTTPError as e:
        raise AuthError(f"No se pudo obtener JWKS de Supabase: {e}")
    return response.json()


def _select_signing_key_from_jwks(jwks: dict, kid: Optional[str]):
    keys = jwks.get("keys") or []
    if not keys:
        raise AuthError("JWKS sin claves publicas.")
    target = next((k for k in keys if k.get("kid") == kid), keys[0])
    kty = target.get("kty")
    if kty == "EC":
        return jwt.algorithms.ECAlgorithm.from_jwk(target)
    if kty == "RSA":
        return jwt.algorithms.RSAAlgorithm.from_jwk(target)
    raise AuthError(f"Tipo de clave JWKS no soportado: {kty}")


# =============================================================================
# Validacion de tokens
# =============================================================================

HS_ALGORITHMS = ["HS256", "HS384", "HS512"]


def verify_token(token: str) -> dict:
    """Decodifica y valida un JWT de Supabase. Lanza AuthError si falla."""
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as e:
        raise AuthError(f"Token invalido: {e}")

    if not unverified_header.get("sub") and False:
        # Solo para silenciar linter; el check real va abajo.
        pass

    alg = unverified_header.get("alg")
    kid = unverified_header.get("kid")

    if alg in HS_ALGORITHMS:
        signing_key = get_jwt_secret()
        algorithms = [alg]
    elif alg in ("ES256", "ES384", "ES512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512"):
        try:
            jwks = get_jwks()
            signing_key = _select_signing_key_from_jwks(jwks, kid)
        except AuthError:
            raise
        except Exception as e:
            raise AuthError(f"No se pudo obtener la clave publica: {e}")
        algorithms = [alg]
    else:
        raise AuthError(f"Algoritmo JWT no soportado: {alg}")

    try:
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=algorithms,
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise AuthError("Token expirado. Inicia sesion de nuevo.")
    except jwt.InvalidAudienceError:
        raise AuthError("Token con audiencia invalida.")
    except jwt.InvalidTokenError as e:
        raise AuthError(f"Token invalido: {e}")

    if not claims.get("sub"):
        raise AuthError("Token sin subject (user_id).")

    return claims


def user_from_claims(claims: dict) -> CurrentUser:
    return CurrentUser(
        user_id=str(claims["sub"]),
        email=str(claims.get("email", "")),
        role=str(claims.get("role", "authenticated")),
        app_metadata=dict(claims.get("app_metadata") or {}),
        raw_claims=claims,
    )


# =============================================================================
# Dependencias FastAPI
# =============================================================================

def _extract_bearer(authorization: Optional[str]) -> str:
    if not authorization:
        raise AuthError("Falta el header Authorization.")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthError("Header Authorization debe ser 'Bearer <token>'.")
    return parts[1].strip()


def current_user(authorization: Optional[str] = Header(default=None)) -> CurrentUser:
    """Dependencia: valida el token y devuelve el CurrentUser."""
    token = _extract_bearer(authorization)
    claims = verify_token(token)
    return user_from_claims(claims)
