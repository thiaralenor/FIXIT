"""
Priority prediction — classifier, not regressor, because the real schema's
problem_priority enum only has three values (low/medium/high) and
problem_predictions.predicted_priority is typed against that same enum.

Output shape matches problem_predictions exactly:
    predicted_priority   -> 'low' | 'medium' | 'high'
    priority_confidence  -> 0-1 (max class probability)

Run: python train_priority_model.py
"""
import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report

from features import load_dataset, engineer_features, PRIORITY_ORDER

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "priority_model.joblib")


def main():
    df = load_dataset(os.path.join(BASE_DIR, "data", "fixit_problems_dataset.csv"))
    df = engineer_features(df)

    category_cols = [c for c in df.columns if c.startswith("cat_")]
    feature_cols = ["log_people_affected", "log_likes", "log_comments", "age_days", "proximity_km"] + category_cols

    X = df[feature_cols]
    y = df["priority"]  # citizen-reported priority is the training label for now

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = RandomForestClassifier(n_estimators=300, max_depth=6, random_state=42, class_weight="balanced")
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    f1 = f1_score(y_test, preds, average="macro")

    print(f"Priority model — Accuracy: {acc:.2f} | Macro F1: {f1:.2f}")
    print("\n" + classification_report(y_test, preds, labels=PRIORITY_ORDER, zero_division=0))

    print("Feature importance:")
    for name, imp in sorted(zip(feature_cols, model.feature_importances_), key=lambda x: -x[1])[:8]:
        print(f"  {name:<20s} {imp:.3f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump({"model": model, "feature_cols": feature_cols, "classes": list(model.classes_)}, MODEL_PATH)
    print(f"\nSaved -> {MODEL_PATH}")


if __name__ == "__main__":
    main()
