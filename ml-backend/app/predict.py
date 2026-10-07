"""Load saved pipelines and run skill-risk predictions."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from .registry import get_active_pipeline, load_pipeline, load_registry


def _band(score: float) -> str:
    if score >= 66:
        return "High"
    if score >= 36:
        return "Medium"
    return "Low"


def _row_from_request(
    payload: dict[str, Any],
    skill: str,
    city: str,
    experience_years: float,
    extras: dict[str, Any] | None,
) -> pd.DataFrame:
    features: list[str] = payload["features"]
    column_map: dict[str, Any] = payload.get("column_map") or {}
    row: dict[str, Any] = {}

    skill_col = column_map.get("skill")
    city_col = column_map.get("city")
    exp_col = column_map.get("experience")

    for f in features:
        if skill_col and f == skill_col:
            row[f] = skill
        elif city_col and f == city_col:
            row[f] = city
        elif exp_col and f == exp_col:
            row[f] = experience_years
        elif f.lower() in {"skill", "skills", "skill_name"}:
            row[f] = skill
        elif f.lower() in {"city", "location", "hub"}:
            row[f] = city
        elif f.lower() in {"experience", "experience_years", "years", "yrs"}:
            row[f] = experience_years
        else:
            row[f] = None

    if extras:
        for k, v in extras.items():
            if k in features:
                row[k] = v

    return pd.DataFrame([row], columns=features)


def predict_skill_risk(
    *,
    skill: str,
    city: str,
    experience_years: float,
    model_id: str | None = None,
    features: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if model_id:
        payload = load_pipeline(model_id)
        reg = load_registry()
        meta = reg.get("models", {}).get(model_id, {})
    else:
        payload, meta = get_active_pipeline()

    pipe = payload["pipeline"]
    X = _row_from_request(payload, skill, city, experience_years, features)
    pred = float(np.asarray(pipe.predict(X)).reshape(-1)[0])
    # Clamp to a sensible 0–100 risk scale when the target looks like a score
    exposure = float(np.clip(pred, 0, 100)) if 0 <= pred <= 150 else pred
    half_life = max(4.0, round((100 - min(exposure, 100)) * 0.32, 1))
    spread = half_life * 0.18

    return {
        "ok": True,
        "source": "ml-backend",
        "model_id": payload["model_id"],
        "model_key": payload["model_key"],
        "model_label": meta.get("label") or payload["model_key"],
        "dataset_name": payload.get("dataset_name"),
        "target": payload.get("target"),
        "skill": skill,
        "city": city,
        "experienceYears": experience_years,
        "exposureScore": round(exposure, 2),
        "exposureBand": _band(min(max(exposure, 0), 100)),
        "halfLifeMonths": half_life,
        "halfLifeCi": [round(half_life - spread, 1), round(half_life + spread, 1)],
        "rawPrediction": round(pred, 6),
        "featuresUsed": list(payload["features"]),
        "metrics": payload.get("metrics"),
        "demo": False,
    }
