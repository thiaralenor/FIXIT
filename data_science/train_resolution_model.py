"""
Predicts days-to-resolution for an open ('reported') problem.

IMPORTANT caveat: schema_01.sql has no resolved_at column on `problems`.
This trains on a proxy label: (updated_at - created_at) for status='solved'
rows. That's a reasonable stand-in for now, but the more accurate source
once populated is tasks.completed_at - tasks.start_date (organizations
track actual work there). Swap the label the moment task data exists —
everything else in this pipeline stays the same.

Run: python train_resolution_model.py
"""
import os
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

from features import load_dataset, engineer_features

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "resolution_model.joblib")


def main():
    df = load_dataset(os.path.join(BASE_DIR, "data", "fixit_problems_dataset.csv"))
    df = engineer_features(df)

    solved = df[df["is_solved"] == 1].copy()
    print(f"Training on {len(solved)} solved problems (proxy resolution_days label)")

    category_cols = [c for c in solved.columns if c.startswith("cat_")]
    feature_cols = ["priority_code", "log_people_affected", "log_likes", "proximity_km"] + category_cols

    X = solved[feature_cols]
    y = solved["resolution_days"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    model = GradientBoostingRegressor(n_estimators=150, max_depth=3, learning_rate=0.05, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"Resolution-time model — MAE: {mae:.2f} days | R^2: {r2:.3f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump({"model": model, "feature_cols": feature_cols}, MODEL_PATH)
    print(f"Saved -> {MODEL_PATH}")


if __name__ == "__main__":
    main()
