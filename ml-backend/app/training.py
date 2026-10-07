"""Real training: preprocess → split → fit → evaluate → persist."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor

from .registry import SUPPORTED_MODELS, register_training_run


def read_dataset(filename: str, raw: bytes) -> pd.DataFrame:
    name = filename.lower()
    bio = BytesIO(raw)
    if name.endswith(".csv") or name.endswith(".txt"):
        return pd.read_csv(bio)
    if name.endswith(".xlsx") or name.endswith(".xls"):
        return pd.read_excel(bio)
    if name.endswith(".parquet"):
        return pd.read_parquet(bio)
    raise ValueError(
        f"Unsupported file type for '{filename}'. Use CSV, XLSX, or Parquet."
    )


def dataset_summary(df: pd.DataFrame, filename: str) -> dict[str, Any]:
    missing = int(df.isna().sum().sum())
    dup = int(df.duplicated().sum())
    numeric = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    datetime_cols = [c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])]
    categorical = [c for c in df.columns if c not in numeric and c not in datetime_cols]
    sample = df.head(8).astype(object).where(pd.notnull(df.head(8)), None).to_dict(orient="records")
    return {
        "file_name": filename,
        "rows": int(len(df)),
        "columns": [str(c) for c in df.columns],
        "missing_values": missing,
        "duplicate_rows": dup,
        "numeric_columns": numeric,
        "categorical_columns": categorical,
        "date_columns": datetime_cols,
        "sample_rows": sample,
        "dtypes": {str(c): str(df[c].dtype) for c in df.columns},
    }


def _build_estimator(model_key: str):
    if model_key == "xgboost":
        return XGBRegressor(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="reg:squarederror",
            random_state=42,
            n_jobs=2,
        )
    if model_key == "rf":
        return RandomForestRegressor(
            n_estimators=200,
            max_depth=12,
            random_state=42,
            n_jobs=2,
        )
    if model_key == "gbm":
        return GradientBoostingRegressor(random_state=42)
    if model_key == "linreg":
        return LinearRegression()
    raise ValueError(f"Unknown model_key: {model_key}")


def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "mae": round(mae, 6),
        "rmse": round(rmse, 6),
        "r2": round(r2, 6),
    }


def train_models(
    *,
    filename: str,
    raw: bytes,
    target: str,
    features: list[str],
    model_keys: list[str] | None = None,
    column_map: dict[str, Any] | None = None,
    test_size: float = 0.2,
) -> dict[str, Any]:
    if not target or not str(target).strip():
        return {"ok": False, "error": "No valid training target found."}

    df = read_dataset(filename, raw)
    if target not in df.columns:
        return {"ok": False, "error": "No valid training target found."}

    feats = [f for f in features if f and f != target and f in df.columns]
    if not feats:
        return {"ok": False, "error": "No valid feature columns selected."}

    y = pd.to_numeric(df[target], errors="coerce")
    if y.notna().sum() < 10:
        return {
            "ok": False,
            "error": "No valid training target found. Target must be numeric with ≥10 non-null rows.",
        }

    work = df[feats].copy()
    work[target] = y
    work = work.dropna(subset=[target])
    if len(work) < 10:
        return {
            "ok": False,
            "error": "Insufficient rows after dropping invalid targets (need ≥10).",
        }

    X = work[feats]
    y_clean = work[target].astype(float)

    numeric_cols = [c for c in feats if pd.api.types.is_numeric_dtype(X[c])]
    categorical_cols = [c for c in feats if c not in numeric_cols]

    # Coerce object columns that are mostly numeric
    for c in list(categorical_cols):
        coerced = pd.to_numeric(X[c], errors="coerce")
        if coerced.notna().mean() >= 0.7:
            X[c] = coerced
            numeric_cols.append(c)
            categorical_cols.remove(c)

    for c in categorical_cols:
        X[c] = X[c].astype(str).replace({"nan": np.nan, "None": np.nan})

    keys = model_keys or list(SUPPORTED_MODELS.keys())
    keys = [k for k in keys if k in SUPPORTED_MODELS]
    if not keys:
        return {"ok": False, "error": "No supported regression models selected."}

    # Logistic Regression intentionally excluded for continuous targets.
    keys = [k for k in keys if k != "logreg"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_clean, test_size=test_size, random_state=42
    )

    preprocess = ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                    ]
                ),
                numeric_cols,
            ),
            (
                "cat",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        (
                            "onehot",
                            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                        ),
                    ]
                ),
                categorical_cols,
            ),
        ],
        remainder="drop",
    )

    results: list[dict[str, Any]] = []
    for key in keys:
        pipe = Pipeline(
            steps=[
                ("preprocess", preprocess),
                ("model", _build_estimator(key)),
            ]
        )
        pipe.fit(X_train, y_train)
        pred = pipe.predict(X_test)
        metrics = _metrics(y_test.to_numpy(), np.asarray(pred))
        try:
            feature_names_out = list(pipe.named_steps["preprocess"].get_feature_names_out())
        except Exception:
            feature_names_out = feats

        results.append(
            {
                "model_key": key,
                "pipeline": pipe,
                "feature_names_out": feature_names_out,
                "metrics": metrics,
                "n_train": int(len(X_train)),
                "n_test": int(len(X_test)),
            }
        )

    # Best model = highest R² (then lowest RMSE)
    best = sorted(
        results,
        key=lambda r: (-r["metrics"]["r2"], r["metrics"]["rmse"]),
    )[0]

    reg = register_training_run(
        results=results,
        best_model_key=best["model_key"],
        dataset_name=Path(filename).name,
        target=target,
        features=feats,
        column_map=column_map or {},
        n_rows=int(len(work)),
        n_features=len(feats),
    )

    return {
        "ok": True,
        "dataset_name": Path(filename).name,
        "target": target,
        "features": feats,
        "n_rows": int(len(work)),
        "n_features": len(feats),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "numeric_features": numeric_cols,
        "categorical_features": categorical_cols,
        "best_model_key": best["model_key"],
        "best_model_id": best["model_id"],
        "best_metrics": best["metrics"],
        "results": [
            {
                "model_key": r["model_key"],
                "model_id": r["model_id"],
                "label": SUPPORTED_MODELS[r["model_key"]]["label"],
                "metrics": r["metrics"],
                "status": "trained",
            }
            for r in results
        ],
        "active_model_id": reg["active_model_id"],
        "message": "Training completed. Metrics are from held-out test predictions.",
    }
