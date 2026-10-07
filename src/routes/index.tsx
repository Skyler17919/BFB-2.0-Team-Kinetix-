import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RiskPredictor } from "@/components/RiskPredictor";
import { CityRadar } from "@/components/CityRadar";
import { TransitionPlanner, type SavedPlan } from "@/components/TransitionPlanner";
import { IntegrityRegistry } from "@/components/IntegrityRegistry";
import { Brain, MapPin, Route as RouteIcon, ShieldCheck, Sparkles } from "lucide-react";

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

const TABS = [
  { id: "risk", label: "Skill → City Risk", icon: Brain },
  { id: "city", label: "City Intelligence", icon: MapPin },
  { id: "planner", label: "Transition Planner", icon: RouteIcon },
  { id: "registry", label: "Integrity & Profile", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Index() {
  const [tab, setTab] = useState<TabId>("risk");
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);

  return (
    <div className="app-shell min-h-screen">
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob ambient-blob-a" />
        <div className="ambient-blob ambient-blob-b" />
        <div className="ambient-blob ambient-blob-c" />
      </div>
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-6 p-4 md:p-8 lg:flex-row lg:items-start lg:gap-10 lg:p-10">
        <aside className="glass flex shrink-0 flex-col gap-6 p-4 lg:sticky lg:top-10 lg:w-[272px] lg:self-start lg:p-5">
          <div className="flex items-center gap-3 px-1">
            <div className="icon-orb size-10">
              <Sparkles className="size-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">SkillVector</p>
              <p className="text-[11px] font-light text-muted-foreground">Workforce Intelligence</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1.5">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`nav-pill flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm ${
                    active ? "nav-pill-active" : ""
                  }`}
                >
                  <Icon className={`size-4 ${active ? "text-primary" : ""}`} strokeWidth={1.5} />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="glass hidden p-4 lg:block">
            <p className="eyebrow">Engine</p>
            <p className="mt-1 text-xs font-light text-muted-foreground">
              Mock models active — real forecasts plug in without UI changes.
            </p>
            <p className="mt-3 text-[11px] font-light text-muted-foreground/70">
              Build for Bharat 2.0
            </p>
          </div>
        </aside>

        <main key={tab} className="min-w-0 flex-1 pb-12 fade-up">
          {tab === "risk" && <RiskPredictor />}
          {tab === "city" && <CityRadar />}
          {tab === "planner" && (
            <TransitionPlanner onSave={(p) => setSavedPlans((prev) => [p, ...prev])} />
          )}
          {tab === "registry" && <IntegrityRegistry savedPlans={savedPlans} />}
        </main>
      </div>
    </div>
  );
}
