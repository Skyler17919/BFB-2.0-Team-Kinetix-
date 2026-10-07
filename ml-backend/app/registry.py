"""Model registry — load/save trained pipelines with joblib."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
REGISTRY_PATH = ARTIFACTS_DIR / "registry.json"

SUPPORTED_MODELS = {
    "xgboost": {
        "label": "XGBoost",
        "class": "XGBRegressor",
        "supports_shap": True,
    },
    "rf": {
        "label": "Random Forest",
        "class": "RandomForestRegressor",
        "supports_shap": True,
    },
    "gbm": {
        "label": "Gradient Boosting",
        "class": "GradientBoostingRegressor",
        "supports_shap": True,
    },
    "linreg": {
        "label": "Linear Regression",
        "class": "LinearRegression",
        "supports_shap": False,
    },
}


def ensure_dirs() -> None:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


def _empty_registry() -> dict[str, Any]:
    return {
        "active_model_id": None,
        "best_model_key": None,
        "models": {},
        "last_train": None,
        "available_algorithms": {
            key: {
                **meta,
                "status": "ready",
                "trained": False,
            }
            for key, meta in SUPPORTED_MODELS.items()
        },
    }


def load_registry() -> dict[str, Any]:
    ensure_dirs()
    if not REGISTRY_PATH.exists():
        reg = _empty_registry()
        save_registry(reg)
        return reg
    with REGISTRY_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
    # Ensure algorithm catalog is always present
    for key, meta in SUPPORTED_MODELS.items():
        slot = data.setdefault("available_algorithms", {}).setdefault(key, {})
        slot.setdefault("label", meta["label"])
        slot.setdefault("class", meta["class"])
        slot.setdefault("supports_shap", meta["supports_shap"])
        trained = any(
            m.get("model_key") == key and m.get("status") == "trained"
            for m in data.get("models", {}).values()
        )
        slot["trained"] = trained
        slot["status"] = "trained" if trained else "ready"
    return data


def save_registry(reg: dict[str, Any]) -> None:
    ensure_dirs()
    with REGISTRY_PATH.open("w", encoding="utf-8") as f:
        json.dump(reg, f, indent=2)


def artifact_path(model_id: str) -> Path:
    return ARTIFACTS_DIR / f"{model_id}.joblib"


def save_pipeline(model_id: str, payload: dict[str, Any]) -> Path:
    ensure_dirs()
    path = artifact_path(model_id)
    joblib.dump(payload, path)
    return path


def load_pipeline(model_id: str) -> dict[str, Any]:
    path = artifact_path(model_id)
    if not path.exists():
        raise FileNotFoundError(f"Model artifact not found: {model_id}")
    return joblib.load(path)


def register_training_run(
    *,
    results: list[dict[str, Any]],
    best_model_key: str,
    dataset_name: str,
    target: str,
    features: list[str],
    column_map: dict[str, Any],
    n_rows: int,
    n_features: int,
) -> dict[str, Any]:
    reg = load_registry()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    models = reg.setdefault("models", {})

    for result in results:
        key = result["model_key"]
        model_id = f"{key}_{stamp}"
        path = save_pipeline(
            model_id,
            {
                "model_id": model_id,
                "model_key": key,
                "pipeline": result["pipeline"],
                "feature_names_out": result["feature_names_out"],
                "target": target,
                "features": features,
                "column_map": column_map,
                "metrics": result["metrics"],
                "dataset_name": dataset_name,
                "trained_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        models[model_id] = {
            "model_id": model_id,
            "model_key": key,
            "label": SUPPORTED_MODELS[key]["label"],
            "status": "trained",
            "dataset_name": dataset_name,
            "target": target,
            "features": features,
            "column_map": column_map,
            "metrics": result["metrics"],
            "artifact_path": str(path),
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "n_rows": n_rows,
            "n_features": n_features,
            "supports_shap": SUPPORTED_MODELS[key]["supports_shap"],
        }
        result["model_id"] = model_id

    best = next(r for r in results if r["model_key"] == best_model_key)
    reg["active_model_id"] = best["model_id"]
    reg["best_model_key"] = best_model_key
    reg["last_train"] = {
        "at": datetime.now(timezone.utc).isoformat(),
        "dataset_name": dataset_name,
        "target": target,
        "features": features,
        "best_model_key": best_model_key,
        "best_model_id": best["model_id"],
        "results": [
            {
                "model_key": r["model_key"],
                "model_id": r["model_id"],
                "label": SUPPORTED_MODELS[r["model_key"]]["label"],
                "metrics": r["metrics"],
            }
            for r in results
        ],
    }
    save_registry(reg)
    return reg


def get_active_pipeline() -> tuple[dict[str, Any], dict[str, Any]]:
    reg = load_registry()
    active_id = reg.get("active_model_id")
    if not active_id:
        raise FileNotFoundError("No trained model available. Train a model first.")
    meta = reg["models"].get(active_id)
    if not meta:
        raise FileNotFoundError("Active model metadata missing from registry.")
    payload = load_pipeline(active_id)
    return payload, meta
