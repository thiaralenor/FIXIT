from fastapi import APIRouter, Depends, HTTPException, Header
import httpx

from app.middleware.auth import get_current_user
from app.services.supabase import SUPABASE_URL, supabase_headers

from app.schemas.comment import CommentUpdate


router = APIRouter(
    prefix="/comments",
    tags=["Comments"]
)


@router.post("/{problem_id}")
def create_comment(
    problem_id: str,
    comment_data: dict,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    """
    Create a comment on a problem.
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

    comment_text = comment_data.get("comment")

    if not comment_text:
        raise HTTPException(
            status_code=400,
            detail="Comment cannot be empty"
        )

    url = f"{SUPABASE_URL}/rest/v1/problem_comments"

    headers = supabase_headers(access_token)

    payload = {
        "problem_id": problem_id,
        "user_id": user_id,
        "comment": comment_text
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
            detail=f"Comment creation failed: {response.text}"
        )

    data = response.json()

    if not data:
        raise HTTPException(
            status_code=500,
            detail="Comment was created but no data was returned"
        )

    return data[0]


@router.get("/{problem_id}")
def get_comments(
    problem_id: str,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    """
    Get all comments belonging to a problem.
    """

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )

    access_token = authorization.split(" ", 1)[1]

    url = f"{SUPABASE_URL}/rest/v1/problem_comments"

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
            detail=f"Failed to get comments: {response.text}"
        )

    return {
        "count": len(response.json()),
        "comments": response.json()
    }


@router.patch("/{comment_id}")
def update_comment(
    comment_id: str,
    data: CommentUpdate,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
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

    url = f"{SUPABASE_URL}/rest/v1/problem_comments"

    headers = supabase_headers(access_token)

    params = {
        "id": f"eq.{comment_id}",
        "user_id": f"eq.{user_id}"
    }

    payload = {
        "comment": data.comment
    }

    response = httpx.patch(
        url,
        headers={
            **headers,
            "Prefer": "return=representation"
        },
        params=params,
        json=payload,
        timeout=15
    )

    if response.status_code not in (200, 204):
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Comment update failed: {response.text}"
        )

    result = response.json()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Comment not found or you are not the owner"
        )

    return result[0]


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
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

    url = f"{SUPABASE_URL}/rest/v1/problem_comments"

    headers = supabase_headers(access_token)

    params = {
        "id": f"eq.{comment_id}",
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
            detail=f"Comment deletion failed: {response.text}"
        )

    result = response.json() if response.text else []

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Comment not found or you are not the owner"
        )

    return {
        "message": "Comment deleted successfully",
        "comment": result[0]
    }