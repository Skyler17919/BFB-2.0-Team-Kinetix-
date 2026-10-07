"""SkillVector FastAPI ML backend."""

from __future__ import annotations

import json
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.inference_service import artifact_status, predict_half_life, predict_resilience, recommend_skills

from .explain import explain_skill_risk
from .predict import predict_skill_risk
from .registry import load_registry
from .training import dataset_summary, read_dataset, train_models

app = FastAPI(
    title="SkillVector ML Backend",
    version="1.0.0",
    description="Real training, evaluation, prediction, and SHAP for SkillVector.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    skill: str
    city: str
    experienceYears: float = Field(ge=0, le=50)
    modelId: str | None = None
    features: dict[str, Any] | None = None


class ExplainRequest(BaseModel):
    skill: str
    city: str
    experienceYears: float = Field(ge=0, le=50)
    modelId: str | None = None
    features: dict[str, Any] | None = None
    topK: int = 8


class HalfLifeRequest(BaseModel):
    skill: str = "Manual QA"
    city: str = "Bengaluru"
    experienceYears: float = Field(default=3.0, ge=0, le=50)
    features: dict[str, Any] | None = None
    modelPath: str | None = None


class RecommendationRequest(BaseModel):
    skill: str = "Manual QA"
    city: str = "Bengaluru"
    topK: int = Field(default=5, ge=1, le=10)


class ResilienceRequest(BaseModel):
    personality: dict[str, Any] | None = None
    modelPath: str | None = None


@app.get("/api/health")
def health() -> dict[str, Any]:
    reg = load_registry()
    trained = [
        m for m in reg.get("models", {}).values() if m.get("status") == "trained"
    ]
    bundle = artifact_status()
    return {
        "ok": True,
        "status": "online",
        "service": "skillvector-ml-backend",
        "trained_model_count": len(trained),
        "active_model_id": reg.get("active_model_id"),
        "best_model_key": reg.get("best_model_key"),
        "algorithms": reg.get("available_algorithms", {}),
        "bundle": bundle,
    }


@app.get("/api/models")
def list_models() -> dict[str, Any]:
    reg = load_registry()
    bundle = artifact_status()
    return {
        "ok": True,
        "active_model_id": reg.get("active_model_id"),
        "best_model_key": reg.get("best_model_key"),
        "last_train": reg.get("last_train"),
        "algorithms": reg.get("available_algorithms", {}),
        "models": list(reg.get("models", {}).values()),
        "bundle": bundle,
    }


@app.post("/api/preview")
async def preview_dataset(file: UploadFile = File(...)) -> dict[str, Any]:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")
    try:
        df = read_dataset(file.filename or "upload.csv", raw)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, **dataset_summary(df, file.filename or "upload.csv")}


@app.post("/api/train")
async def train(
    file: UploadFile = File(...),
    target: str = Form(...),
    features: str = Form(...),
    model_keys: str = Form("xgboost,rf,gbm,linreg"),
    column_map: str = Form("{}"),
) -> dict[str, Any]:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")

    try:
        feature_list = json.loads(features) if features.strip().startswith("[") else [
            f.strip() for f in features.split(",") if f.strip()
        ]
        keys = [
            k.strip()
            for k in (json.loads(model_keys) if model_keys.strip().startswith("[") else model_keys.split(","))
            if str(k).strip()
        ]
        cmap = json.loads(column_map) if column_map else {}
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON in form fields: {exc}") from exc

    if not target or not target.strip():
        return {"ok": False, "error": "No valid training target found."}

    try:
        result = train_models(
            filename=file.filename or "upload.csv",
            raw=raw,
            target=target.strip(),
            features=feature_list,
            model_keys=keys,
            column_map=cmap if isinstance(cmap, dict) else {},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not result.get("ok"):
        return result
    return result


@app.post("/api/predict/skill-risk")
def predict(body: PredictRequest) -> dict[str, Any]:
    try:
        return predict_skill_risk(
            skill=body.skill,
            city=body.city,
            experience_years=body.experienceYears,
            model_id=body.modelId,
            features=body.features,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/explain")
def explain(body: ExplainRequest) -> dict[str, Any]:
    try:
        return explain_skill_risk(
            skill=body.skill,
            city=body.city,
            experience_years=body.experienceYears,
            model_id=body.modelId,
            features=body.features,
            top_k=body.topK,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/predict/half-life")
def predict_half_life_endpoint(body: HalfLifeRequest) -> dict[str, Any]:
    try:
        return predict_half_life(
            skill=body.skill,
            city=body.city,
            experience_years=body.experienceYears,
            features=body.features,
            model_path=body.modelPath,
        )
    except Exception as exc:  # pragma: no cover - runtime artifact-specific
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/recommend/skills")
def recommend_skills_endpoint(body: RecommendationRequest) -> dict[str, Any]:
    try:
        return recommend_skills(skill=body.skill, city=body.city, top_k=body.topK)
    except Exception as exc:  # pragma: no cover - runtime artifact-specific
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/predict/resilience")
def predict_resilience_endpoint(body: ResilienceRequest) -> dict[str, Any]:
    try:
        return predict_resilience(personality=body.personality, model_path=body.modelPath)
    except Exception as exc:  # pragma: no cover - runtime artifact-specific
        raise HTTPException(status_code=500, detail=str(exc)) from exc
