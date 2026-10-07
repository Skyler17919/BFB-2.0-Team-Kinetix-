import { STATUS_META, type ImplStatus } from "@/lib/systemAudit";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  compact = false,
  className,
}: {
  status: ImplStatus;
  compact?: boolean;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] uppercase",
        meta.className,
        className,
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {compact ? meta.short : meta.label}
    </span>
  );
}

export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="glass mb-6 flex flex-wrap items-center gap-3 border-amber-400/25 px-4 py-3">
      <StatusBadge status="mock" />
      <p className="text-sm font-light text-muted-foreground">
        <span className="font-medium text-foreground">Demo Mode</span> — forecasts and integrity
        scores are <span className="text-amber-200/90">Simulated Predictions</span> from{" "}
        <code className="text-xs text-primary">mockEngine.ts</code>. Not production ML.
      </p>
    </div>
  );
}
