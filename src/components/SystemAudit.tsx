import { PageHeader } from "@/components/glass";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ARCHITECTURE_NODES,
  CORE_VIEWS,
  FEATURE_AUDIT,
  STACK_SUMMARY,
  STATUS_META,
  type ImplStatus,
} from "@/lib/systemAudit";
import { cn } from "@/lib/utils";
import { ClipboardList, Layers } from "lucide-react";

function countBy(status: ImplStatus) {
  const all = [...CORE_VIEWS, ...FEATURE_AUDIT];
  return all.filter((i) => i.status === status).length;
}

function ArchNode({ name, status }: { name: string; status: ImplStatus }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="text-sm font-light text-foreground/90">{name}</span>
      <StatusBadge status={status} compact />
    </div>
  );
}

export function SystemAudit() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Transparency"
        title={
          <>
            System <span className="gradient-text">Audit</span>
          </>
        }
        subtitle="Honest inventory of SkillVector for Build for Bharat 2.0 — what is live, mocked, planned, or missing. Nothing invented."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(STATUS_META) as ImplStatus[]).map((s) => (
          <div key={s} className="glass p-4">
            <StatusBadge status={s} />
            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{countBy(s)}</p>
            <p className="mt-1 text-xs text-muted-foreground">checklist items</p>
          </div>
        ))}
      </div>

      <section className="glass space-y-4 p-5 md:p-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Stack Snapshot</h3>
        </div>
        <dl className="grid gap-3 md:grid-cols-2">
          {Object.entries(STACK_SUMMARY).map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1.5 text-sm font-light text-foreground/90">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Core Views</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {CORE_VIEWS.map((item) => (
            <article key={item.feature} className="glass glass-hover space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="text-base font-semibold tracking-tight">{item.feature}</h4>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs font-light text-muted-foreground">
                <span className="text-foreground/70">Location: </span>
                <code className="text-[11px] text-primary/90">{item.location}</code>
              </p>
              <p className="text-xs font-light text-muted-foreground">
                <span className="text-foreground/70">Data source: </span>
                {item.dataSource}
              </p>
              <p className="text-sm font-light text-foreground/80">{item.notes}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Feature Checklist</h3>
        <div className="glass overflow-hidden">
          <div className="hidden grid-cols-[1.2fr_0.7fr_1.2fr_1fr_1.2fr] gap-3 border-b border-white/10 px-5 py-3 text-[10px] tracking-[0.14em] text-muted-foreground uppercase md:grid">
            <span>Feature</span>
            <span>Status</span>
            <span>Location</span>
            <span>Data Source</span>
            <span>Notes</span>
          </div>
          <ul className="divide-y divide-white/8">
            {FEATURE_AUDIT.map((item) => (
              <li
                key={item.feature}
                className="grid gap-2 px-5 py-4 md:grid-cols-[1.2fr_0.7fr_1.2fr_1fr_1.2fr] md:items-start md:gap-3"
              >
                <p className="text-sm font-medium">{item.feature}</p>
                <div>
                  <StatusBadge status={item.status} compact />
                </div>
                <code className="text-[11px] break-all text-primary/80">{item.location}</code>
                <p className="text-xs font-light text-muted-foreground">{item.dataSource}</p>
                <p className="text-xs font-light text-muted-foreground">{item.notes}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">System Architecture</h3>
        </div>
        <p className="max-w-2xl text-sm font-light text-muted-foreground">
          Diagram reflects the actual repository. Missing pieces are labeled Planned or Not
          Implemented — not drawn as if they exist.
        </p>

        <div className="glass p-5 md:p-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
            <div className="rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-semibold tracking-tight text-primary">
              SkillVector
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-primary/60 to-white/10" />
            <div className="grid w-full gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-[var(--radius-px)] border border-white/12 bg-white/[0.03] p-4">
                <p className="eyebrow text-primary">Frontend</p>
                <div className="space-y-2">
                  {ARCHITECTURE_NODES.frontend.map((n) => (
                    <ArchNode key={n.name} {...n} />
                  ))}
                </div>
              </div>
              <div className="space-y-3 rounded-[var(--radius-px)] border border-white/12 bg-white/[0.03] p-4">
                <p className="eyebrow text-primary">Services</p>
                <div className="space-y-2">
                  {ARCHITECTURE_NODES.services.map((n) => (
                    <ArchNode key={n.name} {...n} />
                  ))}
                </div>
              </div>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-white/10 to-primary/50" />
            <div className="w-full max-w-xl space-y-3 rounded-[var(--radius-px)] border border-white/12 bg-white/[0.03] p-4">
              <p className="eyebrow text-primary">Data Layer</p>
              <div className="space-y-2">
                {ARCHITECTURE_NODES.data.map((n) => (
                  <ArchNode key={n.name} {...n} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <pre
          className={cn(
            "glass overflow-x-auto p-5 font-mono text-[11px] leading-relaxed text-muted-foreground md:text-xs",
          )}
        >{`
                    SkillVector
                        │
          ┌─────────────┴─────────────┐
          │                           │
       Frontend                    Services
   TanStack + React            FastAPI ml-backend 🟢 READY
   Liquid Glass UI             mockEngine Demo 🟡
   Recharts + SVG map          Supabase 🔴 Missing
          │                           │
          └──────────────┬────────────┘
                         │
                    Data Layer
                         │
              Inline catalogs 🟢
              Upload CSV/XLSX/Parquet 🟢 READY
              joblib artifacts after train 🟢
`}</pre>
      </section>
    </div>
  );
}
