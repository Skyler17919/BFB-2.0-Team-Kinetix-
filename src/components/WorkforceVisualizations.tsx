import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { CHART, PageHeader } from "@/components/glass";
import { StatusBadge } from "@/components/StatusBadge";
import { CITIES, getCityRadar, predictSkillRisk, SKILLS } from "@/services/mockEngine";
import { cn } from "@/lib/utils";

const YEARS = [2026, 2027, 2028, 2029];

export function WorkforceVisualizations() {
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<"all" | "Tier-1" | "Tier-2">("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const skillRows = useMemo(() => {
    const city = cityFilter === "all" ? "Bengaluru" : cityFilter;
    return SKILLS.filter((s) => skillFilter === "all" || s === skillFilter).map((skill) => {
      const p = predictSkillRisk(skill, city, 3);
      return {
        skill: p.skill.length > 14 ? `${p.skill.slice(0, 12)}…` : p.skill,
        fullSkill: p.skill,
        exposure: p.exposureScore,
        halfLife: p.halfLifeMonths,
        tier1Decay: p.tier1DecayVelocity,
        tier2Growth: p.tier2GrowthRate,
        demand: Math.round(100 - p.exposureScore * 0.55 + p.tier2GrowthRate),
        band: p.exposureBand,
      };
    });
  }, [skillFilter, cityFilter]);

  const cityRows = useMemo(() => {
    return CITIES.map((c) => getCityRadar(c))
      .filter((r) => tierFilter === "all" || r.tier === tierFilter)
      .map((r) => ({
        city: r.city,
        tier: r.tier,
        ati: r.activeTechIndex,
        gcc: r.gccGrowthRate,
        demand: r.geoClusters.find((g) => g.city === r.city)?.demand ?? 50,
      }));
  }, [tierFilter]);

  const decayTimeline = useMemo(() => {
    const base =
      skillFilter === "all"
        ? predictSkillRisk("Manual QA", "Bengaluru", 3)
        : predictSkillRisk(skillFilter, cityFilter === "all" ? "Bengaluru" : cityFilter, 3);
    const start = Math.max(20, 100 - base.exposureScore * 0.4);
    return YEARS.map((year, i) => ({
      year: String(year),
      demand: Math.round(Math.max(8, start * Math.pow(0.78, i))),
      skill: base.skill,
    }));
  }, [skillFilter, cityFilter]);

  const riskMatrix = useMemo(
    () =>
      skillRows.map((r) => ({
        ...r,
        x: r.exposure,
        y: r.demand,
        z: Math.max(40, r.demand),
        fill:
          r.band === "High"
            ? "rgba(251, 113, 133, 0.85)"
            : r.band === "Medium"
              ? "rgba(251, 191, 36, 0.85)"
              : "rgba(52, 211, 153, 0.85)",
      })),
    [skillRows],
  );

  const exposureDist = useMemo(() => {
    const buckets = [
      { range: "0–35 Low", count: 0 },
      { range: "36–65 Med", count: 0 },
      { range: "66–100 High", count: 0 },
    ];
    for (const r of skillRows) {
      if (r.exposure < 36) buckets[0]!.count++;
      else if (r.exposure < 66) buckets[1]!.count++;
      else buckets[2]!.count++;
    }
    return buckets;
  }, [skillRows]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Analytics Workspace"
        title={
          <>
            Workforce <span className="gradient-text">Visualizations</span>
          </>
        }
        subtitle="Interactive charts built from the live mockEngine catalogs. Every series is Demo Data / Simulated Prediction — not production market feeds."
      />

      <div className="glass flex flex-wrap items-center gap-3 p-4">
        <StatusBadge status="mock" />
        <p className="text-xs font-light text-muted-foreground">
          Filters apply to mock catalog outputs only.
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          <FilterSelect
            label="Skill"
            value={skillFilter}
            onChange={setSkillFilter}
            options={[{ value: "all", label: "All skills" }, ...SKILLS.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="City"
            value={cityFilter}
            onChange={setCityFilter}
            options={[{ value: "all", label: "Default (BLR)" }, ...CITIES.map((c) => ({ value: c, label: c }))]}
          />
          <FilterSelect
            label="Tier"
            value={tierFilter}
            onChange={(v) => setTierFilter(v as typeof tierFilter)}
            options={[
              { value: "all", label: "All tiers" },
              { value: "Tier-1", label: "Tier-1" },
              { value: "Tier-2", label: "Tier-2" },
            ]}
          />
        </div>
      </div>

      <ChartCard title="Skill Demand Trends" note="Proxy trend from mock exposure (100 − exposure × 0.55 + growth)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={skillRows}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="skill" tick={CHART.tick} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={CHART.tick} />
            <Tooltip contentStyle={CHART.tooltip} />
            <Legend />
            <Line type="monotone" dataKey="demand" name="Demand proxy" stroke={CHART.cyan} strokeWidth={2} dot />
            <Line type="monotone" dataKey="exposure" name="AI exposure" stroke={CHART.steel} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="AI Automation Exposure" note="Distribution of simulated exposure bands">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={exposureDist}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="range" tick={CHART.tick} />
              <YAxis allowDecimals={false} tick={CHART.tick} />
              <Tooltip contentStyle={CHART.tooltip} />
              <Bar dataKey="count" name="Skills" fill={CHART.cyan} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Skill Half-Life" note="Predicted shelf-life months from mock formula">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={skillRows} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={CHART.tick} />
              <YAxis type="category" dataKey="skill" width={90} tick={CHART.tick} />
              <Tooltip contentStyle={CHART.tooltip} />
              <Bar dataKey="halfLife" name="Months" fill={CHART.steel} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Tier-1 vs Tier-2 Demand" note="Decay velocity vs growth rate from mockEngine">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={skillRows}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="skill" tick={CHART.tick} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={CHART.tick} />
            <Tooltip contentStyle={CHART.tooltip} />
            <Legend />
            <Bar dataKey="tier1Decay" name="Tier-1 decay %/yr" fill="rgba(251,113,133,0.75)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="tier2Growth" name="Tier-2 growth %/yr" fill="rgba(52,211,153,0.75)" radius={[6, 6, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="City Skill Demand" note="Seeded geo demand by hub">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cityRows}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="city" tick={CHART.tick} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={CHART.tick} />
              <Tooltip contentStyle={CHART.tooltip} />
              <Bar dataKey="demand" name="Demand" radius={[8, 8, 0, 0]}>
                {cityRows.map((r) => (
                  <Cell key={r.city} fill={r.tier === "Tier-1" ? CHART.cyan : CHART.steel} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="GCC Growth" note="YoY % from getCityRadar (simulated)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cityRows}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="city" tick={CHART.tick} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={CHART.tick} />
              <Tooltip contentStyle={CHART.tooltip} />
              <Line type="monotone" dataKey="gcc" name="GCC growth %" stroke={CHART.cyan} strokeWidth={2} />
              <Line type="monotone" dataKey="ati" name="Active Tech Index" stroke={CHART.steel} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Skill Risk Matrix"
        note="X = AI exposure · Y = demand proxy · bubble = volume · color = risk band"
      >
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 12, right: 12 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" dataKey="x" name="AI exposure" domain={[0, 100]} tick={CHART.tick} />
            <YAxis type="number" dataKey="y" name="Demand" domain={[0, 100]} tick={CHART.tick} />
            <ZAxis type="number" dataKey="z" range={[60, 400]} />
            <Tooltip
              contentStyle={CHART.tooltip}
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: number, name: string) => [value, name]}
              labelFormatter={() => ""}
            />
            <Scatter name="Skills" data={riskMatrix}>
              {riskMatrix.map((r) => (
                <Cell key={r.fullSkill} fill={r.fill} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Skill Decay Timeline" note="Illustrative demand fade using mock half-life trajectory — Demo Data">
        <div className="mb-4 flex flex-wrap gap-6">
          {decayTimeline.map((d) => (
            <div key={d.year} className="min-w-[72px] flex-1">
              <p className="eyebrow mb-2">{d.year}</p>
              <div className="h-28 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                <div
                  className="w-full rounded-xl bg-primary/80 transition-all duration-700"
                  style={{
                    height: `${d.demand}%`,
                    marginTop: `${100 - d.demand}%`,
                    boxShadow: "0 0 20px rgba(var(--primary-rgb),0.35)",
                  }}
                />
              </div>
              <p className="mt-2 text-center text-xs tabular-nums text-muted-foreground">{d.demand}</p>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={decayTimeline}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="year" tick={CHART.tick} />
            <YAxis tick={CHART.tick} domain={[0, 100]} />
            <Tooltip contentStyle={CHART.tooltip} />
            <Line type="monotone" dataKey="demand" name="Skill demand" stroke={CHART.cyan} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-muted-foreground">Skill: {decayTimeline[0]?.skill}</p>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass space-y-4 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-xs font-light text-muted-foreground">{note}</p>
        </div>
        <StatusBadge status="mock" compact />
      </div>
      {children}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="tracking-wide uppercase">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-foreground outline-none",
          "backdrop-blur-md focus:border-primary/40",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
