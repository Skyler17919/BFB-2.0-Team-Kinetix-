import { useMemo, useState } from "react";
import { PageHeader } from "@/components/glass";
import { StatusBadge } from "@/components/StatusBadge";
import { useMlBackend } from "@/context/MlBackendContext";
import {
  ACTUAL_MOCK_FEATURES,
  MODEL_REGISTRY,
  PIPELINE_STEPS,
  PLANNED_FEATURES,
  type ImplStatus,
  type ModelRegistryEntry,
} from "@/lib/systemAudit";
import { cn } from "@/lib/utils";
import { ArrowDown, Box, Cpu, GitBranch, Sparkles } from "lucide-react";

const FLOW_LIVE = [
  "User enters skill · city · experience",
  "React → POST /api/predict/skill-risk",
  "Load joblib pipeline (preprocess + regressor)",
  "Real exposure / risk score",
  "Half-life derived from prediction",
  "POST /api/explain → shap.TreeExplainer",
  "Risk Score → UI gauges",
  "Transition Planner (still template / mock)",
];

const FLOW_DEMO = [
  "User enters skill · city · experience",
  "Demo Mode → mockEngine.ts",
  "Hash-seeded heuristics",
  "AI Automation Exposure (simulated)",
  "Skill Half-Life (formula)",
  "Regional Demand (seeded)",
  "Risk Score → UI gauges",
  "Transition Planner (templates)",
];

