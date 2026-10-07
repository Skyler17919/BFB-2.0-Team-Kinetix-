/**
 * Honest system inventory for SkillVector / Build for Bharat 2.0.
 * Derived from a full repository audit — do not invent capabilities here.
 */

export type ImplStatus = "live" | "mock" | "planned" | "missing" | "ready" | "trained";

export interface AuditItem {
  feature: string;
  status: ImplStatus;
  location: string;
  dataSource: string;
  notes: string;
}

export const STATUS_META: Record<
  ImplStatus,
  { label: string; short: string; emoji: string; className: string }
> = {
  live: {
    label: "Implemented",
    short: "LIVE",
    emoji: "🟢",
    className: "border-emerald-400/35 bg-emerald-400/12 text-emerald-200",
  },
  ready: {
    label: "Ready",
    short: "READY",
    emoji: "🟢",
    className: "border-emerald-400/35 bg-emerald-400/12 text-emerald-200",
  },
  trained: {
    label: "Trained",
    short: "TRAINED",
    emoji: "🟢",
    className: "border-emerald-400/40 bg-emerald-400/18 text-emerald-100",
  },
  mock: {
    label: "Demo / Mock",
    short: "MOCK / DEMO",
    emoji: "🟡",
    className: "border-amber-400/35 bg-amber-400/12 text-amber-100",
  },
  planned: {
    label: "Planned",
    short: "PLANNED",
    emoji: "🔵",
    className: "border-sky-400/35 bg-sky-400/12 text-sky-100",
  },
  missing: {
    label: "Not Implemented",
    short: "NOT IMPLEMENTED",
    emoji: "🔴",
    className: "border-rose-400/35 bg-rose-400/12 text-rose-100",
  },
};

export const CORE_VIEWS: AuditItem[] = [
  {
    feature: "Skill-to-City Risk Predictor",
    status: "ready",
    location: "RiskPredictor → POST /api/predict/skill-risk (Demo Mode → mockEngine)",
    dataSource: "Trained joblib pipeline when Demo Mode is OFF; mockEngine in Demo Mode",
    notes: "LIVE after train. Requires uploaded dataset + model.fit() before TRAINED predictions.",
  },
  {
    feature: "City-to-Skill Relevance Radar",
    status: "mock",
    location: "src/components/CityRadar.tsx → mockEngine.getCityRadar",
    dataSource: "CITY_PROFILES + SURGE_POOL / DECAY_POOL constants",
    notes: "SVG India map + charts wired to mock city profiles.",
  },
  {
    feature: "6–12 Month Transition Planner",
    status: "mock",
    location: "src/components/TransitionPlanner.tsx → generateTransitionRoadmap",
    dataSource: "BRIDGES lookup + fixed 3-phase templates",
    notes: "Roadmap UI complete; content is templated, not ML-ranked.",
  },
  {
    feature: "Integrity Registry & Cloud Profile",
    status: "mock",
    location: "src/components/IntegrityRegistry.tsx",
    dataSource: "In-memory React state; seeded integrity scores",
    notes: "Sign-in and cloud save are UI-only — no backend auth or persistence.",
  },
];

