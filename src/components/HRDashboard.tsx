import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  UsersRound,
} from "lucide-react";
import {
  analyticsMarketSummary,
  dataScienceMarketSummary,
  trendTraitSummary,
} from "@/services/marketData";
import { CHART, PageHeader } from "./glass";

const SKILL_TRAITS = [
  { key: "coding", label: "Coding", baseline: trendTraitSummary.jds.coding },
  {
    key: "aiAndMlSkills",
    label: "AI & machine learning",
    baseline: trendTraitSummary.jds.aiAndMlSkills,
  },
  { key: "bigData", label: "Big data", baseline: trendTraitSummary.jds.bigData },
  { key: "mathsStats", label: "Maths & statistics", baseline: trendTraitSummary.jds.mathsStats },
  {
    key: "dashboardStorytelling",
    label: "Dashboard & storytelling",
    baseline: trendTraitSummary.jds.dashboardStorytelling,
  },
] as const;

const PERSONALITY_TRAITS = [
  { name: "Conscientiousness", value: trendTraitSummary.sds.conscientiousness },
  { name: "Openness", value: trendTraitSummary.sds.openness },
  { name: "Extraversion", value: trendTraitSummary.sds.extraversion },
  { name: "Agreeableness", value: trendTraitSummary.sds.agreeableness },
  { name: "Neuroticism", value: trendTraitSummary.sds.neuroticism },
];

const SALARY_LABELS: Record<string, string> = {
  "0to3": "0-3 LPA",
  "3to6": "3-6 LPA",
  "6to10": "6-10 LPA",
  "10to15": "10-15 LPA",
  "15to25": "15-25 LPA",
  "25to50": "25-50 LPA",
};

const SKILL_OPTIONS = analyticsMarketSummary.topSkills.map((entry) => entry.skill);

