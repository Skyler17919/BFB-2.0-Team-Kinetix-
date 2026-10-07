import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART, PageHeader } from "@/components/glass";
import { StatusBadge } from "@/components/StatusBadge";
import {
  datasetToCsv,
  getCatalogDatasets,
  summarizeColumns,
  type CatalogDataset,
} from "@/lib/catalogData";
import { Download, Table2 } from "lucide-react";

export function DataExplorer() {
  const datasets = useMemo(() => getCatalogDatasets(), []);
  const [activeId, setActiveId] = useState(datasets[0]!.id);
  const active = datasets.find((d) => d.id === activeId) ?? datasets[0]!;
  const stats = useMemo(
    () => summarizeColumns(active.rows, active.columns.map((c) => c.name)),
    [active],
  );

  const numericDist = useMemo(() => {
    const numCol = active.columns.find((c) => c.type === "number");
    if (!numCol) return [];
    return active.rows.map((r) => ({
      label: String(r[active.columns[0]!.name] ?? "").slice(0, 12),
      value: Number(r[numCol.name]) || 0,
    }));
  }, [active]);

  const download = (ds: CatalogDataset) => {
    const blob = new Blob([datasetToCsv(ds)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ds.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Data Layer"
        title={
          <>
            Data <span className="gradient-text">Explorer</span>
          </>
        }
        subtitle="Inspect the datasets that actually back SkillVector today: inline mock catalogs — not external Parquet warehouses."
      />

      <div className="glass flex flex-wrap items-center gap-3 p-4">
        <StatusBadge status="mock" />
        <p className="text-sm font-light text-muted-foreground">
          <span className="font-medium text-foreground">Demo Data</span> — no{" "}
          <code className="text-primary">data/</code> folder or uploaded corpora exist in the repo.
          CSV download exports the simulated catalog.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {datasets.map((ds) => (
          <button
            key={ds.id}
            type="button"
            onClick={() => setActiveId(ds.id)}
            className={`glass glass-hover space-y-2 p-4 text-left ${
              activeId === ds.id ? "border-primary/40" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold tracking-tight">{ds.name}</p>
              <StatusBadge status="mock" compact />
            </div>
            <p className="text-xs font-light text-muted-foreground line-clamp-2">{ds.description}</p>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {ds.rows.length} rows · {ds.columns.length} columns
            </p>
          </button>
        ))}
      </div>

      <section className="glass space-y-5 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table2 className="size-4 text-primary" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold tracking-tight">{active.name}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-glass !rounded-2xl !px-4 text-xs" onClick={() => setActiveId(active.id)}>
              Preview Dataset
            </button>
            <button
              type="button"
              className="btn-primary !rounded-2xl !px-4 text-xs"
              onClick={() => download(active)}
            >
              <Download className="size-3.5" strokeWidth={1.5} />
              Download Dataset
            </button>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Dataset name" value={active.name} />
          <Meta label="Rows" value={String(active.rows.length)} />
          <Meta label="Columns" value={String(active.columns.length)} />
          <Meta
            label="Missing values"
            value={String(stats.reduce((a, s) => a + s.missing, 0))}
          />
        </dl>

        <p className="text-xs font-light text-muted-foreground">
          Source: <code className="text-primary">{active.source}</code>
        </p>

        <div>
          <p className="eyebrow mb-3">Column schema & basic statistics</p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-white/10 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Column</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Missing</th>
                  <th className="px-4 py-3 font-medium">Stats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {stats.map((s) => (
                  <tr key={s.col}>
                    <td className="px-4 py-3 font-medium">{s.col}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.type}</td>
                    <td className="px-4 py-3 tabular-nums">{s.missing}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.type === "number"
                        ? `min ${s.min} · max ${s.max} · mean ${s.mean}`
                        : `${s.unique} unique`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {numericDist.length > 0 && (
          <div>
            <p className="eyebrow mb-3">Feature distribution (first numeric column)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={numericDist}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={CHART.tick} interval={0} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={CHART.tick} />
                <Tooltip contentStyle={CHART.tooltip} />
                <Bar dataKey="value" fill={CHART.cyan} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div>
          <p className="eyebrow mb-3">Sample rows</p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-white/10 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                <tr>
                  {active.columns.map((c) => (
                    <th key={c.name} className="px-3 py-3 font-medium">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {active.rows.slice(0, 12).map((row, i) => (
                  <tr key={i}>
                    {active.columns.map((c) => (
                      <td key={c.name} className="px-3 py-2.5 font-light tabular-nums text-foreground/85">
                        {String(row[c.name] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}
