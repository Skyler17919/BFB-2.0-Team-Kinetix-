/**
 * SkillVector mock engine.
 *
 * ALL data-science logic lives behind these functions. The UI never computes
 * anything itself — swap these mocks for real XGBoost / ChromaDB / Parquet
 * backed calls without touching any component.
 */

export interface SkillRiskPrediction {
  skill: string;
  city: string;
  experienceYears: number;
  exposureScore: number; // 0-100
  exposureBand: "Low" | "Medium" | "High";
  halfLifeMonths: number;
  halfLifeCi: [number, number];
  tier1DecayVelocity: number; // % demand decline per year
  tier2GrowthRate: number; // % demand growth per year
  regionalDemand: { region: string; tier1: number; tier2: number }[];
  shapFactors: { factor: string; weight: number }[]; // signed attribution
}

export interface CityRadar {
  city: string;
  tier: "Tier-1" | "Tier-2";
  activeTechIndex: number; // 0-100
  gccGrowthRate: number; // % YoY
  surgingSkills: { skill: string; momentum: number }[];
  decayingSkills: { skill: string; decay: number }[];
  geoClusters: { city: string; lat: number; lon: number; demand: number; tier: string }[];
}

export interface RoadmapPhase {
  phase: string;
  months: string;
  focus: string;
  actions: string[];
}

export interface TransitionRoadmap {
  currentSkill: string;
  targetRole: string;
  bridgeSkills: { from: string; via: string; to: string }[];
  phases: RoadmapPhase[];
}

export interface IntegrityScore {
  githubUrl: string;
  claimedStack: string[];
  authenticityScore: number; // 0-100
  contributionScore: number; // 0-100
  signals: { label: string; value: string; positive: boolean }[];
}

// ---------- deterministic pseudo-random helper ----------
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seeded(skill: string, salt: string, min: number, max: number): number {
  const h = hashCode(skill + salt);
  return min + ((h % 1000) / 1000) * (max - min);
}

const HIGH_RISK = [
  "Manual QA",
  "Data Entry",
  "Basic WordPress",
  "L1 Support",
  "Mainframe COBOL",
  "Legacy COBOL",
];
const LOW_RISK = ["Prompt Engineering", "MLOps", "Kubernetes", "Rust Systems", "AI Safety"];

function baseExposure(skill: string): number {
  if (HIGH_RISK.some((s) => skill.toLowerCase().includes(s.toLowerCase())))
    return seeded(skill, "hi", 72, 92);
  if (LOW_RISK.some((s) => skill.toLowerCase().includes(s.toLowerCase())))
    return seeded(skill, "lo", 12, 32);
  return seeded(skill, "mid", 38, 68);
}

const TIER1_CITIES = ["Bengaluru", "Pune", "Hyderabad"];
const REGIONS = [
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chandigarh",
  "Jaipur",
  "Indore",
  "Ahmedabad",
  "Coimbatore",
];