export const FEATURE_AUDIT: AuditItem[] = [
  {
    feature: "Skill input / autocomplete",
    status: "live",
    location: "RiskPredictor, TransitionPlanner (datalist / select)",
    dataSource: "SKILLS catalog in mockEngine.ts",
    notes: "UI implemented against a fixed 10-skill list.",
  },
  {
    feature: "Experience slider",
    status: "live",
    location: "RiskPredictor.tsx",
    dataSource: "User input → passed to predictSkillRisk",
    notes: "Cushions mock exposure by years × 1.4.",
  },
  {
    feature: "City selector",
    status: "live",
    location: "RiskPredictor, CityRadar",
    dataSource: "CITIES / CITY_PROFILES (8 hubs)",
    notes: "Limited to hardcoded Indian tech hubs.",
  },
  {
    feature: "AI automation exposure",
    status: "mock",
    location: "mockEngine.predictSkillRisk → exposureScore",
    dataSource: "HIGH_RISK / LOW_RISK lists + seeded ranges",
    notes: "Simulated prediction — not a trained classifier.",
  },
  {
    feature: "Skill half-life",
    status: "mock",
    location: "mockEngine.predictSkillRisk → halfLifeMonths",
    dataSource: "Formula: max(4, (100 − exposure) × 0.32)",
    notes: "Deterministic mock formula; CI is ±18% spread, not statistical.",
  },
  {
    feature: "Tier-1 decay",
    status: "mock",
    location: "tier1DecayVelocity",
    dataSource: "seeded(skill) + exposure × 0.15",
    notes: "Simulated % demand decline per year.",
  },
  {
    feature: "Tier-2 growth",
    status: "mock",
    location: "tier2GrowthRate",
    dataSource: "seeded(skill) + (100 − exposure) × 0.06",
    notes: "Simulated % demand growth per year.",
  },
  {
    feature: "Regional variance visualization",
    status: "mock",
    location: "RiskPredictor Recharts BarChart",
    dataSource: "regionalDemand from mockEngine",
    notes: "Interactive chart; values are seeded mocks.",
  },
  {
    feature: "Explainable AI / SHAP visualization",
    status: "mock",
    location: "RiskPredictor shapFactors bars",
    dataSource: "Five fixed factor names with seeded weights",
    notes: "Labeled TreeSHAP in UI but is NOT real SHAP — simulated attribution.",
  },
  {
    feature: "City profiles",
    status: "mock",
    location: "getCityRadar / CITY_PROFILES",
    dataSource: "Inline lat/lon + tier metadata",
    notes: "8 cities with seeded ATI and GCC growth.",
  },
  {
    feature: "Skill recommendations",
    status: "mock",
    location: "CityRadar surgingSkills / decayingSkills",
    dataSource: "Rotated SURGE_POOL / DECAY_POOL",
    notes: "Not a ranking model — pool rotation by city hash.",
  },
  {
    feature: "India demand map",
    status: "mock",
    location: "CityRadar.tsx SVG map",
    dataSource: "geoClusters with seeded demand",
    notes: "Custom SVG (no Leaflet/Mapbox); markers sized by mock demand.",
  },
  {
    feature: "Transition roadmap",
    status: "mock",
    location: "generateTransitionRoadmap",
    dataSource: "BRIDGES map + phase templates",
    notes: "Always returns three phases with string interpolation.",
  },
  {
    feature: "Bridge skills",
    status: "mock",
    location: "BRIDGES constant",
    dataSource: "4 hardcoded skill→via→role mappings",
    notes: "Fallback: Applied GenAI Tooling.",
  },
  {
    feature: "Supabase authentication",
    status: "missing",
    location: "—",
    dataSource: "No @supabase client, env, or schema in repo",
    notes: "IntegrityRegistry sign-in is useState only.",
  },
  {
    feature: "Saved roadmaps",
    status: "mock",
    location: "index.tsx savedPlans state → IntegrityRegistry",
    dataSource: "In-memory React state",
    notes: "Lost on refresh — no localStorage/cloud persistence for plans.",
  },
  {
    feature: "GitHub skill verifier",
    status: "mock",
    location: "parseGithubHandle + verifySkillIntegrity",
    dataSource: "URL parse (real) + seeded scores (mock)",
    notes: "No GitHub API calls. Handle parsing is real; scores are simulated.",
  },
  {
    feature: "Cloud profile",
    status: "mock",
    location: "IntegrityRegistry user state",
    dataSource: "Email string in React state",
    notes: "UI presents cloud profile; no cloud backend.",
  },
  {
    feature: "Session state",
    status: "live",
    location: "React useState in route shell",
    dataSource: "Client memory",
    notes: "Tab + savedPlans for session; appearance prefs use localStorage.",
  },
  {
    feature: "Mock engine",
    status: "live",
    location: "src/services/mockEngine.ts",
    dataSource: "Deterministic hash-seeded heuristics",
    notes: "Sole prediction/integrity/roadmap service. Covered by vitest.",
  },
  {
    feature: "Data services",
    status: "missing",
    location: "—",
    dataSource: "No Parquet/CSV loaders or API clients",
    notes: "Only mockEngine.ts under services/.",
  },
  {
    feature: "Model integration",
    status: "planned",
    location: "mockEngine.ts header comment",
    dataSource: "Comment: swap for XGBoost / ChromaDB / Parquet",
    notes: "Extension seam documented; no model runtime wired.",
  },
  {
    feature: "Dataset handling",
    status: "missing",
    location: "—",
    dataSource: "No data/ folder, no .csv/.parquet files",
    notes: "Catalogs are TypeScript constants.",
  },
  {
    feature: "Appearance / theme customizer",
    status: "live",
    location: "ColorCustomizer + AppearanceContext + appearance.ts",
    dataSource: "localStorage key skillvector-appearance",
    notes: "Universal accent theming with Liquid Glass controls.",
  },
];

