import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  GraduationCap,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useMlBackend } from "@/context/MlBackendContext";
import {
  explainSkillRiskApi,
  predictResilienceApi,
  predictSkillRiskApi,
  recommendSkillsApi,
  type ExplainApiResult,
  type RecommendationApiResult,
  type ResilienceApiResult,
  type SkillRiskApiResult,
} from "@/lib/mlApi";

type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

type StepId =
  | "personal"
  | "professional"
  | "education"
  | "skills"
  | "experience"
  | "certifications"
  | "projects"
  | "ai"
  | "goals"
  | "resilience"
  | "review";

const STEP_META: Array<{ id: StepId; label: string; short: string }> = [
  { id: "personal", label: "01 Personal", short: "Personal" },
  { id: "professional", label: "02 Professional", short: "Professional" },
  { id: "education", label: "03 Education", short: "Education" },
  { id: "skills", label: "04 Skills", short: "Skills" },
  { id: "experience", label: "05 Experience", short: "Experience" },
  { id: "certifications", label: "06 Certifications", short: "Certifications" },
  { id: "projects", label: "07 Projects", short: "Projects" },
  { id: "ai", label: "08 AI Exposure", short: "AI Exposure" },
  { id: "goals", label: "09 Career Goals", short: "Career Goals" },
  { id: "resilience", label: "10 Resilience", short: "Resilience" },
  { id: "review", label: "11 Review", short: "Review" },
];

const skillLevels: SkillLevel[] = ["Beginner", "Intermediate", "Advanced", "Expert"];
const PROFILE_STORAGE_KEY = "skillvector_profile_builder";

const emptyEducation = () => ({
  school: "",
  degree: "",
  field: "",
  year: "",
});

const emptyExperience = () => ({
  role: "",
  company: "",
  period: "",
  description: "",
  technologies: "",
});

const emptyCertification = () => ({
  name: "",
  issuer: "",
  year: "",
});

const emptyProject = () => ({
  name: "",
  summary: "",
  impact: "",
  stack: "",
});

const createDefaultProfile = () => ({
  personal: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
  },
  professional: {
    currentRole: "",
    yearsExperience: "",
    preferredCity: "Bengaluru",
    workStyle: "Hybrid",
    focus: "",
  },
  education: [emptyEducation()],
  skills: [
    { name: "Python", level: "Expert" },
    { name: "SQL", level: "Advanced" },
  ],
  experience: [
    {
      role: "Data Analyst",
      company: "SkillVector Labs",
      period: "2024 — Present",
      description: "Built workforce intelligence dashboards and forecast workflows.",
      technologies: "Python · SQL · Power BI",
    },
  ],
  certifications: [emptyCertification()],
  projects: [emptyProject()],
  ai: {
    automationExposure: 62,
    trend: "Growing",
    strongestSkill: "Python",
  },
  goals: {
    shortTerm: "Lead a workforce intelligence initiative",
    longTerm: "Build resilient career pathways across industries",
    learning: "AI and analytics for strategic workforce planning",
  },
  resilience: {
    n: 4,
    e: 6,
    o: 7,
    a: 5,
    c: 8,
  },
});

const inputClass =
  "glass-input w-full rounded-[22px] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70";

function loadStoredProfile() {
  const fallback = createDefaultProfile();

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const serialized = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!serialized) {
      return fallback;
    }

    const parsed = JSON.parse(serialized) as Partial<typeof fallback>;
    return {
      ...fallback,
      ...parsed,
      personal: { ...fallback.personal, ...parsed.personal },
      professional: { ...fallback.professional, ...parsed.professional },
      education: Array.isArray(parsed.education) && parsed.education.length ? parsed.education : fallback.education,
      skills: Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills : fallback.skills,
      experience: Array.isArray(parsed.experience) && parsed.experience.length ? parsed.experience : fallback.experience,
      certifications: Array.isArray(parsed.certifications) && parsed.certifications.length ? parsed.certifications : fallback.certifications,
      projects: Array.isArray(parsed.projects) && parsed.projects.length ? parsed.projects : fallback.projects,
      ai: { ...fallback.ai, ...parsed.ai },
      goals: { ...fallback.goals, ...parsed.goals },
      resilience: { ...fallback.resilience, ...parsed.resilience },
    };
  } catch {
    return fallback;
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2 text-sm text-foreground/90">
      <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">{label}</span>
      {children}
    </label>
  );
}