export function predictSkillRisk(
  skill: string,
  city: string,
  experienceYears: number,
): SkillRiskPrediction {
  let exposure = baseExposure(skill);
  // Tier-1 hubs decay faster; experience cushions exposure slightly
  if (TIER1_CITIES.includes(city)) exposure += 8;
  exposure -= experienceYears * 1.4;
  exposure = Math.max(4, Math.min(97, Math.round(exposure)));

  const halfLife = Math.max(4, Math.round((100 - exposure) * 0.32 * 10) / 10);
  const spread = halfLife * 0.18;

  const tier1Decay = Math.round(seeded(skill, "t1", 8, 28) + exposure * 0.15);
  const tier2Growth = Math.round(seeded(skill, "t2", 2, 18) + (100 - exposure) * 0.06);

  const regionalDemand = REGIONS.map((region) => {
    const t1 = TIER1_CITIES.includes(region);
    return {
      region,
      tier1: t1 ? Math.round(seeded(skill, region, 40, 95)) : 0,
      tier2: t1 ? 0 : Math.round(seeded(skill, region, 35, 90)),
    };
  });

  const shapFactors = [
    { factor: "LLM Code Generation Weight", weight: seeded(skill, "s1", 0.12, 0.34) },
    { factor: "GCC Cost Arbitrage", weight: -seeded(skill, "s2", 0.08, 0.22) },
    { factor: "Entry-Level Wage Contraction", weight: seeded(skill, "s3", 0.06, 0.2) },
    { factor: "Tier-2 GCC Absorption", weight: -seeded(skill, "s4", 0.05, 0.18) },
    { factor: "Domain Specialisation Premium", weight: -seeded(skill, "s5", 0.03, 0.12) },
  ]
    .map((f) => ({ ...f, weight: Math.round(f.weight * 100) / 100 }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  return {
    skill,
    city,
    experienceYears,
    exposureScore: exposure,
    exposureBand: exposure >= 66 ? "High" : exposure >= 36 ? "Medium" : "Low",
    halfLifeMonths: halfLife,
    halfLifeCi: [
      Math.round((halfLife - spread) * 10) / 10,
      Math.round((halfLife + spread) * 10) / 10,
    ],
    tier1DecayVelocity: tier1Decay,
    tier2GrowthRate: tier2Growth,
    regionalDemand,
    shapFactors,
  };
}

const CITY_PROFILES: Record<string, { tier: "Tier-1" | "Tier-2"; lat: number; lon: number }> = {
  Bengaluru: { tier: "Tier-1", lat: 12.97, lon: 77.59 },
  Pune: { tier: "Tier-1", lat: 18.52, lon: 73.86 },
  Hyderabad: { tier: "Tier-1", lat: 17.38, lon: 78.49 },
  Chandigarh: { tier: "Tier-2", lat: 30.73, lon: 76.78 },
  Jaipur: { tier: "Tier-2", lat: 26.91, lon: 75.79 },
  Indore: { tier: "Tier-2", lat: 22.72, lon: 75.86 },
  Ahmedabad: { tier: "Tier-2", lat: 23.02, lon: 72.57 },
  Coimbatore: { tier: "Tier-2", lat: 11.02, lon: 76.96 },
};

const SURGE_POOL = [
  "Prompt Engineering",
  "MLOps",
  "Data Engineering",
  "Cloud Security",
  "GenAI Integration",
  "Platform Engineering",
  "FinOps",
  "Rust Systems",
];
const DECAY_POOL = [
  "Manual QA",
  "L1 Support",
  "Basic WordPress",
  "Data Entry",
  "Legacy .NET Maintenance",
  "Flash/Flex",
  "Manual Reporting",
  "Basic SEO",
];

export function getCityRadar(city: string): CityRadar {
  const profile = CITY_PROFILES[city] ?? { tier: "Tier-2" as const, lat: 22, lon: 78 };
  const pick = (pool: string[], salt: string, n: number) => {
    const start = hashCode(city + salt) % pool.length;
    return Array.from({ length: n }, (_, i) => pool[(start + i) % pool.length]!);
  };

  return {
    city,
    tier: profile.tier,
    activeTechIndex: Math.round(
      seeded(city, "ati", profile.tier === "Tier-1" ? 70 : 45, profile.tier === "Tier-1" ? 95 : 72),
    ),
    gccGrowthRate:
      Math.round(
        seeded(
          city,
          "gcc",
          profile.tier === "Tier-1" ? 6 : 12,
          profile.tier === "Tier-1" ? 14 : 26,
        ) * 10,
      ) / 10,
    surgingSkills: pick(SURGE_POOL, "surge", 5).map((skill, i) => ({
      skill,
      momentum: Math.round(seeded(city + skill, "mom", 55, 96) - i * 4),
    })),
    decayingSkills: pick(DECAY_POOL, "decay", 5).map((skill, i) => ({
      skill,
      decay: Math.round(seeded(city + skill, "dec", 60, 95) - i * 5),
    })),
    geoClusters: Object.entries(CITY_PROFILES).map(([name, p]) => ({
      city: name,
      lat: p.lat,
      lon: p.lon,
      demand: Math.round(
        seeded(name, "dem", p.tier === "Tier-1" ? 55 : 30, p.tier === "Tier-1" ? 100 : 80),
      ),
      tier: p.tier,
    })),
  };
}

const BRIDGES: Record<string, { via: string; to: string }> = {
  "Manual QA": { via: "Playwright / Cypress", to: "SDET" },
  "Data Entry": { via: "SQL + Power BI", to: "Data Analyst" },
  "L1 Support": { via: "Cloud Fundamentals (AZ-900)", to: "Cloud Support Engineer" },
  "Basic WordPress": { via: "React + Headless CMS", to: "Frontend Developer" },
};

export function generateTransitionRoadmap(
  currentSkill: string,
  targetRole: string,
): TransitionRoadmap {
  const bridge = BRIDGES[currentSkill] ?? {
    via: "Applied GenAI Tooling",
    to: targetRole || "AI-Augmented Specialist",
  };

  return {
    currentSkill,
    targetRole: targetRole || bridge.to,
    bridgeSkills: [{ from: currentSkill, via: bridge.via, to: targetRole || bridge.to }],
    phases: [
      {
        phase: "Phase 1 — Foundation",
        months: "Months 0–3",
        focus: `Core literacy in ${bridge.via}`,
        actions: [
          `Complete a structured ${bridge.via} course (40+ hrs)`,
          "Build 2 portfolio projects mirroring real production tasks",
          "Earn one recognised entry certification",
        ],
      },
      {
        phase: "Phase 2 — Applied Practice",
        months: "Months 3–6",
        focus: `Production-grade ${bridge.via} workflows`,
        actions: [
          "Contribute to an open-source or internal automation project",
          `Shadow a ${targetRole || bridge.to} team for 2 sprints`,
          "Publish 3 technical write-ups to build public proof of work",
        ],
      },
      {
        phase: "Phase 3 — Transition",
        months: "Months 6–12",
        focus: `Positioning as a ${targetRole || bridge.to}`,
        actions: [
          "Rewrite resume around measurable automation outcomes",
          "Apply to Tier-2 GCC hubs where demand is still surging",
          "Clear 3 mock interviews; target internal mobility first",
        ],
      },
    ],
  };
}

/** Extract a GitHub username from a profile URL. Returns null if the URL has no user. */
export function parseGithubHandle(githubUrl: string): string | null {
  const trimmed = githubUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "github.com") return null;
    const handle = parsed.pathname.split("/").filter(Boolean)[0];
    if (!handle || handle === "orgs" || handle === "settings") return null;
    return handle;
  } catch {
    return null;
  }
}

