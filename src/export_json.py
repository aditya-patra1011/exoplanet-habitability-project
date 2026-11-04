import pandas as pd
import json
import os

OUTPUT_DIR = "frontend/public/data"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def to_records(df):
    """Return JSON-ready records, with missing values as None (NaN isn't valid JSON)."""
    return df.astype(object).where(df.notna(), None).to_dict(orient="records")


def write_json(filename, data):
    with open(f"{OUTPUT_DIR}/{filename}", "w") as f:
        json.dump(data, f, indent=2, allow_nan=False)


# ---------- Load processed data ----------
koi_labeled = pd.read_csv("data/processed/koi_labeled.csv")
candidates_pred = pd.read_csv("data/processed/koi_candidates_predicted.csv")
model_results = pd.read_csv("data/processed/phase3_model_results.csv")
habitability = pd.read_csv("data/processed/habitatbility_scores.csv")
rocky_hz = pd.read_csv("data/processed/rocky_habitable_zone_planets.csv")

# ---------- Overview summary ----------
overview = {
    "total_koi_rows": 9564,
    "labeled_rows": len(koi_labeled),
    "candidates_evaluated": len(candidates_pred),
    "predicted_real": int((candidates_pred["predicted_real"] == 1).sum()),
    "planets_evaluated": len(habitability),
    "in_hz_count": int(habitability["hz_status"].isin(["conservative_hz", "optimistic_hz"]).sum()),
    "conservative_hz_pct": round((habitability["hz_status"] == "conservative_hz").mean() * 100, 2),
    "optimistic_hz_pct": round(habitability["hz_status"].isin(["conservative_hz", "optimistic_hz"]).mean() * 100, 2),
}
write_json("overview.json", overview)

# ---------- Target distribution ----------
target_counts = {
    "Confirmed": int((koi_labeled["target"] == 1).sum()),
    "False Positive": int((koi_labeled["target"] == 0).sum()),
}
write_json("target_distribution.json", target_counts)

# ---------- Model results (Part A + Ablation) ----------
model_results_records = model_results.to_dict(orient="records")
write_json("model_results.json", model_results_records)

pivot = model_results.pivot_table(index="Model", columns="Tier", values="F1_mean", aggfunc="mean")
pivot["Full_minus_RawPhysical"] = pivot["Full"] - pivot["Raw physical"]
pivot_records = pivot.reset_index().to_dict(orient="records")
write_json("ablation_pivot.json", pivot_records)

# ---------- Habitability scores (trimmed for frontend size) ----------
habitability_trimmed = habitability[
    ["planet_name", "source", "insolation_flux", "eq_temp_k", "radius_earth", "hz_status", "esi_score"]
].dropna(subset=["insolation_flux"])

habitability_records = to_records(habitability_trimmed)
write_json("habitatbility_scores.json", habitability_records)

# ---------- Habitability summary by source ----------
source_summary = habitability.groupby("source").agg(
    total=("planet_name", "count"),
    in_conservative_hz=("hz_status", lambda x: (x == "conservative_hz").sum()),
    in_optimistic_hz=("hz_status", lambda x: (x == "optimistic_hz").sum()),
    rocky_count=("likely_rocky", "sum")
).reset_index()
source_summary["pct_conservative_hz"] = (source_summary["in_conservative_hz"] / source_summary["total"] * 100).round(2)
write_json("habitability_by_source.json", source_summary.to_dict(orient="records"))

# ---------- Top ESI candidates ----------
top_esi = habitability.dropna(subset=["esi_score"]).sort_values("esi_score", ascending=False).head(50)
top_esi_trimmed = top_esi[
    ["planet_name", "source", "radius_earth", "eq_temp_k", "insolation_flux", "hz_status", "esi_score"]
]
write_json("top_esi_candidates.json", to_records(top_esi_trimmed))

# ---------- Rocky HZ planets ----------
rocky_hz_trimmed = rocky_hz[
    ["planet_name", "source", "insolation_flux", "eq_temp_k", "radius_earth", "hz_status"]
]
write_json("rocky_hz_planets.json", to_records(rocky_hz_trimmed))

print("Exported all JSON files to", OUTPUT_DIR)