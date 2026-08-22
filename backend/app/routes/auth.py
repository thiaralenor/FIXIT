from fastapi import APIRouter, Depends, HTTPException, Header

from app.middleware.auth import get_current_user
from app.services.supabase import get_profile


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):

    user_id = current_user.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID not found in token"
        )

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )

    parts = authorization.split(" ", 1)

    if len(parts) != 2:
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header"
        )

    access_token = parts[1]

    profile = get_profile(
        user_id,
        access_token
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="FixIt profile not found"
        )

    return {
        "user": {
            "id": user_id,
            "email": current_user.get("email"),
            "role": profile.get("role"),
            "full_name": profile.get("full_name"),
            "organization_id": profile.get("organization_id")
        }
    }