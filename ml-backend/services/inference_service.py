from __future__ import annotations

import re
import sqlite3
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

try:  # pragma: no cover - optional unless the package is installed
    import chromadb  # type: ignore
except Exception:  # pragma: no cover
    chromadb = None

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
CHROMA_DIR = DATA_DIR / "chroma_db"
CHROMA_DB_PATH = CHROMA_DIR / "chroma.sqlite3"


def _model_path(name: str) -> Path:
    return MODELS_DIR / name


def artifact_status() -> dict[str, Any]:
    files = {
        "xgboost_model": _model_path("skill_decay_xgb.json").exists(),
        "shap_explainer": _model_path("shap_explainer.joblib").exists(),
        "personality_model": _model_path("sds_personality_rf.joblib").exists(),
        "chroma_db": CHROMA_DB_PATH.exists(),
    }
    return {
        "ok": all(files.values()),
        "base_dir": str(BASE_DIR),
        "models_dir": str(MODELS_DIR),
        "data_dir": str(DATA_DIR),
        "chroma_dir": str(CHROMA_DIR),
        "files": files,
        "loaded": {
            "xgb": False,
            "shap": False,
            "rf": False,
            "chroma": bool(files["chroma_db"]),
        },
    }


class SkillVectorEngine:
    def __init__(self, models_dir: str | Path = MODELS_DIR, chroma_dir: str | Path = CHROMA_DIR):
        self.models_dir = Path(models_dir)
        self.chroma_dir = Path(chroma_dir)

        self.xgb_model = xgb.XGBRegressor()
        self.xgb_model.load_model(str(self.models_dir / "skill_decay_xgb.json"))
        self.explainer = joblib.load(str(self.models_dir / "shap_explainer.joblib"))
        self.rf_model = joblib.load(str(self.models_dir / "sds_personality_rf.joblib"))

        self.chroma_client = None
        self.collection = None
        if chromadb is not None and self.chroma_dir.exists():
            try:
                self.chroma_client = chromadb.PersistentClient(path=str(self.chroma_dir))
                self.collection = self.chroma_client.get_collection(name="skills_taxonomy")
            except Exception:
                self.chroma_client = None
                self.collection = None

    def predict_half_life(self, salary_lpa: float, exp_years: float, ai_weight: float) -> dict[str, Any]:
        df = pd.DataFrame(
            [{"salary_lpa": float(salary_lpa), "exp_years": float(exp_years), "ai_exposure_weight": float(ai_weight)}]
        )
        months = float(self.xgb_model.predict(df)[0])
        shap_vals = self.explainer.shap_values(df)
        if isinstance(shap_vals, list):
            vals = np.asarray(shap_vals[0]).reshape(-1)
        else:
            vals = np.asarray(shap_vals).reshape(-1)
        return {
            "half_life_months": round(months, 1),
            "shap_attribution": {key: round(float(val), 6) for key, val in zip(df.columns, vals.tolist())},
        }

    def recommend_skills(self, current_skill: str, top_k: int = 5) -> list[dict[str, Any]]:
        if self.collection is not None:
            try:
                results = self.collection.query(query_texts=[current_skill], n_results=max(1, top_k))
                docs = results.get("documents", [[]])[0]
                distances = results.get("distances", [[]])[0]
                return [
                    {"skill": str(doc).strip('" ;'), "distance": round(float(dist), 3)}
                    for doc, dist in zip(docs, distances)
                ]
            except Exception:
                pass

        return _query_skill_catalog(current_skill, top_k)

    def predict_resilience(self, n: float, e: float, o: float, a: float, c: float) -> dict[str, Any]:
        feature_names = [str(col) for col in getattr(self.rf_model, "feature_names_in_", ["n", "e", "o", "a", "c"])]
        df = pd.DataFrame([[n, e, o, a, c]], columns=feature_names)
        prediction = self.rf_model.predict(df)[0]
        return {"resilience_class": str(prediction)}


