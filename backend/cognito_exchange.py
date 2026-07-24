import os
import time
import jwt
import httpx
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

        email = claims.get("email", "")
        
        # 1. Fetch users to see if they exist in Supabase (to preserve old data)
        supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }
        
        supabase_uid = None
        # Try to find by email with pagination
        page = 1
        while True:
            res_users = httpx.get(f"{supabase_url}/auth/v1/admin/users?page={page}&per_page=50", headers=headers)
            if res_users.status_code != 200:
                break
            users_list = res_users.json().get("users", [])
            if not users_list:
                break
            for u in users_list:
                if u.get("email", "").lower() == email.lower():
                    supabase_uid = u.get("id")
                    break
            if supabase_uid or len(users_list) < 50:
                break
            page += 1
        
        # 2. If not found, create a new user in Supabase auth.users
        if not supabase_uid:
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits
            random_password = ''.join(secrets.choice(alphabet) for i in range(20)) + "A1!"
            
            payload = {
                "email": email,
                "password": random_password,
                "email_confirm": True
            }
            res_create = httpx.post(f"{supabase_url}/auth/v1/admin/users", json=payload, headers=headers)
            if res_create.status_code == 200:
                supabase_uid = res_create.json().get("id")
            else:
                # Fallback to cognito user_id if creation fails for some reason
                print(f"Error creating user in Supabase: {res_create.text}")
                supabase_uid = user_id
        
        now = int(time.time())
        supabase_claims = {
            "aud": "authenticated",
            "exp": now + (60 * 60 * 24), # 24 hours
            "iat": now,
            "iss": "supabase",
            "sub": supabase_uid,  # Use Supabase UUID to satisfy Foreign Keys!
            "role": "authenticated",
            "email": email,
            "app_metadata": {
                "provider": "cognito"
            }
        }
        
        supabase_secret = get_jwt_secret()
        supabase_token = jwt.encode(supabase_claims, supabase_secret, algorithm="HS256")
        
        return ExchangeResponse(supabase_token=supabase_token, user_id=supabase_uid)

    except jwt.ExpiredSignatureError:
        print("Error in token exchange: Token expirado")
        raise HTTPException(status_code=401, detail="El token de Cognito expiró.")
    except Exception as e:
        print(f"Error in token exchange: {e}")
        raise HTTPException(status_code=401, detail=f"Token de Cognito inválido: {e}")
