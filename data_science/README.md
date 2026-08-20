# FixIt — Data Science / ML (aligned to `Database/schema_01.sql`)

This replaces the earlier prototype, which was built against a different
(custom Express/Prisma) schema before the real Supabase schema existed.
Everything here matches `problems`, `problem_categories`, `problem_likes`,
`problem_comments`, and `problem_predictions` as defined in
`Database/schema_01.sql` and `schema_02.sql`.

## Setup

```bash
cd data_science
python -m venv venv
source venv/Scripts/activate   # Windows Git Bash — use `source venv/bin/activate` on Mac/Linux
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Run order

```bash
python generate_dataset.py        # 100-row synthetic dataset -> data/fixit_problems_dataset.csv
python descriptive_analytics.py   # prints stats, saves outputs/descriptive_overview.png
python train_priority_model.py    # classifier: low/medium/high
python train_category_model.py    # text classifier: 10 categories from title+description
python train_resolution_model.py  # regressor: estimated days to resolve
uvicorn api:app --port 8000 --reload   # serves all three over HTTP
```

Then open `http://127.0.0.1:8000/docs` to test interactively, or:

```bash
python supabase_writer.py --problem-id <uuid> --title "..." --description "..." \
    --category Roads --priority high --people-affected 300 \
    --likes 20 --comments 5 --lat 4.1490 --lng 9.2830 --age-days 8
```

## Schema alignment — what changed from the prototype

| | Prototype (custom Express/Prisma) | Now (matches schema_01.sql) |
|---|---|---|
| Main table | `Report` | `problems` |
| Categories | 6, invented | **10 real ones**: Roads, Water, Electricity, Waste, Healthcare, Education, Security, Infrastructure, Environment, Other |
| Priority | Low/Medium/High/Critical (4) | **low/medium/high (3)** — matches `problem_priority` enum exactly |
| Status | 6-state lifecycle | **reported/solved (2)** — matches `problem_status` enum exactly |
| Social proof | numeric `confirmations` field | `likes_count` (from `problem_likes`) — `problem_confirmations` in the real schema means something different: confirming a *solved* problem was actually fixed, not "me too" |
| Priority model type | regression (0–100 Fix Score) | **classification** (low/medium/high with confidence) — matches `predicted_priority` + `priority_confidence` columns in `problem_predictions` |
| Category prediction | didn't exist | **new**: text classifier on title+description, matches `predicted_category` + `category_confidence` |
| Resolution-days label | explicit `resolution_days` column | **proxy**: `updated_at - created_at` for solved problems (see caveat below) |

## Known caveats — read before presenting

- **Priority accuracy is 50%** (macro F1 0.50) — up from a fake 100% in the first version, where the synthetic generator assigned non-overlapping people_affected ranges per priority tier (the model was reading a lookup table, not learning). I fixed that by overlapping the ranges and adding 10% label noise (simulating that citizens' self-reported priority doesn't perfectly match objective severity). 50% is a legitimate, defensible number for a 3-class problem on 100 rows — meaningfully above the 33% random baseline — and it's honest about how much a hackathon-scale dataset can actually teach a model.
- **`priority` is never a required input to the API.** It's genuinely predicted from people_affected, likes, comments, age, category, and proximity — none of which is the answer. The resolution-days estimate chains off the model's *own* predicted priority, not something the caller supplies. `priority` is accepted as an optional override only for manual testing ("what if this were high priority instead").
- **Category accuracy is 100%**, and this one's actually legitimate — it's finding genuinely distinctive words per category ("pothole" → Roads, "transformer" → Electricity), not label leakage (an earlier draft literally wrote the category name into the description text — removed). Real citizen-written text will be messier than my templates, so expect this to come down on real data; the underlying TF-IDF approach is sound either way.
- **Resolution-days model is still weak** (MAE ~6 days, negative R²) — same root cause as before: too little data, and the label itself is a proxy (`updated_at - created_at`, since `problems` has no `resolved_at`). Retrain against `tasks.completed_at` once that's populated.
- **`category` field on `problems`**: the schema uses `category_id` (a foreign key to `problem_categories`), not a text column. This dataset stores the category name directly for simplicity — resolving name → ID is left to whoever wires up the real integration.

## Files

- `generate_dataset.py` — synthetic data generator (100 rows), clearly labeled as prototype data
- `features.py` — shared feature engineering, single source of truth for both training scripts and the API
- `descriptive_analytics.py` — stats + chart, no ML
- `train_priority_model.py`, `train_category_model.py`, `train_resolution_model.py`
- `api.py` — FastAPI service; `/predict/all` returns a payload shaped exactly like a `problem_predictions` row
- `supabase_writer.py` — calls the ML API, then inserts the result into `problem_predictions` via Supabase's REST API (plain `requests`, no extra SDK)
