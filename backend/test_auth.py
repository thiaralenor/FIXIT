import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


email = input("Enter user email: ")
password = input("Enter user password: ")


url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"

headers = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json"
}

data = {
    "email": email,
    "password": password
}


response = requests.post(
    url,
    headers=headers,
    json=data
)


if response.status_code == 200:

    result = response.json()

    print("\nLogin successful!")
    print("User ID:", result.get("user", {}).get("id"))
    print("Email:", result.get("user", {}).get("email"))

    print("\nACCESS TOKEN:")
    print(result.get("access_token"))

else:

    print("\nLogin failed!")
    print("Status:", response.status_code)
    print("Response:", response.text)