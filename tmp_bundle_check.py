from pathlib import Path
import sqlite3
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

# model checks
base = Path(r'D:\hackthon\BFB-2.0-Team-Kinetix-\ml-backend')
models = base / 'models'
print('MODEL_DIR', models)
print('MODEL_EXISTS', {p.name: p.exists() for p in models.iterdir()})

xgb_model = xgb.XGBRegressor()
xgb_model.load_model(str(models / 'skill_decay_xgb.json'))
print('XGB_FEATURES', xgb_model.get_booster().feature_names)
print('XGB_PRED', float(xgb_model.predict(pd.DataFrame([{'salary_lpa': 15.0, 'exp_years': 5.0, 'ai_exposure_weight': 0.8}]))[0]))

explainer = joblib.load(str(models / 'shap_explainer.joblib'))
print('EXPLAINER_TYPE', type(explainer))

rf = joblib.load(str(models / 'sds_personality_rf.joblib'))
print('RF_TYPE', type(rf))
print('RF_FEATURES', getattr(rf, 'feature_names_in_', None))

print('RF_PRED', float(rf.predict(pd.DataFrame([[2.0, 4.0, 4.5, 3.5, 4.0]], columns=getattr(rf, 'feature_names_in_', ['n','e','o','a','c'])))[0]))

# sqlite inspection
chroma = base / 'data' / 'chroma_db' / 'chroma.sqlite3'
print('CHROMA_EXISTS', chroma.exists(), 'SIZE', chroma.stat().st_size if chroma.exists() else 0)
if chroma.exists():
    conn = sqlite3.connect(str(chroma))
    cur = conn.cursor()
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
    print('TABLES', tables)
    conn.close()