function RangePill({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="glass glass-hover flex items-center gap-3 rounded-[24px] px-4 py-3">
      <span className="w-12 text-xs uppercase tracking-[0.2em] text-muted-foreground">{value}</span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full flex-1 cursor-pointer rounded-full"
        style={{ accentColor: "var(--primary)" }}
      />
    </div>
  );
}

export function ProfileBuilder() {
  const [profile, setProfile] = useState(loadStoredProfile);
  const [stepIndex, setStepIndex] = useState(0);
  const [analysisStage, setAnalysisStage] = useState<"idle" | "analyzing" | "dashboard">("idle");
  const { online, health } = useMlBackend();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile]);
  const [analysis, setAnalysis] = useState<{
    loading: boolean;
    error: string | null;
    prediction: SkillRiskApiResult | null;
    explanation: ExplainApiResult | null;
    recommendations: RecommendationApiResult | null;
    resilience: ResilienceApiResult | null;
  }>({
    loading: false,
    error: null,
    prediction: null,
    explanation: null,
    recommendations: null,
    resilience: null,
  });

  const currentStep = STEP_META[stepIndex];
  const progress = useMemo(() => ((stepIndex + 1) / STEP_META.length) * 100, [stepIndex]);
  const primarySkill = useMemo(() => profile.skills[0]?.name || "Python", [profile.skills]);

  const updateField = <T extends keyof typeof profile, K extends keyof (typeof profile)[T]>(
    section: T,
    field: K,
    value: (typeof profile)[T][K],
  ) => {
    setProfile((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
    }));
  };

  const updateArray = <T,>(section: "education" | "experience" | "certifications" | "projects", index: number, field: string, value: T) => {
    setProfile((prev) => ({
      ...prev,
      [section]: (prev[section] as Array<Record<string, unknown>>).map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItem = (section: "education" | "experience" | "certifications" | "projects") => {
    const map = {
      education: emptyEducation(),
      experience: emptyExperience(),
      certifications: emptyCertification(),
      projects: emptyProject(),
    };
    setProfile((prev) => ({
      ...prev,
      [section]: [...(prev[section] as any[]), map[section]],
    }));
  };

  const removeItem = (
    section: "education" | "experience" | "certifications" | "projects",
    index: number,
  ) => {
    setProfile((prev) => ({
      ...prev,
      [section]: (prev[section] as any[]).filter((_, i) => i !== index),
    }));
  };

  const addSkill = () => {
    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: "New Skill", level: "Intermediate" }],
    }));
  };

  const updateSkill = (index: number, field: "name" | "level", value: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.map((skill, i) => (i === index ? { ...skill, [field]: value } : skill)),
    }));
  };

  const removeSkill = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const next = () => setStepIndex((i) => Math.min(i + 1, STEP_META.length - 1));
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    if (analysisStage !== "dashboard") return;

    let active = true;
    const city = profile.professional.preferredCity || "Bengaluru";
    const skill = primarySkill;
    const experienceYears = Number(profile.professional.yearsExperience || "3") || 3;

    setAnalysis({
      loading: true,
      error: null,
      prediction: null,
      explanation: null,
      recommendations: null,
      resilience: null,
    });

    const run = async () => {
      try {
        const [prediction, explanation, recommendations, resilience] = await Promise.all([
          predictSkillRiskApi({
            skill,
            city,
            experienceYears,
          }),
          explainSkillRiskApi({
            skill,
            city,
            experienceYears,
            topK: 8,
          } as any),
          recommendSkillsApi({
            skill,
            city,
            topK: 5,
          }),
          predictResilienceApi({
            personality: profile.resilience,
          }),
        ]);

        if (!active) return;
        setAnalysis({
          loading: false,
          error: null,
          prediction,
          explanation,
          recommendations,
          resilience,
        });
      } catch (error) {
        if (!active) return;
        setAnalysis({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to fetch live profile analysis.",
          prediction: null,
          explanation: null,
          recommendations: null,
          resilience: null,
        });
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [analysisStage, primarySkill, profile.professional.preferredCity, profile.professional.yearsExperience, profile.resilience]);

  const handleAnalyze = () => {
    setAnalysisStage("analyzing");
    setTimeout(() => {
      setAnalysisStage("dashboard");
    }, 1200);
  };

  if (analysisStage === "dashboard") {
    const bundleFiles = health?.bundle?.files ?? {};
    const summaryCards = [
      { label: "Skill exposure", value: analysis.prediction ? `${analysis.prediction.exposureScore.toFixed(1)}%` : "--", tone: "text-primary" },
      { label: "Half-life", value: analysis.prediction ? `${analysis.prediction.halfLifeMonths.toFixed(1)} mo` : "--", tone: "text-amber-300" },
      { label: "Resilience", value: analysis.resilience?.resilience_class ?? "--", tone: "text-emerald-300" },
      { label: "Backend", value: online ? "Online" : "Offline", tone: online ? "text-emerald-300" : "text-red-300" },
    ];

    return (
      <div className="space-y-6">
        <div className="glass p-5 md:p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow text-primary">Profile analysis</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Workforce intelligence</h2>
            </div>
            <button type="button" className="btn-glass !rounded-full !px-4 !py-2 text-xs" onClick={() => setAnalysisStage("idle")}>
              Back to profile
            </button>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <div key={item.label} className="glass p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                <p className={`mt-3 text-2xl font-semibold tracking-tight ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {analysis.loading && (
            <div className="glass mb-6 p-5">
              <p className="text-sm text-muted-foreground">Running the live ML pipeline for your profile…</p>
            </div>
          )}

          {analysis.error && (
            <div className="glass mb-6 border-red-400/30 bg-red-500/5 p-5 text-sm text-red-200">
              {analysis.error}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="glass p-5">
              <p className="eyebrow mb-4 text-primary">Live risk summary</p>
              {analysis.prediction ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Skill</p>
                      <h3 className="text-2xl font-semibold tracking-tight">{analysis.prediction.skill}</h3>
                    </div>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs uppercase tracking-[0.18em] text-primary">
                      {analysis.prediction.exposureBand}
                    </span>
                  </div>
                  <div className="rounded-[26px] border border-glass-border bg-background/10 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                      <span>Exposure score</span>
                      <span>{analysis.prediction.exposureScore.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400"
                        style={{ width: `${Math.min(100, analysis.prediction.exposureScore)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-glass-border bg-background/10 p-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Half-life</p>
                      <p className="mt-2 text-xl font-semibold">{analysis.prediction.halfLifeMonths.toFixed(1)} months</p>
                    </div>
                    <div className="rounded-[22px] border border-glass-border bg-background/10 p-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">City</p>
                      <p className="mt-2 text-xl font-semibold">{analysis.prediction.city}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No live prediction available yet.</p>
              )}
            </section>

            <section className="glass p-5">
              <p className="eyebrow mb-4 text-primary">Explainability</p>
              {analysis.explanation?.shapFactors?.length ? (
                <div className="space-y-3">
                  {analysis.explanation.shapFactors.slice(0, 6).map((factor) => (
                    <div key={factor.factor} className="rounded-[18px] border border-glass-border bg-background/10 p-3">
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="text-foreground/90">{factor.factor}</span>
                        <span className={factor.weight >= 0 ? "text-emerald-300" : "text-rose-300"}>{factor.weight.toFixed(3)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/80">
                        <div
                          className={`h-full rounded-full ${factor.weight >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
                          style={{ width: `${Math.min(100, Math.abs(factor.weight) * 130)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No SHAP factors were produced.</p>
              )}
            </section>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <section className="glass p-5">
              <p className="eyebrow mb-4 text-primary">Skill recommendations</p>
              {analysis.recommendations?.recommendations?.length ? (
                <ul className="space-y-3">
                  {analysis.recommendations.recommendations.map((item, index) => (
                    <li key={`${item.skill}-${index}`} className="flex items-center justify-between gap-3 rounded-[18px] border border-glass-border bg-background/10 px-3 py-2.5 text-sm">
                      <span className="text-foreground/90">{item.skill}</span>
                      <span className="text-muted-foreground">{item.distance.toFixed(3)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recommendations available yet.</p>
              )}
            </section>

            <section className="glass p-5">
              <p className="eyebrow mb-4 text-primary">Resilience model</p>
              {analysis.resilience ? (
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-glass-border bg-background/10 p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Class</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-300">{analysis.resilience.resilience_class}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {Object.entries(analysis.resilience.personality ?? {}).map(([key, value]) => (
                      <div key={key} className="rounded-[18px] border border-glass-border bg-background/10 p-2">
                        <p className="text-[10px] uppercase tracking-[0.2em]">{key}</p>
                        <p className="mt-1 text-lg font-medium text-foreground">{Number(value).toFixed(1)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No resilience output available yet.</p>
              )}
            </section>
          </div>

          <section className="mt-6 glass p-5">
            <p className="eyebrow mb-4 text-primary">Model and data status</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["XGBoost skill decay", bundleFiles.xgboost_model ?? false],
                ["SHAP explainer", bundleFiles.shap_explainer ?? false],
                ["OCEAN / personality RF", bundleFiles.personality_model ?? false],
                ["ChromaDB skill catalog", bundleFiles.chroma_db ?? false],
              ].map(([label, isReady]) => (
                <div key={String(label)} className="rounded-[22px] border border-glass-border bg-background/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-foreground/90">{String(label)}</p>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${isReady ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                      {isReady ? "Ready" : "Missing"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (analysisStage === "analyzing") {
    return (
      <div className="space-y-6">
        <div className="glass overflow-hidden p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">Analysis</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Analyzing your workforce profile...</h2>
            </div>
            <div className="icon-orb size-12">
              <Sparkles className="size-5 text-primary" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-4">
            {[
              "Profile processed",
              "Skill intelligence",
              "SHAP explainability",
              "Resilience analysis",
              "Skill graph analysis",
            ].map((item, index) => {
              const ready = index < 1;
              return (
                <div key={item} className="glass flex items-center gap-3 rounded-[22px] px-4 py-3">
                  <div
                    className={`flex size-6 items-center justify-center rounded-full border ${
                      ready ? "border-primary/40 bg-primary/15 text-primary" : "border-glass-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {ready ? <Check className="size-3.5" strokeWidth={2.5} /> : <span className="size-2 rounded-full bg-current" />}
                  </div>
                  <span className="text-sm text-foreground/90">{item}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 h-2 overflow-hidden rounded-full bg-muted/80">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (stepIndex / STEP_META.length) * 100 + 20)}%` }}
            />
          </div>
        </div>

        <div className="glass p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Transitioning to workforce intelligence</p>
        </div>
      </div>
    );
  }

  if (stepIndex === STEP_META.length - 1) {
    return (
      <div className="space-y-6">
        <div className="glass p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">Profile Review</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Build Your Workforce Profile</h2>
            </div>
            <button type="button" className="btn-glass !rounded-full !px-4 !py-2 text-xs" onClick={() => setStepIndex(0)}>
              <ArrowLeft className="size-3.5" /> Edit Profile
            </button>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {STEP_META.slice(0, -1).map((step) => {
              const completed = stepIndex >= STEP_META.findIndex((item) => item.id === step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setStepIndex(STEP_META.findIndex((item) => item.id === step.id))}
                  className={`glass glass-hover rounded-[22px] px-3 py-2 text-left text-xs ${completed ? "border-primary/30 bg-primary/10" : ""}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-foreground/90">{step.short}</span>
                    {completed && <Check className="size-3.5 text-primary" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="glass p-4 md:p-5">
              <p className="eyebrow mb-3 text-primary">Personal</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="text-foreground">Name:</span> {profile.personal.fullName || "Not provided"}</p>
                <p><span className="text-foreground">Title:</span> {profile.personal.title || "Not provided"}</p>
                <p><span className="text-foreground">Location:</span> {profile.personal.location || "Not provided"}</p>
              </div>
            </section>
            <section className="glass p-4 md:p-5">
              <p className="eyebrow mb-3 text-primary">Professional</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="text-foreground">Current role:</span> {profile.professional.currentRole || "Not provided"}</p>
                <p><span className="text-foreground">Experience:</span> {profile.professional.yearsExperience || "Not provided"}</p>
                <p><span className="text-foreground">Preferred city:</span> {profile.professional.preferredCity}</p>
              </div>
            </section>
            <section className="glass p-4 md:p-5">
              <p className="eyebrow mb-3 text-primary">Skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.length ? profile.skills.map(skill => (
                  <span key={skill.name} className="rounded-full border border-glass-border bg-muted px-2.5 py-1 text-xs text-foreground/90">
                    {skill.name}
                  </span>
                )) : <span className="text-xs text-muted-foreground">No skills added yet</span>}
              </div>
            </section>
            <section className="glass p-4 md:p-5">
              <p className="eyebrow mb-3 text-primary">AI Exposure</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="text-foreground">Automation exposure:</span> {profile.ai.automationExposure}%</p>
                <p><span className="text-foreground">Trend:</span> {profile.ai.trend}</p>
              </div>
            </section>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" className="btn-glass !rounded-full !px-5" onClick={prev}>
              <ArrowLeft className="size-4" /> Back
            </button>
            <button type="button" className="btn-primary !rounded-full !px-6" onClick={handleAnalyze}>
              Analyze My Workforce
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepContent = (() => {
    switch (currentStep.id) {
      case "personal":
        return (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name"><input className={inputClass} placeholder="Aarav Sharma" value={profile.personal.fullName} onChange={(e) => updateField("personal", "fullName", e.target.value)} /></Field>
              <Field label="Professional title"><input className={inputClass} placeholder="Senior Product Analyst" value={profile.personal.title} onChange={(e) => updateField("personal", "title", e.target.value)} /></Field>
              <Field label="Email"><input className={inputClass} placeholder="aarav@skillvector.ai" value={profile.personal.email} onChange={(e) => updateField("personal", "email", e.target.value)} /></Field>
              <Field label="Phone"><input className={inputClass} placeholder="+91 98765 43210" value={profile.personal.phone} onChange={(e) => updateField("personal", "phone", e.target.value)} /></Field>
            </div>
            <Field label="Current city"><input className={inputClass} placeholder="Bengaluru" value={profile.personal.location} onChange={(e) => updateField("personal", "location", e.target.value)} /></Field>
            <Field label="Professional summary"><textarea className={`${inputClass} min-h-[120px] rounded-[24px]`} placeholder="Tell us about your strengths, career focus, and what you want to do next." value={profile.personal.summary} onChange={(e) => updateField("personal", "summary", e.target.value)} /></Field>
          </div>
        );
      case "professional":
        return (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Current role"><input className={inputClass} placeholder="Data Analyst" value={profile.professional.currentRole} onChange={(e) => updateField("professional", "currentRole", e.target.value)} /></Field>
              <Field label="Years of experience"><input className={inputClass} placeholder="5" value={profile.professional.yearsExperience} onChange={(e) => updateField("professional", "yearsExperience", e.target.value)} /></Field>
              <Field label="Preferred city"><input className={inputClass} placeholder="Bengaluru" value={profile.professional.preferredCity} onChange={(e) => updateField("professional", "preferredCity", e.target.value)} /></Field>
              <Field label="Work style"><select className={inputClass} value={profile.professional.workStyle} onChange={(e) => updateField("professional", "workStyle", e.target.value)}>
                <option>Hybrid</option>
                <option>Remote</option>
                <option>On-site</option>
                <option>Flexible</option>
              </select></Field>
            </div>
            <Field label="Primary focus area"><textarea className={`${inputClass} min-h-[100px] rounded-[22px]`} placeholder="AI reporting, product analytics, business intelligence, platform design..." value={profile.professional.focus} onChange={(e) => updateField("professional", "focus", e.target.value)} /></Field>
          </div>
        );
      case "education":
        return (
          <div className="space-y-4">
            {profile.education.map((item, index) => (
              <div key={`edu-${index}`} className="glass glass-hover rounded-[26px] p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground/90">Education {index + 1}</p>
                  {profile.education.length > 1 && (
                    <button type="button" className="rounded-full border border-glass-border bg-muted p-2 text-muted-foreground transition hover:text-foreground" onClick={() => removeItem("education", index)}><X className="size-3.5" /></button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="School / Institute"><input className={inputClass} value={item.school} onChange={(e) => updateArray("education", index, "school", e.target.value)} /></Field>
                  <Field label="Degree"><input className={inputClass} value={item.degree} onChange={(e) => updateArray("education", index, "degree", e.target.value)} /></Field>
                  <Field label="Field"><input className={inputClass} value={item.field} onChange={(e) => updateArray("education", index, "field", e.target.value)} /></Field>
                  <Field label="Year of completion"><input className={inputClass} type="text" inputMode="numeric" placeholder="2024" title="Graduation year or completion year" value={item.year} onChange={(e) => updateArray("education", index, "year", e.target.value)} /></Field>
                </div>
              </div>
            ))}
            <button type="button" className="btn-glass !rounded-full !px-4 text-xs" onClick={() => addItem("education")}><Plus className="size-3.5" /> Add Education</button>
          </div>
        );
      case "skills":
        return (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              {profile.skills.map((skill, index) => (
                <div key={`${skill.name}-${index}`} className="glass glass-hover flex items-center gap-3 rounded-[22px] px-3 py-2">
                  <div className="space-y-1">
                    <input className="w-28 bg-transparent text-sm text-foreground outline-none" value={skill.name} onChange={(e) => updateSkill(index, "name", e.target.value)} />
                    <select className="bg-transparent text-[10px] uppercase tracking-[0.18em] text-muted-foreground outline-none" value={skill.level} onChange={(e) => updateSkill(index, "level", e.target.value)}>
                      {skillLevels.map(level => <option key={level} className="bg-slate-900 text-foreground">{level}</option>)}
                    </select>
                  </div>
                  <button type="button" className="rounded-full border border-glass-border bg-muted p-1.5 text-muted-foreground transition hover:text-foreground" onClick={() => removeSkill(index)}><X className="size-3.5" /></button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-glass !rounded-full !px-4 text-xs" onClick={addSkill} disabled={profile.skills.length >= 5}><Plus className="size-3.5" /> Add Skill</button>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Maximum 5 skills</p>
          </div>
        );
      case "experience":
        return (
          <div className="space-y-4">
            {profile.experience.map((item, index) => (
              <div key={`exp-${index}`} className="glass glass-hover rounded-[26px] p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground/90">Experience {index + 1}</p>
                  {profile.experience.length > 1 && (
                    <button type="button" className="rounded-full border border-glass-border bg-muted p-2 text-muted-foreground transition hover:text-foreground" onClick={() => removeItem("experience", index)}><X className="size-3.5" /></button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Role"><input className={inputClass} value={item.role} onChange={(e) => updateArray("experience", index, "role", e.target.value)} /></Field>
                  <Field label="Company"><input className={inputClass} value={item.company} onChange={(e) => updateArray("experience", index, "company", e.target.value)} /></Field>
                  <Field label="Period"><input className={inputClass} value={item.period} onChange={(e) => updateArray("experience", index, "period", e.target.value)} /></Field>
                  <Field label="Technologies"><input className={inputClass} value={item.technologies} onChange={(e) => updateArray("experience", index, "technologies", e.target.value)} /></Field>
                </div>
                <div className="mt-4">
                  <Field label="Description"><textarea className={`${inputClass} min-h-[110px] rounded-[22px]`} value={item.description} onChange={(e) => updateArray("experience", index, "description", e.target.value)} /></Field>
                </div>
              </div>
            ))}
            <button type="button" className="btn-glass !rounded-full !px-4 text-xs" onClick={() => addItem("experience")}><Plus className="size-3.5" /> Add Experience</button>
          </div>
        );
      case "certifications":
        return (
          <div className="space-y-4">
            {profile.certifications.map((item, index) => (
              <div key={`cert-${index}`} className="glass glass-hover rounded-[24px] p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground/90">Certification {index + 1}</p>
                  {profile.certifications.length > 1 && (
                    <button type="button" className="rounded-full border border-glass-border bg-muted p-2 text-muted-foreground transition hover:text-foreground" onClick={() => removeItem("certifications", index)}><X className="size-3.5" /></button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Certification"><input className={inputClass} value={item.name} onChange={(e) => updateArray("certifications", index, "name", e.target.value)} /></Field>
                  <Field label="Issuer"><input className={inputClass} value={item.issuer} onChange={(e) => updateArray("certifications", index, "issuer", e.target.value)} /></Field>
                  <Field label="Completion year"><input className={inputClass} type="text" inputMode="numeric" placeholder="2024" title="Year the certificate was earned" value={item.year} onChange={(e) => updateArray("certifications", index, "year", e.target.value)} /></Field>
                </div>
              </div>
            ))}
            <button type="button" className="btn-glass !rounded-full !px-4 text-xs" onClick={() => addItem("certifications")}><Plus className="size-3.5" /> Add Certification</button>
          </div>
        );
      case "projects":
        return (
          <div className="space-y-4">
            {profile.projects.map((item, index) => (
              <div key={`project-${index}`} className="glass glass-hover rounded-[24px] p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground/90">Project {index + 1}</p>
                  {profile.projects.length > 1 && (
                    <button type="button" className="rounded-full border border-glass-border bg-muted p-2 text-muted-foreground transition hover:text-foreground" onClick={() => removeItem("projects", index)}><X className="size-3.5" /></button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Project name"><input className={inputClass} value={item.name} onChange={(e) => updateArray("projects", index, "name", e.target.value)} /></Field>
                  <Field label="Stack"><input className={inputClass} value={item.stack} onChange={(e) => updateArray("projects", index, "stack", e.target.value)} /></Field>
                </div>
                <div className="mt-4 space-y-4">
                  <Field label="Summary"><textarea className={`${inputClass} min-h-[100px] rounded-[22px]`} value={item.summary} onChange={(e) => updateArray("projects", index, "summary", e.target.value)} /></Field>
                  <Field label="Impact"><textarea className={`${inputClass} min-h-[100px] rounded-[22px]`} value={item.impact} onChange={(e) => updateArray("projects", index, "impact", e.target.value)} /></Field>
                </div>
              </div>
            ))}
            <button type="button" className="btn-glass !rounded-full !px-4 text-xs" onClick={() => addItem("projects")}><Plus className="size-3.5" /> Add Project</button>
          </div>
        );
      case "ai":
        return (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Automation exposure"><input type="number" min={0} max={100} className={inputClass} value={profile.ai.automationExposure} onChange={(e) => setProfile((prev) => ({ ...prev, ai: { ...prev.ai, automationExposure: Number(e.target.value) } }))} /></Field>
              <Field label="Trend"><select className={inputClass} value={profile.ai.trend} onChange={(e) => setProfile((prev) => ({ ...prev, ai: { ...prev.ai, trend: e.target.value } }))}>
                <option>Growing</option>
                <option>Stable</option>
                <option>Declining</option>
                <option>Volatile</option>
              </select></Field>
            </div>
            <Field label="Strongest skill"><input className={inputClass} value={profile.ai.strongestSkill} onChange={(e) => setProfile((prev) => ({ ...prev, ai: { ...prev.ai, strongestSkill: e.target.value } }))} /></Field>
          </div>
        );
      case "goals":
        return (
          <div className="space-y-5">
            <Field label="Short-term goal"><textarea className={`${inputClass} min-h-[110px] rounded-[22px]`} value={profile.goals.shortTerm} onChange={(e) => setProfile((prev) => ({ ...prev, goals: { ...prev.goals, shortTerm: e.target.value } }))} /></Field>
            <Field label="Long-term goal"><textarea className={`${inputClass} min-h-[110px] rounded-[22px]`} value={profile.goals.longTerm} onChange={(e) => setProfile((prev) => ({ ...prev, goals: { ...prev.goals, longTerm: e.target.value } }))} /></Field>
            <Field label="Learning focus"><textarea className={`${inputClass} min-h-[100px] rounded-[22px]`} value={profile.goals.learning} onChange={(e) => setProfile((prev) => ({ ...prev, goals: { ...prev.goals, learning: e.target.value } }))} /></Field>
          </div>
        );
      case "resilience":
        return (
          <div className="space-y-5">
            <div className="grid gap-4">
              <div className="glass p-4 md:p-5">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">Neuroticism</p>
                <RangePill value={profile.resilience.n} onChange={(value) => setProfile((prev) => ({ ...prev, resilience: { ...prev.resilience, n: value } }))} />
              </div>
              <div className="glass p-4 md:p-5">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">Extraversion</p>
                <RangePill value={profile.resilience.e} onChange={(value) => setProfile((prev) => ({ ...prev, resilience: { ...prev.resilience, e: value } }))} />
              </div>
              <div className="glass p-4 md:p-5">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">Openness</p>
                <RangePill value={profile.resilience.o} onChange={(value) => setProfile((prev) => ({ ...prev, resilience: { ...prev.resilience, o: value } }))} />
              </div>
              <div className="glass p-4 md:p-5">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">Agreeableness</p>
                <RangePill value={profile.resilience.a} onChange={(value) => setProfile((prev) => ({ ...prev, resilience: { ...prev.resilience, a: value } }))} />
              </div>
              <div className="glass p-4 md:p-5">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">Conscientiousness</p>
                <RangePill value={profile.resilience.c} onChange={(value) => setProfile((prev) => ({ ...prev, resilience: { ...prev.resilience, c: value } }))} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-6">
      <div className="glass p-5 md:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-primary">Professional Profile</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Build Your Workforce Profile</h1>
            <p className="mt-3 max-w-2xl text-base font-light text-muted-foreground md:text-lg">
              Create your professional profile to unlock personalized workforce intelligence.
            </p>
          </div>
          <div className="glass flex items-center gap-3 rounded-full px-3 py-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <Briefcase className="size-3.5 text-primary" /> {currentStep.short}
          </div>
        </div>

        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {STEP_META.map((step, index) => {
              const active = index === stepIndex;
              const done = index < stepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={`glass glass-hover flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] ${
                    active ? "border-primary/40 bg-primary/10 text-foreground" : done ? "border-primary/20 bg-primary/5 text-foreground/90" : "text-muted-foreground"
                  }`}
                >
                  <span className={`flex size-5 items-center justify-center rounded-full border ${done ? "border-primary/40 bg-primary/15 text-primary" : active ? "border-primary/40 bg-primary/10 text-primary" : "border-glass-border bg-muted text-muted-foreground"}`}>
                    {done ? <Check className="size-3" /> : index + 1}
                  </span>
                  {step.short}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-full border border-glass-border bg-muted/60 p-1">
          <div className="h-1.5 rounded-full bg-primary/80 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-5 rounded-[30px] border border-glass-border/80 bg-background/10 p-4 md:p-6">
          {stepContent}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" className="btn-glass !rounded-full !px-5" onClick={prev} disabled={stepIndex === 0}>
            <ArrowLeft className="size-4" /> Back
          </button>

          <button type="button" className="btn-primary !rounded-full !px-6" onClick={next}>
            Continue
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
