import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { predictSkillRisk, SKILLS, CITIES } from "@/services/mockEngine";
import {
  Brain,
  Clock,
  TrendingDown,
  ArrowUpRight,
  Search,
  MapPin,
  Sparkles,
  Info,
} from "lucide-react";
import { CHART, RingGauge, GlassBar } from "./glass";

const band = {
  Low: { text: "text-success", dot: "bg-success" },
  Medium: { text: "text-warning", dot: "bg-warning" },
  High: { text: "text-destructive", dot: "bg-destructive" },
} as const;

export function RiskPredictor() {
  const [skill, setSkill] = useState("Manual QA");
  const [years, setYears] = useState(3);
  const [city, setCity] = useState("Bengaluru");
  const [query, setQuery] = useState({ skill: "Manual QA", years: 3, city: "Bengaluru" });

  const result = useMemo(() => predictSkillRisk(query.skill, query.city, query.years), [query]);
  const maxShap = Math.max(...result.shapFactors.map((f) => Math.abs(f.weight)), 0.01);
  const b = band[result.exposureBand];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative pt-4 text-center md:pt-10">
        <p className="eyebrow tracking-[0.35em] text-primary">SkillVector</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-[52px]">
          Predict where your skills <span className="gradient-text">will matter next.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          AI-powered workforce intelligence across India's changing technology markets.
        </p>

        <div className="glass mx-auto mt-8 max-w-2xl space-y-3 p-3 text-left md:p-4">
          <label className="glass-input flex items-center gap-3">
            <Sparkles className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
            <input
              list="skills"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search a skill, e.g. Manual QA"
            />
            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
          </label>
          <datalist id="skills">
            {SKILLS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-input flex items-center gap-3">
              <Clock className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
              <span className="whitespace-nowrap text-sm text-muted-foreground">{years} yrs</span>
              <input
                type="range"
                min={0}
                max={10}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Experience in years"
              />
            </div>
            <label className="glass-input flex items-center gap-3">
              <MapPin className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full appearance-none bg-transparent outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-center pt-1">
            <button className="btn-primary px-10" onClick={() => setQuery({ skill, years, city })}>
              <Sparkles className="size-4" strokeWidth={1.8} /> Analyze Skill
            </button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={Brain}
          label="AI Automation Exposure"
          value={`${result.exposureScore}%`}
          status={
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${b.text}`}>
              <span className={`size-1.5 rounded-full ${b.dot}`} />
              {result.exposureBand.toUpperCase()} RISK
            </span>
          }
          note={`${query.skill} · ${query.city}`}
        />
        <Kpi
          icon={Clock}
          label="Skill Half-Life"
          value={
            <>
              {result.halfLifeMonths}
              <span className="ml-1.5 text-lg font-medium text-muted-foreground">months</span>
            </>
          }
          note={`95% CI: ${result.halfLifeCi[0]}–${result.halfLifeCi[1]}`}
        />
        <Kpi
          icon={TrendingDown}
          label="Tier-1 Decay"
          value={<span className="text-destructive">−{result.tier1DecayVelocity}%</span>}
          note="Demand decline per year"
        />
        <Kpi
          icon={ArrowUpRight}
          label="Tier-2 Growth"
          value={<span className="text-success">+{result.tier2GrowthRate}%</span>}
          note="Demand growth per year"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <div className="glass glass-hover flex flex-col items-center justify-center p-6 lg:col-span-2">
          <p className="eyebrow mb-5 self-start">AI Exposure</p>
          <RingGauge value={result.exposureScore} label="AI Exposure" size={220} />
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Experience of {query.years} yrs in {query.city} cushions exposure by{" "}
            {(query.years * 1.4).toFixed(1)} pts.
          </p>
        </div>
        <div className="glass glass-hover p-6 lg:col-span-3">
          <h3 className="text-2xl font-semibold">Where does this skill survive?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tier-1 decay vs Tier-2 resilience</p>
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={result.regionalDemand} barGap={4}>
                <XAxis dataKey="region" tick={CHART.tick} axisLine={false} tickLine={false} />
                <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={CHART.tooltip}
                  cursor={{ fill: "rgba(125, 211, 252, 0.08)" }}
                />
                <Bar
                  dataKey="tier1"
                  name="Tier-1 demand"
                  fill={CHART.steel}
                  radius={[8, 8, 8, 8]}
                  maxBarSize={22}
                />
                <Bar
                  dataKey="tier2"
                  name="Tier-2 demand"
                  fill={CHART.cyan}
                  radius={[8, 8, 8, 8]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex gap-5 text-xs text-muted-foreground">
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
        </div>
      </section>

      <section className="glass glass-hover p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold">Why is this skill at risk?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Explainable AI · TreeSHAP feature attribution
            </p>
          </div>
          <span className="icon-orb">
            <Info className="size-4 text-muted-foreground" strokeWidth={1.7} />
          </span>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {result.shapFactors.map((f) => (
            <div key={f.factor}>
              <GlassBar
                label={`${f.factor} ${f.weight >= 0 ? "↑" : "↓"}`}
                value={Math.round((Math.abs(f.weight) / maxShap) * 100)}
                tone={f.weight >= 0 ? "destructive" : "success"}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {f.weight >= 0 ? "Pushes risk up" : "Protects the skill"} · weight {f.weight}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  status,
  note,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: React.ReactNode;
  status?: React.ReactNode;
  note: string;
}) {
  return (
    <div className="glass glass-hover p-5">
      <div className="flex items-center justify-between">
        <span className="icon-orb">
          <Icon className="size-4 text-primary" strokeWidth={1.7} />
        </span>
        {status}
      </div>
      <p className="eyebrow mt-5">{label}</p>
      <div className="gradient-text mt-1 text-4xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
