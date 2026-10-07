/** Client for SkillVector FastAPI ML backend. */

const DEFAULT_BASE = "http://localhost:8000";

export function mlBaseUrl(): string {
  const envUrl = import.meta.env["VITE_ML_API_URL"] as string | undefined;
  return envUrl?.replace(/\/$/, "") || DEFAULT_BASE;
}

export type AlgorithmStatus = "ready" | "trained";

export interface AlgorithmInfo {
  label: string;
  class: string;
  supports_shap: boolean;
  status: AlgorithmStatus;
  trained: boolean;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
}

export interface TrainedModelMeta {
  model_id: string;
  model_key: string;
  label: string;
  status: string;
  dataset_name: string;
  target: string;
  features: string[];
  metrics: ModelMetrics;
  trained_at: string;
  supports_shap?: boolean;
  n_rows?: number;
  n_features?: number;
}

export interface BundleStatus {
  ok: boolean;
  base_dir: string;
  models_dir: string;
  data_dir: string;
  chroma_dir: string;
  files: Record<string, boolean>;
  loaded: Record<string, boolean>;
}

export interface HealthResponse {
  ok: boolean;
  status: string;
  service: string;
  trained_model_count: number;
  active_model_id: string | null;
  best_model_key: string | null;
  algorithms: Record<string, AlgorithmInfo>;
  bundle?: BundleStatus;
}

export interface ModelsResponse {
  ok: boolean;
  active_model_id: string | null;
  best_model_key: string | null;
  last_train: {
    at: string;
    dataset_name: string;
    target: string;
    features: string[];
    best_model_key: string;
    best_model_id: string;
    results: {
      model_key: string;
      model_id: string;
      label: string;
      metrics: ModelMetrics;
    }[];
  } | null;
  algorithms: Record<string, AlgorithmInfo>;
  models: TrainedModelMeta[];
}

export interface TrainResult {
  ok: boolean;
  error?: string;
  message?: string;
  dataset_name?: string;
  target?: string;
  features?: string[];
  n_rows?: number;
  n_features?: number;
  n_train?: number;
  n_test?: number;
  best_model_key?: string;
  best_model_id?: string;
  best_metrics?: ModelMetrics;
  results?: {
    model_key: string;
    model_id: string;
    label: string;
    metrics: ModelMetrics;
    status: string;
  }[];
  active_model_id?: string;
}

export interface SkillRiskApiResult {
  ok: boolean;
  source: string;
  model_id: string;
  model_key: string;
  model_label: string;
  skill: string;
  city: string;
  experienceYears: number;
  exposureScore: number;
  exposureBand: "Low" | "Medium" | "High";
  halfLifeMonths: number;
  halfLifeCi: [number, number];
  rawPrediction?: number;
  featuresUsed?: string[];
  metrics?: ModelMetrics;
  demo: boolean;
}

export interface ExplainApiResult {
  ok: boolean;
  error?: string;
  source?: string;
  model_id?: string;
  model_key?: string;
  shapFactors: { factor: string; weight: number; source?: string }[];
  baseValue?: number;
  demo: boolean;
  message?: string;
}

export interface RecommendationApiResult {
  ok: boolean;
  skill: string;
  city: string;
  recommendations: { skill: string; distance: number }[];
  source?: string;
}

export interface ResilienceApiResult {
  ok: boolean;
  source?: string;
  resilience_class?: string;
  personality?: Record<string, number>;
  message?: string;
}

export interface PreviewResponse {
  ok: boolean;
  file_name: string;
  rows: number;
  columns: string[];
  missing_values: number;
  duplicate_rows: number;
  numeric_columns: string[];
  categorical_columns: string[];
  date_columns: string[];
  sample_rows: Record<string, unknown>[];
  dtypes: Record<string, string>;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.error === "string") return data.error;
    return JSON.stringify(data);
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch(`${mlBaseUrl()}/api/health`, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchModels(signal?: AbortSignal): Promise<ModelsResponse> {
  const res = await fetch(`${mlBaseUrl()}/api/models`, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function previewDataset(file: File): Promise<PreviewResponse> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${mlBaseUrl()}/api/preview`, { method: "POST", body });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function trainModel(opts: {
  file: File;
  target: string;
  features: string[];
  modelKeys: string[];
  columnMap: Record<string, string | undefined>;
}): Promise<TrainResult> {
  const body = new FormData();
  body.append("file", opts.file);
  body.append("target", opts.target);
  body.append("features", JSON.stringify(opts.features));
  body.append("model_keys", JSON.stringify(opts.modelKeys));
  body.append("column_map", JSON.stringify(opts.columnMap));
  const res = await fetch(`${mlBaseUrl()}/api/train`, { method: "POST", body });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function predictSkillRiskApi(opts: {
  skill: string;
  city: string;
  experienceYears: number;
  modelId?: string;
}): Promise<SkillRiskApiResult> {
  const res = await fetch(`${mlBaseUrl()}/api/predict/skill-risk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function explainSkillRiskApi(opts: {
  skill: string;
  city: string;
  experienceYears: number;
  modelId?: string;
}): Promise<ExplainApiResult> {
  const res = await fetch(`${mlBaseUrl()}/api/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function recommendSkillsApi(opts: {
  skill: string;
  city?: string;
  topK?: number;
}): Promise<RecommendationApiResult> {
  const res = await fetch(`${mlBaseUrl()}/api/recommend/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...opts, topK: opts.topK ?? 5 }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function predictResilienceApi(opts: {
  personality?: Record<string, number>;
  modelPath?: string;
}): Promise<ResilienceApiResult> {
  const res = await fetch(`${mlBaseUrl()}/api/predict/resilience`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}
