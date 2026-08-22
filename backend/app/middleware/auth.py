import os

import jwt
import httpx

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv


load_dotenv()


SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL")


if not SUPABASE_JWKS_URL:
    raise ValueError(
        "SUPABASE_JWKS_URL is missing from .env"
    )


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        # Download Supabase public signing keys
        response = httpx.get(
            SUPABASE_JWKS_URL,
            timeout=15
        )

        response.raise_for_status()

        jwks = response.json()

        # Get the key ID from the JWT header
        unverified_header = jwt.get_unverified_header(token)

        kid = unverified_header.get("kid")

        if not kid:
            raise HTTPException(
                status_code=401,
                detail="Token key ID is missing"
            )

        # Find matching public key
        key_data = None

        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                key_data = key
                break

        if not key_data:
            raise HTTPException(
                status_code=401,
                detail="Signing key not found"
            )

        public_key = jwt.algorithms.ECAlgorithm.from_jwk(key_data)

        # Verify JWT
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256"],
            audience="authenticated"
        )

        return payload

    except HTTPException:
        raise

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Authentication token has expired"
        )

    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication token: {str(e)}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )