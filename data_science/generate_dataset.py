"""
Synthetic FixIt dataset generator — matches Database/schema_01.sql exactly.

Mirrors: problems (+ people_affected, priority, status), problem_categories
(the 10 real seeded categories), problem_likes (social-proof signal, since
problem_confirmations in the real schema is for confirming a *solved* problem
was actually fixed — not a duplicate/"me too" signal), and problem_comments.

Run: python generate_dataset.py
"""
import random
import uuid
import csv
import os
from datetime import datetime, timedelta

random.seed(7)

# Exact category list from schema_01.sql section 19 (DEFAULT CATEGORIES)
CATEGORIES = {
    "Roads": ["Pothole", "Erosion damage", "Bridge damage", "Flooded road"],
    "Water": ["Broken pipe", "No water supply", "Contaminated well", "Leaking pipeline"],
    "Electricity": ["Power outage", "Fallen power line", "Transformer fault", "Streetlight out"],
    "Waste": ["Illegal dumping", "Overflowing bin", "Burning waste smoke", "Market waste pile-up"],
    "Healthcare": ["Clinic understaffed", "No medicine supply", "Ambulance access blocked"],
    "Education": ["Classroom damage", "No teaching staff", "School roof leaking"],
    "Security": ["No security patrol", "Broken street signage", "Unsafe pathway lighting"],
    "Infrastructure": ["Collapsed footbridge", "Damaged public building", "Broken public toilet"],
    "Environment": ["Deforestation", "River pollution", "Air pollution from burning"],
    "Other": ["Community complaint", "Public nuisance"],
}

# priority reflects the real enum: low / medium / high (no "critical" in this schema)
PRIORITIES = ["low", "medium", "high"]
PRIORITY_WEIGHTS = [0.40, 0.40, 0.20]

LOCATIONS = [
    ("Mankon", 5.9660, 10.1450), ("Nkwen", 5.9730, 10.1660), ("Bamenda City Center", 5.9600, 10.1500),
    ("Ntarikon", 5.9670, 10.1580), ("Bamenda Main Market", 5.9630, 10.1520), ("Bali", 5.8940, 10.0090),
    ("Mendankwe", 5.9500, 10.1300), ("Nkambe", 6.5830, 10.6670), ("Ndop", 5.7500, 10.4500),
    ("Wum", 6.3830, 10.0670), ("Mbengwi", 6.0000, 9.9500), ("Bafut", 6.0980, 10.1050),
    ("Buea Town", 4.1560, 9.2620), ("Molyko", 4.1490, 9.2830), ("Great Soppo", 4.1670, 9.2750),
    ("Mile 17", 4.1330, 9.2450), ("Small Soppo", 4.1300, 9.2800), ("Muea", 4.1200, 9.2400),
    ("Sandpit", 4.1580, 9.2700), ("Mile 4", 4.1420, 9.2500), ("Mutengene", 4.0900, 9.3170),
    ("Down Beach Limbe", 4.0220, 9.2110), ("Mile 16", 4.1450, 9.2200), ("Mbatu", 4.1350, 9.2650),
]

TITLE_TEMPLATES = {
    "Pothole": "Large pothole on {loc} road",
    "Erosion damage": "Road erosion getting worse near {loc}",
    "Bridge damage": "Damaged bridge near {loc}",
    "Flooded road": "Road flooding every rainy season in {loc}",
    "Broken pipe": "Broken water pipe flooding the street in {loc}",
    "No water supply": "No water supply for over a week in {loc}",
    "Contaminated well": "Well water looks contaminated in {loc}",
    "Leaking pipeline": "Pipeline leak wasting water near {loc}",
    "Power outage": "Frequent power outages in {loc}",
    "Fallen power line": "Fallen power line near {loc}, dangerous",
    "Transformer fault": "Transformer sparking near {loc}",
    "Streetlight out": "Streetlights not working in {loc}",
    "Illegal dumping": "Illegal waste dumping site near {loc}",
    "Overflowing bin": "Overflowing bin behind the market in {loc}",
    "Burning waste smoke": "Waste burning causing smoke in {loc}",
    "Market waste pile-up": "Waste piling up in {loc} market",
    "Clinic understaffed": "{loc} clinic short on nursing staff",
    "No medicine supply": "Health center in {loc} out of basic medicine",
    "Ambulance access blocked": "Ambulance can't reach {loc} due to road state",
    "Classroom damage": "Damaged classroom roof in {loc} school",
    "No teaching staff": "Primary school in {loc} lacking teachers",
    "School roof leaking": "School roof leaking during rain in {loc}",
    "No security patrol": "No night patrol in {loc} lately",
    "Broken street signage": "Missing street signage near {loc}",
    "Unsafe pathway lighting": "Dark, unsafe walking path in {loc}",
    "Collapsed footbridge": "Footbridge collapsed near {loc}",
    "Damaged public building": "Public building in disrepair in {loc}",
    "Broken public toilet": "Public toilet out of service in {loc}",
    "Deforestation": "Illegal tree felling near {loc}",
    "River pollution": "River near {loc} polluted by waste",
    "Air pollution from burning": "Heavy smoke affecting {loc} residents",
    "Community complaint": "Ongoing community issue in {loc}",
    "Public nuisance": "Public nuisance reported in {loc}",
}

DESC_TAIL = [
    "This has been affecting daily life for residents nearby.",
    "Several neighbors have raised the same concern.",
    "It has gotten worse over the past few weeks.",
    "We would appreciate this being looked into soon.",
    "This poses a risk to children and elderly people in the area.",
]


def rand_datetime(days_back_max=50):
    d = datetime(2026, 8, 19) - timedelta(days=random.randint(1, days_back_max), hours=random.randint(0, 23))
    return d


def main():
    rows = []
    for i in range(100):
        category = random.choice(list(CATEGORIES.keys()))
        subcat = random.choice(CATEGORIES[category])
        loc_name, lat, lng = random.choice(LOCATIONS)
        lat_j = round(lat + random.uniform(-0.01, 0.01), 5)
        lng_j = round(lng + random.uniform(-0.01, 0.01), 5)

        priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]
        created_at = rand_datetime()
        age_days = (datetime(2026, 8, 19) - created_at).days

        # Overlapping ranges (not clean-separated tiers) so priority isn't a
        # trivial lookup on people_affected alone — a real classifier has to
        # weigh multiple weak signals, same as it will on real citizen data.
        base_people = {"low": (2, 150), "medium": (60, 400), "high": (180, 900)}[priority]
        people_affected = random.randint(*base_people)

        # Citizens' self-reported priority is subjective and doesn't always
        # match the objective severity signals — simulate that noise so the
        # label isn't perfectly predictable from features (10% relabeled).
        if random.random() < 0.10:
            priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]

        # likes act as the social-proof / "me too" signal in this schema
        likes_count = max(0, int(people_affected / random.uniform(20, 50)) + random.randint(0, 4))
        comments_count = max(0, int(likes_count / random.uniform(2, 5)))

        # status: only 'reported' or 'solved' in this schema
        solve_prob = min(0.85, age_days / 40)
        status = "solved" if random.random() < solve_prob else "reported"

        if status == "solved":
            resolved_after_days = random.randint(1, max(1, min(age_days, 25)))
            updated_at = created_at + timedelta(days=resolved_after_days)
        else:
            updated_at = created_at + timedelta(days=random.randint(0, min(age_days, 3)))

        title = TITLE_TEMPLATES[subcat].format(loc=loc_name)
        description = f"{title}. {random.choice(DESC_TAIL)}"

        rows.append({
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "category": category,
            "subcategory": subcat,
            "priority": priority,
            "status": status,
            "location": loc_name,
            "latitude": lat_j,
            "longitude": lng_j,
            "people_affected": people_affected,
            "likes_count": likes_count,
            "comments_count": comments_count,
            "created_at": created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        })

    out_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "fixit_problems_dataset.csv")

    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} rows -> {out_path}")


if __name__ == "__main__":
    main()
