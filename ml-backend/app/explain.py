"""Real SHAP explanations via shap.TreeExplainer for tree models."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import shap

from .predict import _row_from_request
from .registry import SUPPORTED_MODELS, get_active_pipeline, load_pipeline, load_registry


def explain_skill_risk(
    *,
    skill: str,
    city: str,
    experience_years: float,
    model_id: str | None = None,
    features: dict[str, Any] | None = None,
    top_k: int = 8,
) -> dict[str, Any]:
    reg = load_registry()
    if model_id:
        payload = load_pipeline(model_id)
        meta = reg.get("models", {}).get(model_id, {})
    else:
        payload, meta = get_active_pipeline()
        # If active model cannot use TreeExplainer, fall back to a trained tree model.
        model_key = payload["model_key"]
        supports = SUPPORTED_MODELS.get(model_key, {}).get("supports_shap", False)
        if not supports:
            tree = next(
                (
                    m
                    for m in reg.get("models", {}).values()
                    if SUPPORTED_MODELS.get(m.get("model_key"), {}).get("supports_shap")
                ),
                None,
            )
            if tree:
                payload = load_pipeline(tree["model_id"])
                meta = tree
            else:
                return {
                    "ok": False,
                    "error": f"SHAP TreeExplainer is not supported for {model_key}. Train XGBoost or Random Forest.",
                    "shapFactors": [],
                    "demo": False,
                }

    model_key = payload["model_key"]
    supports = SUPPORTED_MODELS.get(model_key, {}).get("supports_shap", False)
    if not supports:
        return {
            "ok": False,
            "error": f"SHAP TreeExplainer is not supported for {model_key}. Use XGBoost or Random Forest.",
            "shapFactors": [],
            "demo": False,
        }

    pipe = payload["pipeline"]
    preprocess = pipe.named_steps["preprocess"]
    model = pipe.named_steps["model"]

    X = _row_from_request(payload, skill, city, experience_years, features)
    X_trans = preprocess.transform(X)
    try:
        feature_names = list(preprocess.get_feature_names_out())
    except Exception:
        feature_names = [f"f{i}" for i in range(X_trans.shape[1])]

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_trans)

    # Handle list / multi-output edge cases
    if isinstance(shap_values, list):
        vals = np.asarray(shap_values[0]).reshape(-1)
    else:
        vals = np.asarray(shap_values).reshape(-1)

    pairs = sorted(
        zip(feature_names, vals.tolist()),
        key=lambda t: abs(t[1]),
        reverse=True,
    )[:top_k]

    factors = [
        {
            "factor": name,
            "weight": round(float(weight), 6),
            "source": "shap.TreeExplainer",
        }
        for name, weight in pairs
    ]

    base_value = explainer.expected_value
    if isinstance(base_value, (list, np.ndarray)):
        base_value = float(np.asarray(base_value).reshape(-1)[0])
    else:
        base_value = float(base_value)

    return {
        "ok": True,
        "source": "ml-backend",
        "model_id": payload["model_id"],
        "model_key": model_key,
        "model_label": meta.get("label") or model_key,
        "baseValue": round(base_value, 6),
        "shapFactors": factors,
        "demo": False,
        "message": "SHAP values computed with shap.TreeExplainer on the transformed feature row.",
    }
