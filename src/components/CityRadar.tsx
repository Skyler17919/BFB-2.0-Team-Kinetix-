import { useMemo, useState } from "react";
import { getCityRadar, CITIES } from "@/services/mockEngine";
import { TrendingUp, TrendingDown, MapPin, Activity, ArrowUpRight, Layers } from "lucide-react";
import { PageHeader } from "./glass";

// Simplified India outline as [lon, lat]
const OUTLINE: [number, number][] = [
  [68.2, 23.7],
  [68.8, 22.3],
  [70, 20.8],
  [72.6, 21],
  [72.8, 19],
  [73.4, 16],
  [74.4, 14],
  [75, 12],
  [76.2, 9.8],
  [77, 8.1],
  [77.6, 8.2],
  [78.2, 9],
  [79.3, 10.3],
  [79.8, 11.8],
  [80.3, 13.5],
  [80.2, 15.5],
  [81.3, 16.4],
  [82.3, 17],
  [84, 18.4],
  [85.2, 19.5],
  [86.9, 20.8],
  [87.1, 21.6],
  [88.6, 21.6],
  [89, 22.5],
  [88.7, 24.2],
  [88.1, 26],
  [89.8, 26],
  [92, 25],
  [93, 23],
  [94.6, 24.5],
  [95.2, 26.8],
  [97, 27.8],
  [96, 29.2],
  [94, 28.5],
  [92, 27.5],
  [89, 27],
  [88.1, 27.9],
  [85, 27.5],
  [81, 30.2],
  [79, 31],
  [78.8, 32.5],
  [79.5, 34.5],
  [78, 35.5],
  [75.5, 36.6],
  [74, 35],
  [74.4, 33],
  [74.5, 32],
  [73.8, 30.5],
  [73, 29.5],
  [71, 27.9],
  [70, 27],
  [69.5, 26],
  [70.6, 25.6],
  [71, 24.4],
  [69, 24.3],
];
const K = 20;
const px = (lon: number) => (lon - 67) * K;
const py = (lat: number) => (37 - lat) * K;
const PATH =
  "M" + OUTLINE.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join("L") + "Z";

export function CityRadar() {
  const [city, setCity] = useState("Chandigarh");
  const [hover, setHover] = useState<string | null>(null);
  const data = useMemo(() => getCityRadar(city), [city]);
  const focus = hover ?? city;
  const focusData = useMemo(() => getCityRadar(focus), [focus]);
  const focusCluster = data.geoClusters.find((c) => c.city === focus);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="City Intelligence"
        title="City-to-Skill Relevance Radar"
        subtitle="See which skills are surging and which are fading in each Indian tech hub."
      />

      <label className="glass inline-flex items-center gap-3 rounded-full py-3 pl-5 pr-6 transition-shadow focus-within:shadow-[var(--shadow-glow)]">
        <MapPin className="size-5 text-primary" strokeWidth={1.7} />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="appearance-none bg-transparent text-xl font-semibold tracking-tight outline-none"
        >
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-3">
        <Metric
          icon={Activity}
          label="Active Tech Index"
          value={`${data.activeTechIndex}`}
          suffix="/100"
        />
        <Metric
          icon={ArrowUpRight}
          label="GCC Growth"
          value={`+${data.gccGrowthRate}%`}
          suffix="YoY"
        />
        <Metric icon={Layers} label="City Tier" value={data.tier.toUpperCase()} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass glass-hover p-6">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <TrendingUp className="size-5 text-success" strokeWidth={1.7} /> Surging / Resilient
            Skills
          </h3>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {data.surgingSkills.map((s) => (
              <span
                key={s.skill}
                className="group inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-4 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-success/50"
              >
                {s.skill}
                <span className="text-xs font-medium text-success">+{s.momentum}%</span>
              </span>
            ))}
          </div>
        </div>
        <div className="glass glass-hover p-6">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <TrendingDown className="size-5 text-destructive" strokeWidth={1.7} /> High-Decay /
            At-Risk Skills
          </h3>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {data.decayingSkills.map((s) => (
              <span
                key={s.skill}
                className="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-muted px-4 py-2 text-sm text-foreground/85 transition-all duration-300 hover:-translate-y-0.5 hover:border-destructive/40"
              >
                {s.skill}
                <span className="text-xs font-medium text-destructive/90">−{s.decay}%</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="glass p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold">India Workforce Map</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Live demand radar · marker size = skill demand
            </p>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-steel" />
              Tier-1
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              Tier-2
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_260px]">
          <svg viewBox="0 0 600 600" className="mx-auto w-full max-w-[560px]">
            <defs>
              <radialGradient id="glowC">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="glowS">
                <stop offset="0%" stopColor="var(--steel)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--steel)" stopOpacity="0" />
              </radialGradient>
              <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(125, 211, 252, 0.16)" />
              </pattern>
            </defs>
            <path
              d={PATH}
              fill="url(#dots)"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
            {data.geoClusters.map((c) => {
              const x = px(c.lon),
                y = py(c.lat);
              const r = 6 + c.demand / 9;
              const t1 = c.tier === "Tier-1";
              const active = c.city === focus;
              return (
                <g
                  key={c.city}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(c.city)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setCity(c.city)}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={r * 2.4}
                    fill={`url(#${t1 ? "glowS" : "glowC"})`}
                    opacity={active ? 1 : 0.6}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={active ? 6 : 4}
                    fill={t1 ? "var(--steel)" : "var(--primary)"}
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth={active ? 1.5 : 0}
                  />
                  <text
                    x={x + 10}
                    y={y + 4}
                    fontSize={12}
                    fill={active ? "var(--foreground)" : "var(--muted-foreground)"}
                    fontWeight={active ? 600 : 400}
                  >
                    {c.city}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="glass self-center p-5" style={{ borderRadius: 18 }}>
            <p className="eyebrow">Focused hub</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{focus}</p>
            <dl className="mt-4 space-y-3 text-sm">
              <Row k="Tier" v={focusData.tier} />
              <Row k="Active Tech Index" v={`${focusData.activeTechIndex}/100`} />
              <Row k="GCC Growth" v={`+${focusData.gccGrowthRate}%`} />
              <Row k="Skill Demand" v={`${focusCluster?.demand ?? "—"}`} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-glass-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="glass glass-hover p-5">
      <span className="icon-orb">
        <Icon className="size-4 text-primary" strokeWidth={1.7} />
      </span>
      <p className="eyebrow mt-5">{label}</p>
      <p className="mt-1 text-4xl font-semibold tracking-tight">
        <span className="gradient-text">{value}</span>
        {suffix && (
          <span className="ml-1.5 text-base font-medium text-muted-foreground">{suffix}</span>
        )}
      </p>
    </div>
  );
}
