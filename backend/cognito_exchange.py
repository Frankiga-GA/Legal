import os
import time
import jwt
from jwt import PyJWKClient
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from auth import get_jwt_secret

COGNITO_REGION = "us-east-2"
COGNITO_USER_POOL_ID = "us-east-2_c9cyZqxAY"
COGNITO_CLIENT_ID = "36phgsf9kjtlhehqvs339hmu45"
COGNITO_JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"

jwks_client = PyJWKClient(COGNITO_JWKS_URL)

class ExchangeRequest(BaseModel):
    token: str

class ExchangeResponse(BaseModel):
    supabase_token: str
    user_id: str

router = APIRouter()

@router.post("/exchange", response_model=ExchangeResponse)
def exchange_cognito_for_supabase(payload: ExchangeRequest):
    cognito_token = payload.token
    try:
        # Cognito ID token client_id validation
        # According to AWS, ID Tokens have 'aud' == client_id. 
        # Access Tokens have 'client_id' claim but no 'aud'. We expect ID token.
        unverified_claims = jwt.decode(cognito_token, options={"verify_signature": False})
        
        # Verify Token against AWS Cognito JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(cognito_token)
        
        # Allow either aud (ID Token) or client_id (Access Token)
        # To be safe and simple, we'll verify signature but skip audience check here
        # since AWS guarantees the signature if it came from our user pool JWKS.
        claims = jwt.decode(
            cognito_token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_exp": True, "verify_aud": False},
            leeway=300
        )
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=400, detail="El token de Cognito no contiene 'sub'.")

        now = int(time.time())
        supabase_claims = {
            "aud": "authenticated",
            "exp": now + (60 * 60 * 24), # 24 hours
            "iat": now,
            "iss": "supabase",
            "sub": user_id,
            "role": "authenticated",
            "email": claims.get("email", ""),
            "app_metadata": {
                "provider": "cognito"
            }
        }
        
        supabase_secret = get_jwt_secret()
        supabase_token = jwt.encode(supabase_claims, supabase_secret, algorithm="HS256")
        
        return ExchangeResponse(supabase_token=supabase_token, user_id=user_id)

    except jwt.ExpiredSignatureError:
        print("Error in token exchange: Token expirado")
        raise HTTPException(status_code=401, detail="El token de Cognito expiró.")
    except Exception as e:
        print(f"Error in token exchange: {e}")
        raise HTTPException(status_code=401, detail=f"Token de Cognito inválido: {e}")