export function ModelIntelligence() {
  const { online, models, baseUrl, hasTrainedModel, algorithmStatus } = useMlBackend();
  const liveEntries = useMemo(() => buildLiveRegistry(online, hasTrainedModel, models, algorithmStatus), [
    online,
    hasTrainedModel,
    models,
    algorithmStatus,
  ]);
  const registry = useMemo(() => [...liveEntries, ...MODEL_REGISTRY.filter((m) => m.id !== "xgb-planned")], [liveEntries]);
  const [active, setActive] = useState(liveEntries[0]?.id ?? MODEL_REGISTRY[0]!.id);
  const model = useMemo(
    () => registry.find((m) => m.id === active) ?? registry[0]!,
    [active, registry],
  );
  const [flowStep, setFlowStep] = useState(0);
  const flow = hasTrainedModel && online ? FLOW_LIVE : FLOW_DEMO;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Intelligence Layer"
        title={
          <>
            Model <span className="gradient-text">Intelligence</span>
          </>
        }
        subtitle="Live registry from the FastAPI ML backend when online. Models stay READY until a real dataset is uploaded and model.fit() succeeds."
      />

      <div className="glass flex flex-wrap items-center gap-3 p-4">
        <StatusBadge status={online ? (hasTrainedModel ? "trained" : "ready") : "missing"} />
        <p className="text-sm text-muted-foreground">
          Backend {online ? "online" : "offline"} · {baseUrl}
          {models?.active_model_id ? ` · active ${models.active_model_id}` : " · no active trained model"}
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Box className="size-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Model Registry</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {registry.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(m.id)}
              className={cn(
                "glass glass-hover space-y-3 p-5 text-left transition",
                active === m.id && "border-primary/40 shadow-[0_0_32px_rgba(var(--primary-rgb),0.15)]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold tracking-tight">{m.name}</p>
                <StatusBadge status={m.status} compact />
              </div>
              <p className="text-xs font-light text-muted-foreground">{m.purpose}</p>
              <dl className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="mt-0.5 text-foreground/90">{m.type}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Version</dt>
                  <dd className="mt-0.5 text-foreground/90">{m.version}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Dataset</dt>
                  <dd className="mt-0.5 text-foreground/90">{m.dataset}</dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      </section>

      <section className="glass space-y-5 p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <Cpu className="size-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">{model.name}</h3>
          <StatusBadge status={model.status} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock label="Model Type" value={model.type} />
          <InfoBlock label="Purpose" value={model.purpose} />
          <InfoBlock label="Training Status" value={model.trainingStatus} />
          <InfoBlock label="Explainability" value={model.explainability} />
          <InfoBlock label="Data Source" value={model.dataset} />
          <InfoBlock label="Implementation" value={model.location} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-2">Input Features</p>
            <ul className="space-y-1.5">
              {model.inputs.map((f) => (
                <li
                  key={f}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-light"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-2">Output</p>
            <ul className="space-y-1.5">
              {model.outputs.map((f) => (
                <li
                  key={f}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-light"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Training Pipeline</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PIPELINE_STEPS.map((step) => {
            const status = livePipelineStatus(step.id, online, hasTrainedModel);
            return (
              <div key={step.id} className="glass space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{step.title}</p>
                  <StatusBadge status={status} compact />
                </div>
                <p className="text-xs font-light leading-relaxed text-muted-foreground">
                  {livePipelineDetail(step.id, step.detail, online, hasTrainedModel)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass p-5">
            <p className="eyebrow mb-3 text-primary">Demo Mode inputs (mockEngine)</p>
            <ul className="space-y-2">
              {ACTUAL_MOCK_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-sm font-light">
                  <StatusBadge status="mock" compact className="shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass p-5">
            <p className="eyebrow mb-3">Planned Feature expansions</p>
            <ul className="space-y-2">
              {PLANNED_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-sm font-light text-muted-foreground">
                  <StatusBadge status="planned" compact className="shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="glass border-emerald-400/20 p-5">
          <StatusBadge status={hasTrainedModel ? "trained" : "ready"} />
          <p className="mt-3 text-sm font-light text-muted-foreground">
            <strong className="font-medium text-foreground">SHAP:</strong>{" "}
            {hasTrainedModel
              ? "TreeExplainer available for trained XGBoost / Random Forest / GBM via POST /api/explain."
              : "Implementation ready in ml-backend/app/explain.py — requires a trained tree model."}
          </p>
          <p className="mt-3 text-sm font-light text-muted-foreground">
            <strong className="font-medium text-foreground">Evaluation:</strong> MAE / RMSE / R² are
            calculated on a held-out test set after training — never fabricated.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Model → Product Connection</h3>
        </div>
        <div className="glass p-5 md:p-7">
          <div className="mx-auto flex max-w-md flex-col items-center gap-2">
            {flow.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setFlowStep(i)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-left text-sm transition duration-300",
                  flowStep === i
                    ? "border-primary/40 bg-primary/15 text-foreground shadow-[0_0_24px_rgba(var(--primary-rgb),0.2)]"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]",
                )}
              >
                <span className="eyebrow mr-2 text-[9px]">{String(i + 1).padStart(2, "0")}</span>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <ArrowDown className="size-4 text-primary/70" strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-center text-sm font-light text-muted-foreground">
            Active step: <span className="text-foreground">{flow[flowStep]}</span>
          </p>
        </div>
      </section>

      <section className="glass space-y-3 p-5">
        <h3 className="text-lg font-semibold tracking-tight">Model Versions</h3>
        <StatusBadge status={models?.models?.length ? "trained" : online ? "ready" : "missing"} />
        {models?.models?.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {models.models.map((m) => (
              <li key={m.model_id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="font-medium">{m.label}</span> · {m.model_id}
                <span className="block text-[11px] text-muted-foreground">
                  {m.dataset_name} · R² {m.metrics.r2} · {m.trained_at}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm font-light text-muted-foreground">
            No trained artifacts yet. Versions appear after a successful Train Model run.
          </p>
        )}
      </section>
    </div>
  );
}

function buildLiveRegistry(
  online: boolean,
  hasTrained: boolean,
  models: ReturnType<typeof useMlBackend>["models"],
  algorithmStatus: ReturnType<typeof useMlBackend>["algorithmStatus"],
): ModelRegistryEntry[] {
  const keys = [
    { id: "xgboost", name: "XGBoost", type: "XGBRegressor" },
    { id: "rf", name: "Random Forest", type: "RandomForestRegressor" },
    { id: "gbm", name: "Gradient Boosting", type: "GradientBoostingRegressor" },
    { id: "linreg", name: "Linear Regression", type: "LinearRegression" },
  ] as const;

  return keys.map((k) => {
    const algo = algorithmStatus(k.id);
    const trainedMeta = models?.models?.find((m) => m.model_key === k.id);
    const status: ImplStatus = !online
      ? "missing"
      : algo?.trained || trainedMeta
        ? "trained"
        : "ready";
    return {
      id: `ml-${k.id}`,
      name: k.name,
      purpose: "Continuous skill-risk / target regression for uploaded workforce datasets",
      type: k.type,
      status,
      dataset: trainedMeta?.dataset_name ?? (online ? "Awaiting upload" : "Backend offline"),
      version: trainedMeta?.model_id ?? "code ready · not trained",
      trainingStatus: trainedMeta
        ? `TRAINED · MAE ${trainedMeta.metrics.mae} · RMSE ${trainedMeta.metrics.rmse} · R² ${trainedMeta.metrics.r2}`
        : online
          ? "READY — not trained until dataset upload + model.fit()"
          : "Backend offline",
      explainability:
        k.id === "linreg"
          ? "Linear model — TreeExplainer not applicable"
          : hasTrained && (k.id === "xgboost" || k.id === "rf" || k.id === "gbm")
            ? "shap.TreeExplainer (when this model is active)"
            : "SHAP ready after tree model training",
      inputs: trainedMeta?.features?.length
        ? trainedMeta.features
        : ["User-mapped feature columns from uploaded dataset"],
      outputs: [trainedMeta?.target ?? "Numeric target (user-mapped)", "MAE / RMSE / R² on test split"],
      location: `ml-backend/app/training.py + artifacts/*.joblib`,
    };
  });
}

function livePipelineStatus(
  id: string,
  online: boolean,
  hasTrained: boolean,
): ImplStatus {
  if (!online) {
    if (id === "predict") return "mock";
    return id === "dataset" || id === "train" || id === "eval" || id === "store" || id === "explain"
      ? "ready"
      : "missing";
  }
  switch (id) {
    case "dataset":
      return hasTrained ? "trained" : "ready";
    case "preprocess":
    case "features":
    case "train":
    case "eval":
    case "store":
    case "explain":
      return hasTrained ? "trained" : "ready";
    case "predict":
      return hasTrained ? "trained" : "ready";
    default:
      return "ready";
  }
}

function livePipelineDetail(
  id: string,
  fallback: string,
  online: boolean,
  hasTrained: boolean,
): string {
  if (!online) return fallback;
  const map: Record<string, string> = {
    dataset: hasTrained
      ? "Last training used an uploaded CSV/XLSX/Parquet file via POST /api/train."
      : "Upload CSV/XLSX/Parquet on Train With Your Dataset — ingested by FastAPI.",
    preprocess: "SimpleImputer + OneHotEncoder in sklearn ColumnTransformer.",
    features: "User-selected feature columns; categoricals one-hot encoded.",
    train: "train_test_split + model.fit() for XGB / RF / GBM / LinearRegression.",
    eval: "Real MAE, RMSE, R² from sklearn.metrics on held-out test set.",
    explain: "shap.TreeExplainer for tree models via POST /api/explain.",
    store: "joblib pipelines under ml-backend/artifacts/ + registry.json.",
    predict: "POST /api/predict/skill-risk loads the active joblib pipeline.",
  };
  return map[id] ?? fallback;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 text-sm font-light text-foreground/90">{value}</p>
    </div>
  );
}
