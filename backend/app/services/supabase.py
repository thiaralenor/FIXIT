import os
import httpx

from dotenv import load_dotenv


load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing from .env")


if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY is missing from .env")


def supabase_headers(access_token: str = None):
    """
    Create headers for requests to Supabase REST API.
    """

    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }

    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    else:
        headers["Authorization"] = f"Bearer {SUPABASE_KEY}"

    return headers


def get_profile(user_id: str, access_token: str):
    """
    Get a FixIt profile using the authenticated user's access token.
    """

    url = f"{SUPABASE_URL}/rest/v1/profiles"

    headers = supabase_headers(access_token)

    params = {
        "id": f"eq.{user_id}",
        "select": "*"
    }

    response = httpx.get(
        url,
        headers=headers,
        params=params,
        timeout=15
    )

    if response.status_code != 200:
        return None

    data = response.json()

    if not data:
        return None

    return data[0]


def get_problem_categories(access_token: str = None):
    """
    Get problem categories.
    """

    url = f"{SUPABASE_URL}/rest/v1/problem_categories"

    headers = supabase_headers(access_token)

    params = {
        "select": "*"
    }

    response = httpx.get(
        url,
        headers=headers,
        params=params,
        timeout=15
    )

    if response.status_code != 200:
        return None

    return response.json()