export const ARCHITECTURE_NODES = {
  frontend: [
    { name: "TanStack Start + React 19", status: "live" as ImplStatus },
    { name: "Liquid Glass Dashboard UI", status: "live" as ImplStatus },
    { name: "4 product views + intelligence pages", status: "live" as ImplStatus },
    { name: "Recharts visualizations", status: "live" as ImplStatus },
    { name: "Appearance / accent system", status: "live" as ImplStatus },
  ],
  services: [
    { name: "mockEngine.ts (Demo Mode fallback)", status: "mock" as ImplStatus },
    { name: "FastAPI ML backend (ml-backend/)", status: "ready" as ImplStatus },
    { name: "XGBoost / RF / GBM / LinearRegression", status: "ready" as ImplStatus },
    { name: "SHAP TreeExplainer", status: "ready" as ImplStatus },
    { name: "Supabase", status: "missing" as ImplStatus },
  ],
  data: [
    { name: "Inline skill / city catalogs", status: "live" as ImplStatus },
    { name: "Uploaded CSV/XLSX/Parquet training", status: "ready" as ImplStatus },
    { name: "joblib artifacts registry", status: "ready" as ImplStatus },
    { name: "External job-market feeds", status: "planned" as ImplStatus },
  ],
};

export interface ModelRegistryEntry {
  id: string;
  name: string;
  purpose: string;
  type: string;
  status: ImplStatus;
  dataset: string;
  version: string;
  trainingStatus: string;
  explainability: string;
  inputs: string[];
  outputs: string[];
  location: string;
}

