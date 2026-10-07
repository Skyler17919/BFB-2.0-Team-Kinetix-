import { useCallback, useState } from "react";
import { PageHeader } from "@/components/glass";
import { StatusBadge } from "@/components/StatusBadge";
import { useMlBackend } from "@/context/MlBackendContext";
import { trainModel, type TrainResult } from "@/lib/mlApi";
import { parseUploadedFile, type ParsedDataset } from "@/lib/csvParse";
import type { ImplStatus } from "@/lib/systemAudit";
import { cn } from "@/lib/utils";
import { AlertTriangle, Database, FileUp, Trash2, Upload, Wand2 } from "lucide-react";

const MODEL_OPTIONS = [
  { id: "xgboost", label: "XGBoost", blurb: "XGBRegressor for structured workforce prediction." },
  { id: "rf", label: "Random Forest", blurb: "RandomForestRegressor baseline." },
  { id: "gbm", label: "Gradient Boosting", blurb: "GradientBoostingRegressor comparison." },
  { id: "linreg", label: "Linear Regression", blurb: "LinearRegression baseline." },
] as const;

const MAP_FIELDS = [
  { key: "target", label: "Target Variable", multi: false },
  { key: "features", label: "Feature Columns", multi: true },
  { key: "city", label: "City column (optional)", multi: false },
  { key: "skill", label: "Skill column (optional)", multi: false },
  { key: "experience", label: "Experience column (optional)", multi: false },
  { key: "salary", label: "Salary column (optional)", multi: false },
  { key: "demand", label: "Demand column (optional)", multi: false },
  { key: "automation", label: "Automation exposure column (optional)", multi: false },
  { key: "date", label: "Date column (optional)", multi: false },
] as const;

type MapKey = (typeof MAP_FIELDS)[number]["key"];

