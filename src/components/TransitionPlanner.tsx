import { useMemo, useState } from "react";
import { generateTransitionRoadmap, SKILLS, TARGET_ROLES } from "@/services/mockEngine";
import { ArrowRight, Cloud, CheckCircle2, Loader2, Flag, ChevronDown } from "lucide-react";
import { PageHeader } from "./glass";

interface SavedPlan {
  currentSkill: string;
  targetRole: string;
  savedAt: string;
}

export function TransitionPlanner({ onSave }: { onSave: (plan: SavedPlan) => void }) {
  const [currentSkill, setCurrentSkill] = useState("Manual QA");
  const [targetRole, setTargetRole] = useState("SDET");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  const roadmap = useMemo(() => generateTransitionRoadmap(currentSkill, targetRole), [currentSkill, targetRole]);
  const chain = roadmap.bridgeSkills.flatMap((b) => [b.from, b.via, b.to]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ currentSkill, targetRole, savedAt: new Date().toISOString() });
      setSaving(false);
      setToast(true);
      setTimeout(() => setToast(false), 2800);
    }, 600);
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Transition Planner" title={<>Your Upskilling <span className="gradient-text">GPS</span></>} subtitle="Move from declining skills to resilient career paths." />

      <div className="glass flex flex-col gap-3 p-3 md:flex-row md:items-center md:p-4">
        <Pill label="Current skill" value={currentSkill} onChange={setCurrentSkill} options={SKILLS} />
        <ArrowRight className="mx-auto size-5 shrink-0 rotate-90 text-primary md:rotate-0" strokeWidth={1.7} />
        <Pill label="Target role" value={targetRole} onChange={setTargetRole} options={TARGET_ROLES} />
        <button onClick={handleSave} disabled={saving} className="btn-primary shrink-0">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Cloud className="size-4" strokeWidth={1.8} />}
          {saving ? "Saving…" : "Save Roadmap"}
        </button>
      </div>

      {/* Bridge skills */}
      <div className="glass p-6">
        <h3 className="text-xl font-semibold">Bridge Skills</h3>
        <p className="mt-1 text-sm text-muted-foreground">Semantic nearest neighbours from your current skill</p>
        <div className="mt-6 flex flex-col items-center gap-2 md:flex-row md:flex-wrap md:justify-center md:gap-3">
          {chain.map((s, i) => (
            <div key={`${s}-${i}`} className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
              <span className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)] ${
                i === 0 ? "border-destructive/25 bg-muted text-foreground/85" : i === chain.length - 1 ? "border-primary/40 bg-primary/15 text-foreground" : "border-glass-border bg-muted"
              }`}>{s}</span>
              {i < chain.length - 1 && (
                <>
                  <ChevronDown className="size-4 text-primary/70 md:hidden" />
                  <span className="hidden h-px w-10 bg-gradient-to-r from-primary/10 via-primary/70 to-primary/10 md:block" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute bottom-6 left-[19px] top-6 w-px bg-gradient-to-b from-primary/70 via-primary/30 to-primary/70 shadow-[0_0_12px_var(--primary)]" />
        <div className="space-y-5">
          {roadmap.phases.map((p, i) => (
            <div key={p.phase} className="relative flex gap-5 fade-up" style={{ animationDelay: `${i * 90}ms` }}>
              <div className="pulse-node relative z-10 mt-6 flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-sm font-semibold text-primary backdrop-blur-xl">{i + 1}</div>
              <div className="glass glass-hover flex-1 p-6">
                <p className="eyebrow text-primary">{p.months}</p>
                <h3 className="mt-1 text-xl font-semibold">{p.phase}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.focus}</p>
                <ul className="mt-4 grid gap-2.5 md:grid-cols-3">
                  {p.actions.map((a) => (
                    <li key={a} className="flex gap-2 rounded-2xl border border-glass-border bg-muted px-4 py-3 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.7} />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <div className="relative flex gap-5">
            <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"><Flag className="size-4" /></div>
            <div className="glass flex-1 border-primary/30 p-5">
              <p className="eyebrow">Target role</p>
              <p className="gradient-text mt-1 text-2xl font-semibold">{roadmap.targetRole}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        role="status"
        className={`glass fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-sm transition-all duration-500 ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <CheckCircle2 className="size-4 text-success" /> Roadmap saved to your cloud profile
      </div>
    </div>
  );
}

function Pill({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="glass-input flex flex-1 flex-col gap-0.5 !rounded-3xl !py-2.5">
      <span className="eyebrow !text-[10px]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none bg-transparent font-medium outline-none">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

export type { SavedPlan };
