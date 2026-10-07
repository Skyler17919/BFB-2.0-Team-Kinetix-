# SkillVector ML Backend

Real FastAPI training / prediction / SHAP service.

## Setup

```bash
cd ml-backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: http://localhost:8000/api/health

## Endpoints

- `GET /api/health`
- `GET /api/models`
- `POST /api/preview` — multipart file
- `POST /api/train` — multipart file + target/features/model_keys/column_map
- `POST /api/predict/skill-risk` — JSON
- `POST /api/explain` — JSON (shap.TreeExplainer)

Models are **READY** until you upload a real dataset and training completes. Then they become **TRAINED** and joblib artifacts appear under `artifacts/`.

Frontend default API base: `http://localhost:8000` (override with `VITE_ML_API_URL`).