def _normalize_doc(raw: str) -> str:
    cleaned = str(raw).strip().strip('"')
    cleaned = cleaned.replace(";", " ").replace("  ", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned.strip(" ")


def _raw_skill_documents() -> list[str]:
    if not CHROMA_DB_PATH.exists():
        return []
    conn = sqlite3.connect(str(CHROMA_DB_PATH))
    try:
        rows = conn.execute(
            "SELECT string_value FROM embedding_metadata WHERE key = 'chroma:document' ORDER BY id LIMIT 500"
        ).fetchall()
    finally:
        conn.close()
    docs: list[str] = []
    for (value,) in rows:
        if value:
            cleaned = _normalize_doc(value)
            if cleaned and cleaned.lower() not in {"nan", "none"}:
                docs.append(cleaned)
    return docs


def _query_skill_catalog(current_skill: str, top_k: int = 5) -> list[dict[str, Any]]:
    query = (current_skill or "").strip().lower()
    docs = _raw_skill_documents()
    if not docs:
        return [
            {"skill": "Python", "distance": 0.32},
            {"skill": "Data Analysis", "distance": 0.41},
            {"skill": "AI Readiness", "distance": 0.54},
        ][: max(1, top_k)]

    def _score(candidate: str) -> float:
        text = candidate.lower()
        q_tokens = set(re.findall(r"[a-z0-9]+", query))
        c_tokens = set(re.findall(r"[a-z0-9]+", text))
        if not q_tokens:
            return 0.1
        overlap = len(q_tokens & c_tokens)
        if not overlap:
            return 0.15 if query in text else 0.0
        return float(overlap / max(len(q_tokens), 1)) + (0.2 if query in text else 0.0)

    scored = []
    seen: set[str] = set()
    for candidate in docs:
        if not candidate or candidate.lower() == query:
            continue
        score = _score(candidate)
        if score <= 0:
            continue
        if candidate not in seen:
            scored.append((candidate, score))
            seen.add(candidate)
    scored.sort(key=lambda item: item[1], reverse=True)
    top = scored[: max(1, top_k)]
    return [{"skill": skill, "distance": round(float(score), 3)} for skill, score in top]


def _load_engine() -> SkillVectorEngine:
    return SkillVectorEngine(MODELS_DIR, CHROMA_DIR)


def _coerce_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def predict_half_life(
    *,
    skill: str | None = None,
    city: str | None = None,
    experience_years: float = 3.0,
    features: dict[str, Any] | None = None,
    model_path: str | None = None,
) -> dict[str, Any]:
    engine = _load_engine()
    feature_map = features or {}
    salary_lpa = _coerce_float(
        feature_map.get("salary_lpa")
        or feature_map.get("salary")
        or feature_map.get("salaryLpa")
        or 15.0,
        15.0,
    )
    exp_years = _coerce_float(feature_map.get("exp_years") or feature_map.get("experience_years") or experience_years, float(experience_years))
    ai_weight = _coerce_float(feature_map.get("ai_exposure_weight") or feature_map.get("ai_weight") or 0.6, 0.6)
    response = engine.predict_half_life(salary_lpa=salary_lpa, exp_years=exp_years, ai_weight=ai_weight)
    response["ok"] = True
    response["source"] = "project-bundle"
    response["skill"] = skill or "Manual QA"
    response["city"] = city or "Bengaluru"
    return response


def recommend_skills(*, skill: str, city: str | None = None, top_k: int = 5) -> dict[str, Any]:
    payload = _query_skill_catalog(skill, top_k=max(1, int(top_k)))
    return {"ok": True, "skill": skill, "city": city or "Bengaluru", "recommendations": payload, "source": "project-chroma"}


def predict_resilience(*, personality: dict[str, Any] | None = None, model_path: str | None = None) -> dict[str, Any]:
    engine = _load_engine()
    traits = personality or {}
    aliases = {
        "n": ["n", "neuroticism", "trait_n"],
        "e": ["e", "extraversion", "trait_e"],
        "o": ["o", "openness", "openness_to_experience", "trait_o"],
        "a": ["a", "agreeableness", "trait_a"],
        "c": ["c", "conscientiousness", "trait_c"],
    }
    values: list[float] = []
    for key in ["n", "e", "o", "a", "c"]:
        matched = next((traits.get(alias) for alias in aliases[key] if alias in traits), None)
        if matched is None:
            for candidate in traits.values():
                if isinstance(candidate, (int, float)):
                    matched = candidate
                    break
        values.append(_coerce_float(matched, 3.0))
    pred = engine.predict_resilience(*values)
    return {"ok": True, "source": "project-bundle", "resilience_class": pred["resilience_class"], "personality": dict(zip(["n", "e", "o", "a", "c"], values))}


if __name__ == "__main__":
    status = artifact_status()
    print(status)
    engine = _load_engine()
    print(engine.predict_half_life(15.0, 5.0, 0.8))
    print(recommend_skills(skill="Excel", top_k=3))
    print(predict_resilience(personality={"n": 2.0, "e": 4.0, "o": 4.5, "a": 3.5, "c": 4.0}))
