import type { ReactNode } from "react";

export const CHART = {
  tick: { fill: "rgba(186, 204, 222, 0.72)", fontSize: 11 },
  tooltip: {
    background: "rgba(8, 16, 28, 0.55)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: 16,
    backdropFilter: "blur(22px) saturate(160%)",
    WebkitBackdropFilter: "blur(22px) saturate(160%)",
    color: "rgba(248, 250, 252, 0.94)",
    fontSize: 12,
    boxShadow: "0 16px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
  },
  cyan: "#7dd3fc",
  steel: "#93c5fd",
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
}) {
  return (
    <div className="fade-up space-y-3">
      <p className="eyebrow text-primary">{eyebrow}</p>
      <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">{title}</h2>
      <p className="max-w-2xl text-base font-light text-muted-foreground md:text-lg">{subtitle}</p>
    </div>
  );
}

export function RingGauge({
  value,
  label,
  sublabel,
  size = 200,
  color = "var(--primary)",
}: {
  value: number;
  label: string;
  sublabel?: string;
  size?: number;
  color?: string;
}) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="gradient-text text-4xl font-semibold tracking-tight">{value}%</span>
        <span className="eyebrow mt-1">{label}</span>
        {sublabel && <span className="eyebrow">{sublabel}</span>}
      </div>
    </div>
  );
}

export function GlassBar({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: number;
  tone?: "primary" | "success" | "destructive";
}) {
  const bg =
    tone === "success" ? "bg-success" : tone === "destructive" ? "bg-destructive" : "bg-primary";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/90">{label}</span>
        <span className="font-medium tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${bg} transition-all duration-700`}
          style={{
            width: `${Math.min(100, Math.max(2, value))}%`,
            boxShadow: "0 0 12px currentColor",
          }}
        />
      </div>
    </div>
  );
}
