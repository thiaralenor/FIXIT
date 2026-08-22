from fastapi import APIRouter, Depends, HTTPException, Header
import httpx

from app.middleware.auth import get_current_user
from app.services.supabase import SUPABASE_URL, supabase_headers


router = APIRouter(
    prefix="/shares",
    tags=["Shares"]
)


@router.post("/{problem_id}")
def create_share(
    problem_id: str,
    share_data: dict,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    """
    Record a share of a problem.

    A user can share the same problem multiple times,
    including on the same platform.
    """

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )

    access_token = authorization.split(" ", 1)[1]

    user_id = current_user.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID not found in token"
        )

    platform = share_data.get("platform")

    if not platform:
        raise HTTPException(
            status_code=400,
            detail="Platform is required"
        )

    platform = platform.strip().lower()

    allowed_platforms = {
        "whatsapp",
        "facebook",
        "x",
        "telegram",
        "email",
        "copy_link",
        "instagram",
        "linkedin",
        "snapchat",
        "tiktok"
    }

    if platform not in allowed_platforms:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid platform. Allowed platforms: "
                "whatsapp, facebook, x, telegram, email, copy_link"
            )
        )

    url = f"{SUPABASE_URL}/rest/v1/problem_shares"

    headers = supabase_headers(access_token)

    payload = {
        "problem_id": problem_id,
        "user_id": user_id,
        "platform": platform
    }

    response = httpx.post(
        url,
        headers={
            **headers,
            "Prefer": "return=representation"
        },
        json=payload,
        timeout=15
    )

    if response.status_code not in (200, 201):
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Share creation failed: {response.text}"
        )

    data = response.json()

    if not data:
        raise HTTPException(
            status_code=500,
            detail="Share was created but no data was returned"
        )

    return data[0]


@router.get("/{problem_id}")
def get_problem_shares(
    problem_id: str,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    """
    Get all shares for a problem and statistics by platform.
    """

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )

    access_token = authorization.split(" ", 1)[1]

    url = f"{SUPABASE_URL}/rest/v1/problem_shares"

    headers = supabase_headers(access_token)

    params = {
        "problem_id": f"eq.{problem_id}",
        "select": "*",
        "order": "created_at.desc"
    }

    response = httpx.get(
        url,
        headers=headers,
        params=params,
        timeout=15
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to get shares: {response.text}"
        )

    shares = response.json()

    shares_by_platform = {}

    for share in shares:
        platform = share.get("platform")

        if platform:
            shares_by_platform[platform] = (
                shares_by_platform.get(platform, 0) + 1
            )

    return {
        "problem_id": problem_id,
        "total_shares": len(shares),
        "shares_by_platform": shares_by_platform,
        "shares": shares
    }