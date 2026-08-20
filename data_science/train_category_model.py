"""
Category prediction from free-text title + description — matches
problem_predictions.predicted_category / category_confidence.

Uses TF-IDF + Logistic Regression: simple, fast to train, and gives real
probability estimates (needed for category_confidence) unlike some other
fast text classifiers.

Run: python train_category_model.py
"""
import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "category_model.joblib")


def main():
    df = pd.read_csv(os.path.join(BASE_DIR, "data", "fixit_problems_dataset.csv"))
    df["text"] = df["title"].fillna("") + ". " + df["description"].fillna("")

    X = df["text"]
    y = df["category"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=2000, ngram_range=(1, 2), min_df=1)),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    acc = accuracy_score(y_test, preds)
    f1 = f1_score(y_test, preds, average="macro")
    print(f"Category model — Accuracy: {acc:.2f} | Macro F1: {f1:.2f}")
    print("\n" + classification_report(y_test, preds, zero_division=0))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Saved -> {MODEL_PATH}")


if __name__ == "__main__":
    main()
