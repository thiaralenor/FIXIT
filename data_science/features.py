"""
Shared feature engineering — matches Database/schema_01.sql field names and
enums exactly (problem_priority: low/medium/high; problem_status: reported/solved).
"""
import numpy as np
import pandas as pd
from typing import Optional

PRIORITY_ORDER = ["low", "medium", "high"]
PRIORITY_MAP = {p: i for i, p in enumerate(PRIORITY_ORDER)}

CATEGORIES = [
    "Roads", "Water", "Electricity", "Waste", "Healthcare",
    "Education", "Security", "Infrastructure", "Environment", "Other",
]

# Same seed sensitive-site list as before — swap for a real POI dataset later.
SENSITIVE_SITES = [
    (5.9614, 10.1519), (5.9580, 10.1470), (5.9630, 10.1520),
    (4.1540, 9.2680), (4.1580, 9.2610), (4.1490, 9.2830),
]


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = np.radians(lat2 - lat1), np.radians(lon2 - lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2
    return R * 2 * np.arcsin(np.sqrt(a))


def nearest_site_km(lat, lon):
    return min(haversine_km(lat, lon, s_lat, s_lon) for s_lat, s_lon in SENSITIVE_SITES)


def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["updated_at"] = pd.to_datetime(df["updated_at"])
    return df


def engineer_features(df: pd.DataFrame, now: Optional[pd.Timestamp] = None) -> pd.DataFrame:
    """Adds model-ready numeric columns. `now` defaults to the dataset's max created_at."""
    df = df.copy()
    now = now or df["created_at"].max()

    df["priority_code"] = df["priority"].map(PRIORITY_MAP)
    df["proximity_km"] = df.apply(lambda r: nearest_site_km(r["latitude"], r["longitude"]), axis=1)
    df["is_solved"] = (df["status"] == "solved").astype(int)
    df["age_days"] = (now - df["created_at"]).dt.days
    # resolution_days proxy: updated_at - created_at for solved problems.
    # Real signal to switch to once populated: tasks.completed_at - tasks.start_date.
    df["resolution_days"] = np.where(
        df["is_solved"] == 1,
        (df["updated_at"] - df["created_at"]).dt.days.clip(lower=1),
        np.nan,
    )
    df["log_people_affected"] = np.log1p(df["people_affected"])
    df["log_likes"] = np.log1p(df["likes_count"])
    df["log_comments"] = np.log1p(df["comments_count"])
    df = pd.get_dummies(df, columns=["category"], prefix="cat")
    return df


PRIORITY_FEATURES = [
    "log_people_affected", "log_likes", "log_comments", "age_days", "proximity_km",
]  # + cat_* dummies, appended per-script

RESOLUTION_FEATURES = [
    "priority_code", "log_people_affected", "log_likes", "proximity_km",
]  # + cat_* dummies
