import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RiskPredictor } from "@/components/RiskPredictor";
import { CityRadar } from "@/components/CityRadar";
import { TransitionPlanner, type SavedPlan } from "@/components/TransitionPlanner";
import { IntegrityRegistry } from "@/components/IntegrityRegistry";
import { HRDashboard } from "@/components/HRDashboard";
import { SystemAudit } from "@/components/SystemAudit";
import { ModelIntelligence } from "@/components/ModelIntelligence";
import { WorkforceVisualizations } from "@/components/WorkforceVisualizations";
import { DataExplorer } from "@/components/DataExplorer";
import { TrainWithDataset } from "@/components/TrainWithDataset";
import { ProfileBuilder } from "@/components/ProfileBuilder";
import { ColorCustomizer } from "@/components/ColorCustomizer";
import { DemoBanner } from "@/components/StatusBadge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DemoModeProvider } from "@/context/DemoModeContext";
import { useMlBackend } from "@/context/MlBackendContext";
import {
  BarChart3,
  Brain,
  BriefcaseBusiness,
  ClipboardList,
  Cpu,
  Database,
  FlaskConical,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillVector — Predictive Workforce Intelligence" },
      {
        name: "description",
        content:
          "SkillVector maps the geographic shelf-life of tech skills across India's Tier-1 and Tier-2 hubs, forecasts AI automation risk, and generates 6–12 month upskilling roadmaps.",
      },
      { property: "og:title", content: "SkillVector — Predictive Workforce Intelligence" },
      {
        property: "og:description",
        content:
          "Forecast skill half-life, regional demand shifts, and AI automation exposure across India's tech hubs — with explainable risk scores and upskilling roadmaps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PRODUCT_TABS = [
  { id: "risk", label: "Skill → City Risk", icon: Brain },
  { id: "city", label: "City Intelligence", icon: MapPin },
  { id: "planner", label: "Transition Planner", icon: RouteIcon },
  { id: "profile", label: "Professional Profile", icon: BriefcaseBusiness },
  { id: "registry", label: "Integrity & Profile", icon: ShieldCheck },
] as const;

const INTEL_TABS = [
  { id: "audit", label: "System Audit", icon: ClipboardList },
  { id: "models", label: "Model Intelligence", icon: Cpu },
  { id: "viz", label: "Workforce Visualizations", icon: BarChart3 },
  { id: "data", label: "Data Explorer", icon: Database },
  { id: "train", label: "Train With Your Dataset", icon: FlaskConical },
] as const;

const TABS = [...PRODUCT_TABS, ...INTEL_TABS] as const;
type TabId = (typeof TABS)[number]["id"];
const PRODUCT_IDS = new Set<string>(PRODUCT_TABS.map((t) => t.id));

function Index() {
  const [workspace, setWorkspace] = useState<"career" | "hr">("career");
  const [tab, setTab] = useState<TabId>("risk");
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const { online, hasTrainedModel, baseUrl } = useMlBackend();

  return (
    <ProtectedRoute>
      <DemoModeProvider value={demoMode}>
        <div className="app-shell min-h-screen">
          <div className="ambient-bg" aria-hidden="true">
            <div className="ambient-blob ambient-blob-a" />
            <div className="ambient-blob ambient-blob-b" />
            <div className="ambient-blob ambient-blob-c" />
          </div>

          <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-6 p-4 md:p-8 lg:flex-row lg:items-start lg:gap-10 lg:p-10">
            <aside className="glass flex shrink-0 flex-col gap-5 p-4 lg:sticky lg:top-10 lg:max-h-[calc(100vh-5rem)] lg:w-[288px] lg:self-start lg:overflow-y-auto lg:p-5">
              <div className="flex items-center gap-3 px-1">
                <div className="icon-orb size-10">
                  <Sparkles className="size-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight">SkillVector</p>
                  <p className="text-[11px] font-light text-muted-foreground">Workforce Intelligence</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2" aria-label="Dashboard workspace">
                <button
                  onClick={() => setWorkspace("career")}
                  aria-pressed={workspace === "career"}
                  className={`nav-pill flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm ${workspace === "career" ? "nav-pill-active" : ""}`}
                >
                  <BriefcaseBusiness className="size-4" strokeWidth={1.5} /> Career
                </button>
                <button
                  onClick={() => setWorkspace("hr")}
                  aria-pressed={workspace === "hr"}
                  className={`nav-pill flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm ${workspace === "hr" ? "nav-pill-active" : ""}`}
                >
                  <UsersRound className="size-4" strokeWidth={1.5} /> HR Dashboard
                </button>
              </div>

              {workspace === "career" ? (
                <>
                  <div>
                    <p className="eyebrow mb-2 px-1">Product</p>
                    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1">
                      {PRODUCT_TABS.map(({ id, label, icon: Icon }) => {
                        const active = tab === id;
                        return (
                          <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`nav-pill flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm ${active ? "nav-pill-active" : ""}`}
                          >
                            <Icon className={`size-4 shrink-0 ${active ? "text-primary" : ""}`} strokeWidth={1.5} />
                            {label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  <div>
                    <p className="eyebrow mb-2 px-1">Intelligence</p>
                    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1">
                      {INTEL_TABS.map(({ id, label, icon: Icon }) => {
                        const active = tab === id;
                        return (
                          <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`nav-pill flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-left text-sm ${active ? "nav-pill-active" : ""}`}
                          >
                            <Icon className={`size-4 shrink-0 ${active ? "text-primary" : ""}`} strokeWidth={1.5} />
                            <span className="leading-snug">{label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </>
              ) : (
                <div className="glass hidden p-4 lg:block">
                  <p className="eyebrow">HR workspace</p>
                  <p className="mt-1 text-xs font-light text-muted-foreground">
                    Candidate review and workforce planning from uploaded dataset snapshots.
                  </p>
                </div>
              )}

              <div className="glass space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="eyebrow">Demo Mode</p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={demoMode}
                    onClick={() => setDemoMode((v) => !v)}
                    className={`relative h-6 w-11 rounded-full border transition ${demoMode ? "border-primary/40 bg-primary/30" : "border-white/15 bg-white/10"}`}
                  >
                    <span
                      className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition ${demoMode ? "left-6" : "left-0.5"}`}
                    />
                  </button>
                </div>
                <p className="text-[11px] font-light leading-relaxed text-muted-foreground">
                  {demoMode
                    ? "Demo Mode ON — product forecasts use mockEngine.ts only."
                    : hasTrainedModel
                      ? "Live mode — Risk Predictor uses FastAPI trained models + SHAP."
                      : "Live mode — train a model first, or enable Demo Mode."}
                </p>
              </div>

              <div className="glass hidden p-4 lg:block">
                <p className="eyebrow">Engine</p>
                <p className="mt-1 text-xs font-light text-muted-foreground">
                  {online
                    ? hasTrainedModel
                      ? "ML backend online · trained model active."
                      : "ML backend online · models READY (not trained yet)."
                    : `ML backend offline · ${baseUrl}`}
                </p>
                <p className="mt-3 text-[11px] font-light text-muted-foreground/70">Build for Bharat 2.0</p>
              </div>
            </aside>

            <main key={`${workspace}-${tab}`} className="min-w-0 flex-1 pb-12 fade-up">
              {workspace === "hr" ? (
                <HRDashboard />
              ) : (
                <>
                  {demoMode && PRODUCT_IDS.has(tab) && <DemoBanner show />}
                  {tab === "risk" && <RiskPredictor />}
                  {tab === "city" && <CityRadar />}
                  {tab === "planner" && (
                    <TransitionPlanner onSave={(p) => setSavedPlans((prev) => [p, ...prev])} />
                  )}
                  {tab === "profile" && <ProfileBuilder />}
                  {tab === "registry" && <IntegrityRegistry savedPlans={savedPlans} />}
                  {tab === "audit" && <SystemAudit />}
                  {tab === "models" && <ModelIntelligence />}
                  {tab === "viz" && <WorkforceVisualizations />}
                  {tab === "data" && <DataExplorer />}
                  {tab === "train" && <TrainWithDataset />}
                </>
              )}
            </main>
          </div>
        </div>
      </DemoModeProvider>
    </ProtectedRoute>
  );
}
