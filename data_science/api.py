"""
FixIt ML Service — output shapes match Database/schema_01.sql's
problem_predictions table so a row from this API can be inserted directly.

Run:  uvicorn api:app --port 8000 --reload
Docs: http://127.0.0.1:8000/docs
"""
import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel

from features import nearest_site_km, PRIORITY_MAP, CATEGORIES

BASE_DIR = os.path.dirname(__file__)
app = FastAPI(title="FixIt ML Service")

MODEL_VERSION = "v1-synthetic-2026-08-19"

priority_bundle = joblib.load(os.path.join(BASE_DIR, "models", "priority_model.joblib"))
category_pipeline = joblib.load(os.path.join(BASE_DIR, "models", "category_model.joblib"))
resolution_bundle = joblib.load(os.path.join(BASE_DIR, "models", "resolution_model.joblib"))


class ProblemInput(BaseModel):
    problem_id: Optional[str] = None
    title: str
    description: str
    category: str            # citizen selects this at report time — legitimate input, not predicted
    people_affected: int
    likes_count: int = 0
    comments_count: int = 0
    latitude: float
    longitude: float
    age_days: int = 0
    priority: Optional[str] = None  # optional override for standalone testing only — normally NOT provided


def build_priority_row(input: ProblemInput, feature_cols: list[str]) -> pd.DataFrame:
    proximity_km = nearest_site_km(input.latitude, input.longitude)
    row = {
        "log_people_affected": np.log1p(input.people_affected),
        "log_likes": np.log1p(input.likes_count),
        "log_comments": np.log1p(input.comments_count),
        "age_days": input.age_days,
        "proximity_km": proximity_km,
    }
    for cat in CATEGORIES:
        row[f"cat_{cat}"] = 1 if input.category == cat else 0
    return pd.DataFrame([row])[feature_cols]


def build_resolution_row(input: ProblemInput, feature_cols: list[str], priority: str) -> pd.DataFrame:
    proximity_km = nearest_site_km(input.latitude, input.longitude)
    row = {
        "priority_code": PRIORITY_MAP.get(priority, 1),
        "log_people_affected": np.log1p(input.people_affected),
        "log_likes": np.log1p(input.likes_count),
        "proximity_km": proximity_km,
    }
    for cat in CATEGORIES:
        row[f"cat_{cat}"] = 1 if input.category == cat else 0
    return pd.DataFrame([row])[feature_cols]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict/priority")
def predict_priority(input: ProblemInput):
    cols = priority_bundle["feature_cols"]
    X = build_priority_row(input, cols)
    proba = priority_bundle["model"].predict_proba(X)[0]
    classes = priority_bundle["classes"]
    best_idx = int(np.argmax(proba))
    return {
        "problem_id": input.problem_id,
        "predicted_priority": classes[best_idx],
        "priority_confidence": round(float(proba[best_idx]), 3),
        "model_version": MODEL_VERSION,
    }


@app.post("/predict/category")
def predict_category(input: ProblemInput):
    text = f"{input.title}. {input.description}"
    proba = category_pipeline.predict_proba([text])[0]
    classes = category_pipeline.classes_
    best_idx = int(np.argmax(proba))
    return {
        "problem_id": input.problem_id,
        "predicted_category": classes[best_idx],
        "category_confidence": round(float(proba[best_idx]), 3),
        "model_version": MODEL_VERSION,
    }


@app.post("/predict/resolution-days")
def predict_resolution(input: ProblemInput):
    """
    Uses input.priority if explicitly passed (useful for testing "what if
    priority were X"), otherwise chains off this service's own priority
    prediction — a new report never actually has a known priority yet.
    """
    priority = input.priority
    if priority is None:
        priority = predict_priority(input)["predicted_priority"]

    cols = resolution_bundle["feature_cols"]
    X = build_resolution_row(input, cols, priority)
    days = float(resolution_bundle["model"].predict(X)[0])
    return {
        "problem_id": input.problem_id,
        "estimated_resolution_days": max(1, round(days)),
        "priority_used": priority,
    }


@app.post("/predict/all")
def predict_all(input: ProblemInput):
    """Convenience endpoint: returns one object ready to insert into problem_predictions."""
    priority_result = predict_priority(input)
    category_result = predict_category(input)

    # Resolution estimate chains off the *predicted* priority, not a citizen
    # input — nothing in this endpoint requires the caller to already know
    # the answer we're computing.
    cols = resolution_bundle["feature_cols"]
    X = build_resolution_row(input, cols, priority_result["predicted_priority"])
    days = float(resolution_bundle["model"].predict(X)[0])

    return {
        "problem_id": input.problem_id,
        "predicted_category": category_result["predicted_category"],
        "category_confidence": category_result["category_confidence"],
        "predicted_priority": priority_result["predicted_priority"],
        "priority_confidence": priority_result["priority_confidence"],
        "estimated_resolution_days": max(1, round(days)),
        "model_version": MODEL_VERSION,
        "created_at": datetime.utcnow().isoformat(),
    }