export function TrainWithDataset() {
  const { online, checking, error, baseUrl, algorithmStatus, applyTrainResult, models, refresh } =
    useMlBackend();
  const [datasets, setDatasets] = useState<ParsedDataset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [modelId, setModelId] = useState<string>("xgboost");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "xgboost",
    "rf",
    "gbm",
    "linreg",
  ]);
  const [mapping, setMapping] = useState<Partial<Record<MapKey, string | string[]>>>({});
  const [trainMessage, setTrainMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null);

  const active = datasets.find((d) => d.id === activeId) ?? null;

  const ingest = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    setBusy(true);
    try {
      const parsed = await Promise.all(list.map((f) => parseUploadedFile(f)));
      setDatasets((prev) => [...parsed, ...prev]);
      if (parsed[0]) {
        setActiveId(parsed[0].id);
        setMapping({});
        setTrainMessage(null);
        setTrainResult(null);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void ingest(e.dataTransfer.files);
  };

  const removeDataset = (id: string) => {
    if (!confirm("Delete this dataset from the local library? This cannot be undone.")) return;
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMapping({});
      setTrainMessage(null);
      setTrainResult(null);
    }
  };

  const downloadActive = () => {
    if (!active || !active.rows.length) return;
    const headers = active.columns;
    const csv = [
      headers.join(","),
      ...active.rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = active.fileName.replace(/\.\w+$/, "") + "_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleModel = (id: string) => {
    setModelId(id);
    setSelectedModels((prev) =>
      prev.includes(id) ? (prev.length === 1 ? prev : prev.filter((x) => x !== id)) : [...prev, id],
    );
  };

  const train = async () => {
    if (!online) {
      setTrainMessage(`ML backend offline at ${baseUrl}. Start the FastAPI server first.`);
      return;
    }
    if (!active?.file) {
      setTrainMessage("Upload a dataset before training.");
      return;
    }
    if (!mapping.target) {
      setTrainMessage("No valid training target found.");
      return;
    }
    const feats = mapping.features;
    if (!feats || (Array.isArray(feats) && feats.length === 0)) {
      setTrainMessage("Select at least one Feature Column.");
      return;
    }

    setTraining(true);
    setTrainMessage(null);
    try {
      const result = await trainModel({
        file: active.file,
        target: String(mapping.target),
        features: Array.isArray(feats) ? feats : [feats],
        modelKeys: selectedModels,
        columnMap: {
          city: mapping.city as string | undefined,
          skill: mapping.skill as string | undefined,
          experience: mapping.experience as string | undefined,
          salary: mapping.salary as string | undefined,
          demand: mapping.demand as string | undefined,
          automation: mapping.automation as string | undefined,
          date: mapping.date as string | undefined,
        },
      });
      setTrainResult(result);
      if (!result.ok) {
        setTrainMessage(result.error || "Training failed.");
      } else {
        setTrainMessage(result.message || "Training completed.");
        applyTrainResult(result);
        await refresh();
      }
    } catch (e) {
      setTrainMessage(e instanceof Error ? e.message : "Training request failed.");
      setTrainResult(null);
    } finally {
      setTraining(false);
    }
  };

  const backendStatus: ImplStatus = !online ? "missing" : "live";

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Bring Your Data"
        title={
          <>
            Train With Your <span className="gradient-text">Dataset</span>
          </>
        }
        subtitle="Upload workforce data, map columns, and train real regressors on the FastAPI ML backend. Metrics come from held-out evaluation — never fabricated."
      />

      <div
        className={cn(
          "glass flex flex-wrap items-start gap-3 p-4",
          online ? "border-emerald-400/25" : "border-amber-400/25",
        )}
      >
        <AlertTriangle
          className={cn("mt-0.5 size-4 shrink-0", online ? "text-emerald-300" : "text-amber-300")}
          strokeWidth={1.5}
        />
        <div className="space-y-1 text-sm font-light text-muted-foreground">
          <p className="flex flex-wrap items-center gap-2">
            <StatusBadge status={backendStatus} compact />
            <span className="font-medium text-foreground">
              {checking
                ? "Checking ML backend…"
                : online
                  ? `Training backend online · ${baseUrl}`
                  : `Training backend offline · ${baseUrl}`}
            </span>
          </p>
          <p>
            {online
              ? "CSV · XLSX · Parquet ingestion, real model.fit(), MAE / RMSE / R², joblib artifacts, and SHAP are available."
              : `Start with: cd ml-backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000${error ? ` · ${error}` : ""}`}
          </p>
        </div>
      </div>

      <section
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "glass flex min-h-[220px] flex-col items-center justify-center gap-3 border-dashed p-8 text-center transition",
          dragOver && "border-primary/50 bg-primary/10",
        )}
      >
        <div className="icon-orb size-14">
          <Upload className="size-6 text-primary" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">Upload your workforce data</h3>
        <p className="max-w-md text-sm font-light text-muted-foreground">
          Drag & drop dataset — CSV · Parquet · Excel
        </p>
        <p className="text-[11px] text-muted-foreground">
          CSV previews in-browser. Parquet/XLSX preview via ML backend when online.
        </p>
        <label className="btn-primary mt-2 cursor-pointer !rounded-2xl">
          <FileUp className="size-4" strokeWidth={1.5} />
          {busy ? "Reading…" : "Browse files"}
          <input
            type="file"
            accept=".csv,.txt,.parquet,.xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && void ingest(e.target.files)}
          />
        </label>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Dataset Management</h3>
        </div>
        {datasets.length === 0 ? (
          <p className="text-sm font-light text-muted-foreground">No uploads yet — library is empty.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {datasets.map((ds) => (
              <article
                key={ds.id}
                className={cn("glass space-y-3 p-4", activeId === ds.id && "border-primary/40")}
              >
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="text-left" onClick={() => setActiveId(ds.id)}>
                    <p className="text-sm font-semibold tracking-tight">{ds.fileName}</p>
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      {ds.rowCount.toLocaleString()} rows · {ds.columnCount} columns
                    </p>
                  </button>
                  <StatusBadge status={ds.status === "Ready" ? "ready" : "missing"} compact />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Uploaded: {new Date(ds.uploadedAt).toLocaleString()} · Status: {ds.status}
                </p>
                {ds.note && <p className="text-[11px] font-light text-amber-200/80">{ds.note}</p>}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-glass !rounded-xl !px-3 !py-1.5 text-[11px]"
                    onClick={() => setActiveId(ds.id)}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="btn-glass !rounded-xl !px-3 !py-1.5 text-[11px]"
                    onClick={() => setActiveId(ds.id)}
                  >
                    Use for Training
                  </button>
                  <button
                    type="button"
                    className="btn-glass !rounded-xl !px-3 !py-1.5 text-[11px]"
                    onClick={downloadActive}
                    disabled={activeId !== ds.id}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="btn-glass !rounded-xl !px-3 !py-1.5 text-[11px] text-rose-200"
                    onClick={() => removeDataset(ds.id)}
                  >
                    <Trash2 className="size-3" /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {active && active.columns.length > 0 && (
        <>
          <section className="glass space-y-4 p-5 md:p-6">
            <h3 className="text-lg font-semibold tracking-tight">Dataset Summary</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Summary label="File name" value={active.fileName} />
              <Summary label="Rows" value={String(active.rowCount)} />
              <Summary label="Columns" value={String(active.columnCount)} />
              <Summary label="Missing values" value={String(active.missingCells)} />
              <Summary label="Duplicate rows" value={String(active.duplicateRows)} />
              <Summary label="Numeric columns" value={String(active.numericColumns.length)} />
              <Summary label="Categorical columns" value={String(active.categoricalColumns.length)} />
              <Summary label="Date columns" value={String(active.dateColumns.length)} />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-b border-white/10 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  <tr>
                    {active.columns.slice(0, 8).map((c) => (
                      <th key={c} className="px-3 py-3 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {active.rows.slice(0, 6).map((row, i) => (
                    <tr key={i}>
                      {active.columns.slice(0, 8).map((c) => (
                        <td key={c} className="px-3 py-2 font-light">
                          {row[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="glass space-y-5 p-5 md:p-6">
            <h3 className="text-lg font-semibold tracking-tight">Map Your Dataset</h3>
            <p className="text-sm font-light text-muted-foreground">
              Map your own schema. Target must be numeric for regression training.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {MAP_FIELDS.map((field) => (
                <label key={field.key} className="space-y-2">
                  <span className="text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                    {field.label}
                  </span>
                  {field.multi ? (
                    <select
                      multiple
                      className="glass-input !rounded-2xl min-h-[110px] py-2"
                      value={(mapping.features as string[]) ?? []}
                      onChange={(e) =>
                        setMapping((m) => ({
                          ...m,
                          features: Array.from(e.target.selectedOptions).map((o) => o.value),
                        }))
                      }
                    >
                      {active.columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="glass-input !rounded-2xl"
                      value={(mapping[field.key] as string) ?? ""}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [field.key]: e.target.value || undefined }))
                      }
                    >
                      <option value="">— Select —</option>
                      {active.columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="glass space-y-5 p-5 md:p-6">
        <h3 className="text-lg font-semibold tracking-tight">Training Configuration</h3>
        <p className="text-xs text-muted-foreground">
          Click cards to include/exclude from the comparison run. Primary highlight: {modelId}.
          Logistic Regression is excluded for continuous risk targets.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODEL_OPTIONS.map((m) => {
            const algo = algorithmStatus(m.id);
            const selected = selectedModels.includes(m.id);
            const status: ImplStatus = algo?.trained
              ? "trained"
              : online
                ? "ready"
                : "missing";
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleModel(m.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  selected || modelId === m.id
                    ? "border-primary/40 bg-primary/15"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                )}
              >
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="mt-1 text-xs font-light text-muted-foreground">{m.blurb}</p>
                <div className="mt-3">
                  <StatusBadge status={status} compact />
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn-primary gap-2"
          onClick={() => void train()}
          disabled={training}
        >
          <Wand2 className="size-4" strokeWidth={1.5} />
          {training ? "Training…" : "Train Model"}
        </button>

        {trainMessage && (
          <div
            className={cn(
              "rounded-2xl border p-4 text-sm font-light leading-relaxed",
              trainResult?.ok
                ? "border-emerald-400/30 bg-emerald-400/10 text-foreground/90"
                : "border-amber-400/30 bg-amber-400/10 text-foreground/90",
            )}
          >
            {trainMessage}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">Training Results</h3>
            <StatusBadge
              status={trainResult?.ok ? "trained" : online ? "ready" : "missing"}
              compact
            />
          </div>
          {trainResult?.ok && trainResult.best_metrics ? (
            <div className="space-y-3 text-sm">
              <p className="font-light text-muted-foreground">
                Best model:{" "}
                <span className="font-medium text-foreground">
                  {trainResult.results?.find((r) => r.model_key === trainResult.best_model_key)?.label}
                </span>{" "}
                (by R², then RMSE)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Metric label="MAE" value={trainResult.best_metrics.mae} />
                <Metric label="RMSE" value={trainResult.best_metrics.rmse} />
                <Metric label="R²" value={trainResult.best_metrics.r2} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Rows {trainResult.n_rows} · train {trainResult.n_train} · test {trainResult.n_test} ·
                target <code className="text-primary">{trainResult.target}</code>
              </p>
            </div>
          ) : (
            <p className="text-sm font-light text-muted-foreground">
              Real MAE, RMSE, and R² appear here after a successful <code>model.fit()</code> on your
              uploaded dataset.
            </p>
          )}
        </div>
        <div className="glass space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">Model Comparison</h3>
            <StatusBadge
              status={trainResult?.results?.length ? "trained" : online ? "ready" : "missing"}
              compact
            />
          </div>
          {trainResult?.results?.length ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-[10px] tracking-wider text-muted-foreground uppercase">
                  <tr>
                    <th className="px-3 py-2">Model</th>
                    <th className="px-3 py-2">MAE</th>
                    <th className="px-3 py-2">RMSE</th>
                    <th className="px-3 py-2">R²</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {trainResult.results.map((r) => (
                    <tr
                      key={r.model_id}
                      className={r.model_key === trainResult.best_model_key ? "bg-primary/10" : ""}
                    >
                      <td className="px-3 py-2 font-medium">
                        {r.label}
                        {r.model_key === trainResult.best_model_key ? " · best" : ""}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{r.metrics.mae}</td>
                      <td className="px-3 py-2 tabular-nums">{r.metrics.rmse}</td>
                      <td className="px-3 py-2 tabular-nums">{r.metrics.r2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm font-light text-muted-foreground">
              Side-by-side regression metrics appear after training multiple models on the same split.
            </p>
          )}
        </div>
        <div className="glass space-y-3 p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">Model Versions</h3>
            <StatusBadge
              status={models?.models?.length ? "trained" : online ? "ready" : "missing"}
              compact
            />
          </div>
          {models?.models?.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {models.models.map((m) => (
                <div key={m.model_id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm font-semibold">
                    {m.label}{" "}
                    {m.model_id === models.active_model_id && (
                      <span className="text-primary">· active</span>
                    )}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {m.model_id} · {m.dataset_name} · target {m.target}
                  </p>
                  <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                    MAE {m.metrics.mae} · RMSE {m.metrics.rmse} · R² {m.metrics.r2}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-light text-muted-foreground">
              Trained joblib artifacts will be listed here after a successful training run.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-sm font-medium break-all tabular-nums">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
