from fastapi import APIRouter, Depends, HTTPException, Header
import httpx

from app.middleware.auth import get_current_user
from app.services.supabase import SUPABASE_URL, supabase_headers


router = APIRouter(
    prefix="/likes",
    tags=["Likes"]
)


@router.post("/{problem_id}")
def like_problem(
    problem_id: str,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    """
    Like a problem.
    A user can only have one active like on a problem.
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

    url = f"{SUPABASE_URL}/rest/v1/problem_likes"

    headers = supabase_headers(access_token)

    payload = {
        "problem_id": problem_id,
        "user_id": user_id
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
        # Duplicate like
        if response.status_code == 409:
            raise HTTPException(
                status_code=409,
                detail="You have already liked this problem"
            )

        raise HTTPException(
            status_code=response.status_code,
            detail=f"Like creation failed: {response.text}"
        )

    data = response.json()

    if not data:
        raise HTTPException(
            status_code=500,
            detail="Like was created but no data was returned"
        )

    return data[0]


@router.get("/{problem_id}")
def get_problem_likes(
    problem_id: str,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    """
    Get all likes for a problem.
    """

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )

    access_token = authorization.split(" ", 1)[1]

    url = f"{SUPABASE_URL}/rest/v1/problem_likes"

    headers = supabase_headers(access_token)

    params = {
        "problem_id": f"eq.{problem_id}",
        "select": "*",
        "order": "created_at.asc"
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
            detail=f"Failed to get likes: {response.text}"
        )

    data = response.json()

    return {
        "count": len(data),
        "likes": data
    }


@router.delete("/{problem_id}")
def unlike_problem(
    problem_id: str,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    """
    Remove the authenticated user's like from a problem.
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

    url = f"{SUPABASE_URL}/rest/v1/problem_likes"

    headers = supabase_headers(access_token)

    params = {
        "problem_id": f"eq.{problem_id}",
        "user_id": f"eq.{user_id}"
    }

    response = httpx.delete(
        url,
        headers={
            **headers,
            "Prefer": "return=representation"
        },
        params=params,
        timeout=15
    )

    if response.status_code not in (200, 204):
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Like deletion failed: {response.text}"
        )

    result = response.json() if response.text else []

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Like not found"
        )

    return {
        "message": "Like removed successfully",
        "like": result[0]
    }