"""
Writes a prediction into the real problem_predictions table via Supabase's
auto-generated REST API (PostgREST) — using plain `requests`, deliberately,
instead of the `supabase-py` package. supabase-py pulls in async deps
(gotrue, realtime, websockets) that add install surface for no benefit here;
a single REST POST is all this needs.

Usage:
    export SUPABASE_URL="https://<project>.supabase.co"
    export SUPABASE_SERVICE_ROLE_KEY="..."   # service role, NOT the anon key
    python supabase_writer.py --problem-id <uuid> --title "..." --description "..." \
        --category Roads --priority high --people-affected 300 \
        --likes 20 --comments 5 --lat 4.1490 --lng 9.2830 --age-days 8

Requires the ML API (api.py) running locally on the default port.
"""
import os
import sys
import argparse
import requests

ML_API_URL = os.environ.get("ML_API_URL", "http://localhost:8000")


def get_prediction(payload: dict) -> dict:
    res = requests.post(f"{ML_API_URL}/predict/all", json=payload, timeout=5)
    res.raise_for_status()
    return res.json()


def write_to_supabase(prediction: dict):
    supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
    service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    row = {
        "problem_id": prediction["problem_id"],
        "predicted_category": prediction["predicted_category"],
        "predicted_priority": prediction["predicted_priority"],
        "category_confidence": prediction["category_confidence"],
        "priority_confidence": prediction["priority_confidence"],
        "model_version": prediction["model_version"],
    }

    res = requests.post(
        f"{supabase_url}/rest/v1/problem_predictions",
        json=row,
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        timeout=10,
    )
    res.raise_for_status()
    return res.json()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--problem-id", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--category", required=True)
    parser.add_argument("--priority", required=True, choices=["low", "medium", "high"])
    parser.add_argument("--people-affected", type=int, required=True)
    parser.add_argument("--likes", type=int, default=0)
    parser.add_argument("--comments", type=int, default=0)
    parser.add_argument("--lat", type=float, required=True)
    parser.add_argument("--lng", type=float, required=True)
    parser.add_argument("--age-days", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true", help="Print the prediction but don't write to Supabase")
    args = parser.parse_args()

    payload = {
        "problem_id": args.problem_id,
        "title": args.title,
        "description": args.description,
        "category": args.category,
        "priority": args.priority,
        "people_affected": args.people_affected,
        "likes_count": args.likes,
        "comments_count": args.comments,
        "latitude": args.lat,
        "longitude": args.lng,
        "age_days": args.age_days,
    }

    prediction = get_prediction(payload)
    print("Prediction:", prediction)

    if args.dry_run:
        print("(--dry-run set, skipping Supabase write)")
        return

    result = write_to_supabase(prediction)
    print("Written to problem_predictions:", result)


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        print(f"HTTP error: {e.response.status_code} {e.response.text}", file=sys.stderr)
        sys.exit(1)
    except KeyError as e:
        print(f"Missing required env var: {e}", file=sys.stderr)
        sys.exit(1)