export const MODEL_REGISTRY: ModelRegistryEntry[] = [
  {
    id: "skill-risk",
    name: "Skill Risk Predictor",
    purpose: "AI automation exposure, half-life, tier demand velocities",
    type: "Heuristic scoring (not ML)",
    status: "mock",
    dataset: "Not connected — HIGH_RISK / LOW_RISK lists",
    version: "Prototype mock v0",
    trainingStatus: "Mock — no training artifacts in repo",
    explainability: "Simulated factor weights (not SHAP)",
    inputs: ["skill (string)", "city (string)", "experienceYears (number)"],
    outputs: [
      "exposureScore",
      "exposureBand",
      "halfLifeMonths",
      "halfLifeCi",
      "tier1DecayVelocity",
      "tier2GrowthRate",
      "regionalDemand[]",
      "shapFactors[]",
    ],
    location: "src/services/mockEngine.ts → predictSkillRisk",
  },
  {
    id: "city-radar",
    name: "City Demand Radar",
    purpose: "City ATI, GCC growth, surging/decaying skills, geo demand",
    type: "Catalog + seeded heuristics",
    status: "mock",
    dataset: "CITY_PROFILES (8 cities) + skill pools",
    version: "Prototype mock v0",
    trainingStatus: "Mock",
    explainability: "Not applicable / not implemented",
    inputs: ["city (string)"],
    outputs: ["tier", "activeTechIndex", "gccGrowthRate", "surgingSkills", "decayingSkills", "geoClusters"],
    location: "src/services/mockEngine.ts → getCityRadar",
  },
  {
    id: "transition",
    name: "Transition Roadmap Generator",
    purpose: "Bridge skills + 6–12 month phase plan",
    type: "Rule / template generator",
    status: "mock",
    dataset: "BRIDGES map (4 skills) + phase templates",
    version: "Prototype mock v0",
    trainingStatus: "Mock — not a ranking/NLP model",
    explainability: "Not implemented",
    inputs: ["currentSkill", "targetRole"],
    outputs: ["bridgeSkills", "phases[3]"],
    location: "src/services/mockEngine.ts → generateTransitionRoadmap",
  },
  {
    id: "integrity",
    name: "GitHub Integrity Scorer",
    purpose: "Authenticity & contribution signals vs claimed stack",
    type: "URL parse + seeded scoring",
    status: "mock",
    dataset: "None — no GitHub API",
    version: "Prototype mock v0",
    trainingStatus: "Mock",
    explainability: "Synthetic signal labels",
    inputs: ["githubUrl", "claimedStack[]"],
    outputs: ["authenticityScore", "contributionScore", "signals[]"],
    location: "parseGithubHandle (real) + verifySkillIntegrity (mock)",
  },
];

export const PLANNED_FEATURES = [
  "AI automation exposure (from job/LLM corpora)",
  "Skill demand",
  "Geographic demand",
  "GCC growth",
  "Wage trends",
  "Experience level",
  "Skill substitutability",
  "LLM exposure",
  "Job posting frequency",
];

export const ACTUAL_MOCK_FEATURES = [
  "skill string → HIGH_RISK / LOW_RISK membership",
  "city ∈ Tier-1 hub list (+8 exposure)",
  "experienceYears × 1.4 cushion",
  "hash-seeded regional demand",
  "hash-seeded attribution factor weights",
];

export const PIPELINE_STEPS: { id: string; title: string; status: ImplStatus; detail: string }[] = [
  {
    id: "dataset",
    title: "01 — Dataset",
    status: "missing",
    detail: "No Parquet/CSV datasets in repository. Catalogs are TypeScript constants.",
  },
  {
    id: "preprocess",
    title: "02 — Preprocessing",
    status: "missing",
    detail: "No missing-value handling, encoding, or normalization pipeline.",
  },
  {
    id: "features",
    title: "03 — Feature Engineering",
    status: "mock",
    detail: "Heuristic feature-like adjustments inside predictSkillRisk only.",
  },
  {
    id: "train",
    title: "04 — Training",
    status: "missing",
    detail: "No train/val split, hyperparameters, or training jobs.",
  },
  {
    id: "eval",
    title: "05 — Evaluation",
    status: "missing",
    detail: "No Accuracy / F1 / AUC / MAE / RMSE / R² artifacts. Do not fabricate scores.",
  },
  {
    id: "explain",
    title: "06 — Explainability",
    status: "mock",
    detail: "SHAP — Not Implemented. UI shows simulated shapFactors.",
  },
  {
    id: "store",
    title: "07 — Model Storage",
    status: "missing",
    detail: "No model registry files or versioned artifacts.",
  },
  {
    id: "predict",
    title: "08 — Prediction",
    status: "mock",
    detail: "Client-side mockEngine functions power all product views.",
  },
];

export const STACK_SUMMARY = {
  framework: "TanStack Start (Vite 8) + React 19 + Tailwind v4",
  backend: "None — SSR shell only (src/server.ts), no domain APIs",
  models: "None trained — mock heuristics only",
  datasets: "None on disk",
  supabase: "Not present",
  viz: "recharts + custom SVG map",
  persistence: "Appearance localStorage only; roadmaps in-memory",
};