export function HRDashboard() {
  const [traitKey, setTraitKey] = useState<(typeof SKILL_TRAITS)[number]["key"]>("coding");
  const [selfRating, setSelfRating] = useState(8);
  const [candidateSkills, setCandidateSkills] = useState<string[]>(["sql", "python"]);
  const [jobDescription, setJobDescription] = useState(
    "Data analyst role requiring SQL, Python, finance knowledge, and business analysis.",
  );

  const selectedTrait = SKILL_TRAITS.find((trait) => trait.key === traitKey)!;
  const delta = selfRating - selectedTrait.baseline;
  const inflationFlag = delta > 2;

  const roleFit = useMemo(() => {
    const normalizedDescription = jobDescription.toLowerCase();
    const requiredSkills = analyticsMarketSummary.topSkills.filter(({ skill }) =>
      normalizedDescription.includes(skill.toLowerCase()),
    );
    const totalWeight = requiredSkills.reduce((total, item) => total + item.demand, 0);
    const matchedWeight = requiredSkills
      .filter(({ skill }) => candidateSkills.includes(skill))
      .reduce((total, item) => total + item.demand, 0);

    return {
      requiredSkills,
      matchedSkills: requiredSkills.filter(({ skill }) => candidateSkills.includes(skill)),
      score: totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : null,
    };
  }, [candidateSkills, jobDescription]);

  const salaryData = Object.entries(analyticsMarketSummary.salaryBuckets).map(([bucket, jobs]) => ({
    range: SALARY_LABELS[bucket] ?? bucket,
    jobs,
  }));
  const skillDemandData = analyticsMarketSummary.topSkills.map(({ skill, demand }) => ({
    skill: skill === "business analysis" ? "Business analysis" : skill.toUpperCase(),
    postings: demand,
  }));

  const toggleCandidateSkill = (skill: string) => {
    setCandidateSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill],
    );
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="VeloSkill / HR Workspace"
        title={
          <>
            Talent intelligence for <span className="gradient-text">better hiring.</span>
          </>
        }
        subtitle="Review candidate skill claims against cohort baselines, compare profiles with a role brief, and plan from the available job-market snapshot."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={BriefcaseBusiness}
          label="Analytics postings"
          value={analyticsMarketSummary.totalRows.toLocaleString()}
          detail="job rows in snapshot"
        />
        <Metric
          icon={UsersRound}
          label="Data science listings"
          value={dataScienceMarketSummary.totalJobs.toLocaleString()}
          detail="records in company dataset"
        />
        <Metric
          icon={ChartNoAxesColumnIncreasing}
          label="Average salary"
          value={`₹${dataScienceMarketSummary.averageSalaryLpa.toFixed(2)}L`}
          detail="DataScience Jobs.csv average"
        />
        <Metric
          icon={AlertTriangle}
          label="Skill audit threshold"
          value="> 2 pts"
          detail="self-rating minus cohort mean"
        />
      </div>

      <div className="glass flex items-start gap-3 border-warning/30 p-4 text-sm text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <p>
          Snapshot data only: the analytics file has no date column, so these charts describe market
          composition, not hiring trends or forecasts. Candidate scores are session-only and are not
          stored.
        </p>
      </div>

      <section className="grid items-start gap-5 xl:grid-cols-2">
        <div className="glass p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">01 / Candidate review</p>
              <h3 className="mt-2 text-xl font-semibold">Skill inflation check</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Compare a self-reported score with the uploaded JDS cohort average.
              </p>
            </div>
            <span className="icon-orb">
              <AlertTriangle className="size-4 text-primary" />
            </span>
          </div>

          <label className="mt-5 block">
            <span className="eyebrow">Skill area</span>
            <select
              value={traitKey}
              onChange={(event) => setTraitKey(event.target.value as typeof traitKey)}
              className="glass-input mt-2 w-full"
            >
              {SKILL_TRAITS.map((trait) => (
                <option key={trait.key} value={trait.key}>
                  {trait.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-5 rounded-2xl border border-glass-border bg-muted/50 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Candidate self-rating</p>
                <p className="mt-1 text-3xl font-semibold">
                  {selfRating}
                  <span className="ml-1 text-sm text-muted-foreground">/ 10</span>
                </p>
              </div>
              <div className="text-right">
                <p className="eyebrow">JDS cohort mean</p>
                <p className="mt-1 text-2xl font-semibold">
                  {selectedTrait.baseline.toFixed(2)}
                  <span className="ml-1 text-sm text-muted-foreground">/ 10</span>
                </p>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={selfRating}
              onChange={(event) => setSelfRating(Number(event.target.value))}
              className="mt-4 w-full accent-primary"
              aria-label="Candidate self-reported skill rating"
            />
          </div>

          <div
            className={`mt-4 rounded-2xl border p-4 ${inflationFlag ? "border-warning/40 bg-warning/10" : "border-success/30 bg-success/10"}`}
          >
            <p
              className={`text-sm font-semibold ${inflationFlag ? "text-warning" : "text-success"}`}
            >
              {inflationFlag
                ? "Review signal: rating is above the cohort threshold"
                : "No high-delta signal"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Delta {delta >= 0 ? "+" : ""}
              {delta.toFixed(2)} points. A delta above 2 is a review prompt, not proof of
              misrepresentation.
            </p>
          </div>
        </div>

        <div className="glass p-5 md:p-6">
          <p className="eyebrow text-primary">02 / Role alignment</p>
          <h3 className="mt-2 text-xl font-semibold">Weighted role-fit estimate</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Match a candidate profile against skills recognized in the job brief.
          </p>

          <label className="mt-5 block">
            <span className="eyebrow">Job description</span>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              rows={4}
              className="glass-input mt-2 w-full resize-y"
              placeholder="Paste a role description containing required skills"
            />
          </label>

          <fieldset className="mt-4">
            <legend className="eyebrow">Candidate skills</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => {
                const selected = candidateSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCandidateSkill(skill)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected ? "border-primary/50 bg-primary/15 text-foreground" : "border-glass-border bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {skill.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 flex items-end justify-between gap-4 border-t border-glass-border pt-4">
            <div>
              <p className="eyebrow">Recognized role skills</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {roleFit.requiredSkills.length
                  ? roleFit.requiredSkills.map(({ skill }) => skill).join(", ")
                  : "Add SQL, Python, finance, Java, or business analysis to the brief."}
              </p>
            </div>
            <p className="gradient-text shrink-0 text-3xl font-semibold" aria-live="polite">
              {roleFit.score === null ? "—" : `${roleFit.score}%`}
            </p>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Posting-frequency weighted keyword coverage from the analytics snapshot; no external
            embedding or model service is connected.
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartPanel
          title="Skills appearing in analytics postings"
          caption="Observed mentions among the most frequent extracted skills"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={skillDemandData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="skill" tick={CHART.tick} axisLine={false} tickLine={false} />
              <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={42} />
              <Tooltip contentStyle={CHART.tooltip} />
              <Bar
                dataKey="postings"
                name="Postings"
                fill="#7dd3fc"
                radius={[6, 6, 0, 0]}
                maxBarSize={46}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Salary range distribution"
          caption="Analytics job postings by listed salary band"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salaryData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="range" tick={CHART.tick} axisLine={false} tickLine={false} />
              <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={42} />
              <Tooltip contentStyle={CHART.tooltip} />
              <Bar
                dataKey="jobs"
                name="Job postings"
                fill="#34d399"
                radius={[6, 6, 0, 0]}
                maxBarSize={46}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass overflow-hidden">
          <div className="p-5 md:p-6">
            <p className="eyebrow text-primary">03 / Workforce planning</p>
            <h3 className="mt-2 text-xl font-semibold">Data science hiring by company</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aggregated listing volume and average salary from DataScience Jobs.csv.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-muted/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 text-right font-medium">Listed roles</th>
                  <th className="px-5 py-3 text-right font-medium">Avg. salary</th>
                </tr>
              </thead>
              <tbody>
                {dataScienceMarketSummary.topCompanies.map((company) => (
                  <tr key={company.company} className="border-t border-glass-border">
                    <td className="px-5 py-3 font-medium">{company.company}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {company.jobs.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {company.avgSalaryLpa === undefined
                        ? "—"
                        : `₹${company.avgSalaryLpa.toFixed(2)}L`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass p-5 md:p-6">
          <p className="eyebrow text-primary">04 / Cohort reference</p>
          <h3 className="mt-2 text-xl font-semibold">Personality trait baselines</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Mean scores in SDS Personality Traits.xlsx; displayed as dataset context, not an
            individual prediction.
          </p>
          <div className="mt-5 space-y-3">
            {PERSONALITY_TRAITS.map((trait) => (
              <div key={trait.name} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 text-muted-foreground">{trait.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-steel"
                    style={{ width: `${trait.value}%` }}
                  />
                </div>
                <span className="w-10 text-right tabular-nums">{trait.value.toFixed(1)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-glass-border pt-4">
            <p className="text-2xl font-semibold gradient-text">
              {(trendTraitSummary.sds.successRate * 100).toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              High classification share in the uploaded cohort. This is descriptive and is not used
              to predict candidate resilience.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="glass glass-hover p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <Icon className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
      </div>
      <p className="mt-3 text-3xl font-semibold gradient-text">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ChartPanel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass p-5 md:p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{caption}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
