from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Header
)

import httpx

from app.middleware.auth import get_current_user
from app.schemas.problem import (
    ProblemCreate,
    ProblemUpdate
)
from app.services.supabase import (
    SUPABASE_URL,
    SUPABASE_KEY
)


router = APIRouter(
    prefix="/problems",
    tags=["Problems"]
)


def get_access_token(authorization: str):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )

    parts = authorization.split(" ", 1)

    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header"
        )

    return parts[1]


@router.post("")
def create_problem(
    problem: ProblemCreate,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    access_token = get_access_token(authorization)

    user_id = current_user.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID not found in token"
        )

    url = f"{SUPABASE_URL}/rest/v1/problems"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    data = problem.model_dump(exclude_none=True)

    # Force reported_by to authenticated user
    data["reported_by"] = user_id

    response = httpx.post(
        url,
        headers=headers,
        json=data,
        timeout=15
    )

    if response.status_code not in [200, 201]:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    result = response.json()

    return result[0] if result else None


@router.get("")
def get_problems(
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    access_token = get_access_token(authorization)

    url = f"{SUPABASE_URL}/rest/v1/problems"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    params = {
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
            detail=response.text
        )

    problems = response.json()

    return {
        "count": len(problems),
        "problems": problems
    }


@router.patch("/{problem_id}")
def update_problem(
    problem_id: str,
    problem: ProblemUpdate,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    access_token = get_access_token(authorization)

    user_id = current_user.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID not found in token"
        )

    url = f"{SUPABASE_URL}/rest/v1/problems"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    params = {
        "id": f"eq.{problem_id}",
        "reported_by": f"eq.{user_id}"
    }

    data = problem.model_dump(exclude_none=True)

    if not data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    response = httpx.patch(
        url,
        headers=headers,
        params=params,
        json=data,
        timeout=15
    )

    if response.status_code not in [200, 204]:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    result = response.json()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Problem not found or you are not allowed to update it"
        )

    return result[0]


@router.delete("/{problem_id}")
def delete_problem(
    problem_id: str,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    access_token = get_access_token(authorization)

    user_id = current_user.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID not found in token"
        )

    url = f"{SUPABASE_URL}/rest/v1/problems"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    params = {
        "id": f"eq.{problem_id}",
        "reported_by": f"eq.{user_id}"
    }

    response = httpx.delete(
        url,
        headers=headers,
        params=params,
        timeout=15
    )

    if response.status_code not in [200, 204]:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    result = response.json()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Problem not found or you are not allowed to delete it"
        )

    return {
        "message": "Problem deleted successfully",
        "problem": result[0]
    }