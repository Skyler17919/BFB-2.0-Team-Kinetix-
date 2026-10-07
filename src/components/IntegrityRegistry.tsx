import { useState } from "react";
import {
  parseGithubHandle,
  verifySkillIntegrity,
  SKILLS,
  type IntegrityScore,
} from "@/services/mockEngine";
import type { SavedPlan } from "./TransitionPlanner";
import {
  ShieldCheck,
  Github,
  LogIn,
  UserRound,
  Cloud,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { PageHeader, RingGauge, GlassBar } from "./glass";

export function IntegrityRegistry({ savedPlans }: { savedPlans: SavedPlan[] }) {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [stack, setStack] = useState<string[]>(["React Development"]);
  const [result, setResult] = useState<IntegrityScore | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const githubHandle = parseGithubHandle(githubUrl);

  const toggleStack = (s: string) =>
    setStack((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const overall = result
    ? Math.round((result.authenticityScore + result.contributionScore) / 2)
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Integrity & Profile"
        title="Skill Integrity"
        subtitle="Verify whether claimed skills match actual technical contributions."
      />

      {/* Profile identity */}
      <div className="glass p-5 md:p-6">
        {user ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <UserRound className="size-6 text-primary" strokeWidth={1.6} />
              </div>
              <div>
                <p className="text-lg font-semibold">{user}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-success" /> Cloud profile active
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <Stat k="Verified skills" v={result ? `${stack.length}` : "—"} />
              <Stat k="Integrity score" v={result ? `${overall}%` : "—"} />
              <Stat k="Saved roadmaps" v={`${savedPlans.length}`} />
            </div>
            <button onClick={() => setUser(null)} className="btn-glass">
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="glass-input md:flex-1"
              aria-label="Email"
            />
            <button onClick={() => email && setUser(email)} className="btn-primary">
              <LogIn className="size-4" /> Sign in
            </button>
            <button onClick={() => setUser("Guest")} className="btn-glass">
              Continue as Guest
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Verifier */}
        <div className="glass p-6 lg:col-span-3">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <ShieldCheck className="size-5 text-primary" strokeWidth={1.7} /> Skill Integrity
            Verifier
          </h3>
          <p className="eyebrow mt-6 mb-2">GitHub URL</p>
          <label className="glass-input flex items-center gap-3">
            <Github className="size-4 text-muted-foreground" strokeWidth={1.7} />
            <input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full bg-transparent outline-none"
              aria-label="GitHub profile URL"
            />
          </label>
          <p className="eyebrow mt-6">Claimed Skill Stack</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <button
                key={s}
                onClick={() => toggleStack(s)}
                className={`rounded-full border px-4 py-1.5 text-xs transition-all duration-300 hover:-translate-y-0.5 ${stack.includes(s) ? "border-primary/50 bg-primary/15 text-foreground" : "border-glass-border bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              if (!githubHandle) {
                setVerifyError("Enter a GitHub profile URL, e.g. https://github.com/username");
                setResult(null);
                return;
              }
              if (stack.length === 0) {
                setVerifyError("Select at least one claimed skill.");
                setResult(null);
                return;
              }
              setVerifyError(null);
              setResult(verifySkillIntegrity(githubUrl, stack));
            }}
            className="btn-primary mt-6 w-full"
          >
            <ShieldCheck className="size-4" /> Verify Authenticity
          </button>
          {verifyError && <p className="mt-3 text-sm text-destructive">{verifyError}</p>}

          {result && (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 fade-up">
              {result.signals.map((sig) => (
                <li
                  key={sig.label}
                  className="flex items-start gap-2 rounded-2xl border border-glass-border bg-muted px-4 py-3 text-sm"
                >
                  {sig.positive ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}
                  <div>
                    <p className="text-muted-foreground">{sig.label}</p>
                    <p className="font-medium">{sig.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Score */}
        <div className="glass flex flex-col p-6 lg:col-span-2">
          <p className="eyebrow">Authenticity score</p>
          {result ? (
            <div className="fade-up">
              <div className="my-6">
                <RingGauge
                  value={overall}
                  label="Authenticity"
                  sublabel="& Contribution"
                  size={210}
                />
              </div>
              <div className="space-y-4">
                <GlassBar label="Repository Evidence" value={result.authenticityScore} />
                <GlassBar label="Contribution Depth" value={result.contributionScore} />
                <GlassBar label="Skill Consistency" value={overall} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <span className="icon-orb mb-3 size-12">
                <ShieldCheck className="size-5" strokeWidth={1.6} />
              </span>
              Run a verification to see the score.
            </div>
          )}
        </div>
      </div>

      {/* Saved roadmaps */}
      <div>
        <h3 className="mb-4 text-xl font-semibold">Saved Transition Plans</h3>
        {savedPlans.length === 0 ? (
          <div className="glass p-6 text-sm text-muted-foreground">
            No saved roadmaps yet. Build one in the Transition Planner and tap “Save Roadmap”.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {savedPlans.map((p, i) => (
              <div key={i} className="glass glass-hover p-5 fade-up">
                <p className="eyebrow flex items-center gap-1.5">
                  <Cloud className="size-3.5 text-primary" /> Saved roadmap
                </p>
                <p className="mt-3 text-lg font-semibold">
                  {p.currentSkill} → {p.targetRole}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> Target: 6–12 months
                </p>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[8%] rounded-full bg-primary" />
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Saved {new Date(p.savedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="eyebrow !text-[10px]">{k}</p>
      <p className="text-lg font-semibold">{v}</p>
    </div>
  );
}