export function verifySkillIntegrity(githubUrl: string, claimedStack: string[]): IntegrityScore {
  const handle = parseGithubHandle(githubUrl) ?? "candidate";
  const authenticity = Math.round(seeded(handle, "auth", 42, 96));
  const contribution = Math.round(seeded(handle, "contrib", 30, 94));
  const stack = claimedStack.filter(Boolean);
  const verifiedCount = stack.length
    ? Math.min(stack.length, Math.max(1, Math.round(seeded(handle, "stk", 1, stack.length))))
    : 0;

  return {
    githubUrl,
    claimedStack: stack,
    authenticityScore: authenticity,
    contributionScore: contribution,
    signals: [
      {
        label: "Commit cadence consistency",
        value: authenticity > 65 ? "Organic pattern" : "Bursty / suspicious",
        positive: authenticity > 65,
      },
      {
        label: "Original vs forked repos",
        value: `${Math.round(seeded(handle, "fork", 20, 80))}% original`,
        positive: true,
      },
      {
        label: "Claimed stack detected in code",
        value: `${verifiedCount}/${stack.length} verified`,
        positive: stack.length > 0 && verifiedCount >= Math.ceil(stack.length / 2),
      },
      {
        label: "Collaboration signals (PRs, reviews)",
        value: contribution > 60 ? "Strong" : "Thin",
        positive: contribution > 60,
      },
    ],
  };
}

export const SKILLS = [
  "Manual QA",
  "Java Spring Boot",
  "Prompt Engineering",
  "Data Analytics",
  "Data Entry",
  "L1 Support",
  "Basic WordPress",
  "MLOps",
  "React Development",
  "Mainframe COBOL",
];

export const CITIES = Object.keys(CITY_PROFILES);
export const TARGET_ROLES = [
  "SDET",
  "Data Analyst",
  "Cloud Support Engineer",
  "Frontend Developer",
  "AI Product Analyst",
  "DevOps Engineer",
];
