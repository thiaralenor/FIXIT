"""
Descriptive analytics — matches problems / problem_categories / problem_likes.
Run: python descriptive_analytics.py
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from features import load_dataset, engineer_features

OUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(OUT_DIR, exist_ok=True)


def main():
    df = load_dataset(os.path.join(os.path.dirname(__file__), "data", "fixit_problems_dataset.csv"))
    df = engineer_features(df)

    print("=" * 60)
    print(f"Total problems: {len(df)}")
    print("=" * 60)

    cat_cols = [c for c in df.columns if c.startswith("cat_")]
    counts = {c.replace("cat_", ""): df[c].sum() for c in cat_cols}
    print("\n--- Problems by category ---")
    for k, v in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {k:<16s} {v}")

    print("\n--- Problems by status ---")
    print(df["status"].value_counts())

    print("\n--- Problems by priority ---")
    print(df["priority"].value_counts().reindex(["low", "medium", "high"]))

    print("\n--- Top 10 locations by report volume ---")
    print(df["location"].value_counts().head(10))

    solved = df[df["status"] == "solved"]
    print(f"\n--- Resolution time (n={len(solved)} solved problems, proxy = updated_at - created_at) ---")
    print(solved["resolution_days"].describe())

    print("\n--- Avg likes by priority ---")
    print(df.groupby("priority")["likes_count"].mean().reindex(["low", "medium", "high"]))

    fig, axes = plt.subplots(2, 2, figsize=(12, 9))

    pd_counts = df["priority"].value_counts().reindex(["low", "medium", "high"])
    pd_counts.plot(kind="bar", ax=axes[0, 0], color="#2563eb")
    axes[0, 0].set_title("Problems by Priority")

    df["status"].value_counts().plot(kind="bar", ax=axes[0, 1], color="#16a34a")
    axes[0, 1].set_title("Problems by Status")

    cat_series = df[cat_cols].sum().sort_values()
    cat_series.index = [c.replace("cat_", "") for c in cat_series.index]
    cat_series.plot(kind="barh", ax=axes[1, 0], color="#d97706")
    axes[1, 0].set_title("Problems by Category")

    df.groupby("priority")["likes_count"].mean().reindex(["low", "medium", "high"]).plot(
        kind="bar", ax=axes[1, 1], color="#dc2626"
    )
    axes[1, 1].set_title("Avg Likes by Priority")

    plt.tight_layout()
    out_path = os.path.join(OUT_DIR, "descriptive_overview.png")
    plt.savefig(out_path, dpi=120)
    print(f"\nSaved chart -> {out_path}")


if __name__ == "__main__":
    main()
