import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { predictSkillRisk, SKILLS, CITIES, type SkillRiskPrediction } from "@/services/mockEngine";
import { useDemoMode } from "@/context/DemoModeContext";
import { useMlBackend } from "@/context/MlBackendContext";
import { explainSkillRiskApi, predictSkillRiskApi } from "@/lib/mlApi";
import { StatusBadge } from "@/components/StatusBadge";
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

type ViewResult = SkillRiskPrediction & {
  source: "demo" | "ml";
  modelLabel?: string;
  shapSource?: string;
};

function companionsFromExposure(exposure: number) {
  const tier1DecayVelocity = Math.round(8 + Math.min(exposure, 100) * 0.15);
  const tier2GrowthRate = Math.round(2 + (100 - Math.min(exposure, 100)) * 0.06);
  return { tier1DecayVelocity, tier2GrowthRate };
}

export function RiskPredictor() {
  const demoMode = useDemoMode();
  const { online, hasTrainedModel } = useMlBackend();
  const [skill, setSkill] = useState("Manual QA");
  const [years, setYears] = useState(3);
  const [city, setCity] = useState("Bengaluru");
  const [query, setQuery] = useState({ skill: "Manual QA", years: 3, city: "Bengaluru" });
  const [liveResult, setLiveResult] = useState<ViewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const demoResult = useMemo(() => {
    const base = predictSkillRisk(query.skill, query.city, query.years);
    return { ...base, source: "demo" as const, shapSource: "mockEngine (simulated)" };
  }, [query]);

  useEffect(() => {
    if (demoMode) {
      setLiveResult(null);
      setLiveError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLiveError(null);
      try {
        if (!online) throw new Error("ML backend offline. Enable Demo Mode or start the backend.");
        if (!hasTrainedModel) {
          throw new Error("No trained model yet. Upload a dataset and train on Train With Your Dataset.");
        }
        const pred = await predictSkillRiskApi({
          skill: query.skill,
          city: query.city,
          experienceYears: query.years,
        });
        let shapFactors: { factor: string; weight: number }[] = [];
        let shapSource = "unavailable";
        try {
          const expl = await explainSkillRiskApi({
            skill: query.skill,
            city: query.city,
            experienceYears: query.years,
          });
          if (expl.ok && expl.shapFactors?.length) {
            shapFactors = expl.shapFactors.map((f) => ({
              factor: f.factor,
              weight: f.weight,
            }));
            shapSource = "shap.TreeExplainer";
          } else if (expl.error) {
            shapSource = expl.error;
          }
        } catch (e) {
          shapSource = e instanceof Error ? e.message : "SHAP request failed";
        }

        const companions = companionsFromExposure(pred.exposureScore);
        if (cancelled) return;
        setLiveResult({
          skill: pred.skill,
          city: pred.city,
          experienceYears: pred.experienceYears,
          exposureScore: Math.round(pred.exposureScore),
          exposureBand: pred.exposureBand,
          halfLifeMonths: pred.halfLifeMonths,
          halfLifeCi: pred.halfLifeCi,
          tier1DecayVelocity: companions.tier1DecayVelocity,
          tier2GrowthRate: companions.tier2GrowthRate,
          regionalDemand: [],
          shapFactors,
          source: "ml",
          modelLabel: pred.model_label,
          shapSource,
        });
      } catch (e) {
        if (!cancelled) {
          setLiveError(e instanceof Error ? e.message : "Prediction failed");
          setLiveResult(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demoMode, online, hasTrainedModel, query]);

  const result: ViewResult = demoMode ? demoResult : liveResult ?? demoResult;
  const usingDemoFallback = !demoMode && !liveResult;
  const maxShap = Math.max(...result.shapFactors.map((f) => Math.abs(f.weight)), 0.01);
  const b = band[result.exposureBand];
  const realShap = result.source === "ml" && result.shapSource === "shap.TreeExplainer";

  return (
    <div className="space-y-8">
      <section className="relative pt-4 text-center md:pt-10">
        <p className="eyebrow tracking-[0.35em] text-primary">SkillVector</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-[52px]">
          Predict where your skills <span className="gradient-text">will matter next.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          AI-powered workforce intelligence across India's changing technology markets.
        </p>

        <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-2">
          <StatusBadge status={demoMode || usingDemoFallback ? "mock" : "trained"} compact />
          <span className="text-xs text-muted-foreground">
            {demoMode
              ? "Demo Mode · mockEngine fallback"
              : loading
                ? "Calling ML backend…"
                : liveResult
                  ? `Live · ${liveResult.modelLabel ?? "trained model"}`
                  : liveError ?? "Waiting for trained model"}
          </span>
        </div>

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
            <div className="glass-input flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="size-3.5 shrink-0" strokeWidth={1.7} />
                  Experience
                </span>
                <span className="font-medium text-foreground">{years} yrs</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="appearance-slider w-full"
                  aria-label="Experience in years used to estimate skill risk and lifespan"
                  title="Years of experience used to estimate skill risk and half-life"
                />
              </div>
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
            <button
              type="button"
              className="btn-primary px-10"
              onClick={() => setQuery({ skill, years, city })}
              disabled={loading}
            >
              <Sparkles className="size-4" strokeWidth={1.8} />
              {loading ? "Analyzing..." : "Analyze Skill"}
            </button>
          </div>
        </div>
        {liveError && !demoMode && (
          <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-muted-foreground">
            {liveError}
          </p>
        )}
      </section>

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
          note={
            result.source === "ml"
              ? "Derived from predicted exposure"
              : "Demand decline per year (demo)"
          }
        />
        <Kpi
          icon={ArrowUpRight}
          label="Tier-2 Growth"
          value={<span className="text-success">+{result.tier2GrowthRate}%</span>}
          note={
            result.source === "ml"
              ? "Derived from predicted exposure"
              : "Demand growth per year (demo)"
          }
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <div className="glass glass-hover flex flex-col items-center justify-center p-6 lg:col-span-2">
          <p className="eyebrow mb-5 self-start">AI Exposure</p>
          <RingGauge value={result.exposureScore} label="AI Exposure" size={220} />
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {result.source === "ml"
              ? `Live prediction from ${result.modelLabel ?? "trained model"}.`
              : `Experience of ${query.years} yrs in ${query.city} cushions exposure by ${(query.years * 1.4).toFixed(1)} pts.`}
          </p>
        </div>
        <div className="glass glass-hover p-6 lg:col-span-3">
          <h3 className="text-2xl font-semibold">Where does this skill survive?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.regionalDemand.length
              ? "Tier-1 decay vs Tier-2 resilience"
              : "Regional demand chart available in Demo Mode (not part of the trained regressor target)."}
          </p>
          <div className="mt-6">
            {result.regionalDemand.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={result.regionalDemand} barGap={4}>
                    <XAxis dataKey="region" tick={CHART.tick} axisLine={false} tickLine={false} />
                    <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={30} />
                    <Tooltip
                      contentStyle={CHART.tooltip}
                      cursor={{ fill: "rgba(var(--primary-rgb), 0.08)" }}
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
              </>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">
                Live mode shows the trained target score + SHAP. Enable Demo Mode for the mock
                regional demand visualization.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="glass glass-hover p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold">Why is this skill at risk?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {realShap
                ? "Real SHAP feature attribution · shap.TreeExplainer"
                : demoMode || usingDemoFallback
                  ? "Demo Mode · simulated attributions from mockEngine"
                  : `Explainability · ${result.shapSource ?? "pending"}`}
            </p>
          </div>
          <span className="icon-orb">
            <Info className="size-4 text-muted-foreground" strokeWidth={1.7} />
          </span>
        </div>
        {!realShap && (
          <p className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs font-light text-muted-foreground">
            {demoMode || usingDemoFallback ? (
              <>
                <span className="font-medium text-amber-100">Simulated attribution.</span> Demo Mode
                uses seeded <code className="text-primary">shapFactors</code>, not TreeExplainer.
              </>
            ) : (
              <>
                <span className="font-medium text-amber-100">SHAP unavailable for this run.</span>{" "}
                {result.shapSource}. Train XGBoost or Random Forest for TreeExplainer support.
              </>
            )}
          </p>
        )}
        {realShap && (
          <p className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-xs font-light text-muted-foreground">
            <span className="font-medium text-emerald-100">Live SHAP</span> computed by the ML backend
            on the transformed feature row.
          </p>
        )}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {result.shapFactors.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-2">No attribution factors available.</p>
          ) : (
            result.shapFactors.map((f) => (
              <div key={f.factor}>
                <GlassBar
                  label={`${f.factor} ${f.weight >= 0 ? "↑" : "↓"}`}
                  value={Math.round((Math.abs(f.weight) / maxShap) * 100)}
                  tone={f.weight >= 0 ? "destructive" : "success"}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {f.weight >= 0 ? "Pushes risk up" : "Protects the skill"} · weight {f.weight}
                  {realShap ? " · SHAP" : " · Simulated"}
                </p>
              </div>
            ))
          )}
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
