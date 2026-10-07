import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  Palette,
  RotateCcw,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { useAppearance } from "@/context/AppearanceContext";
import {
  RECOMMENDED_THEMES,
  hexToRgb,
  hslToHex,
  normalizeHex,
  rgbToHsl,
  type ColorMode,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";

const MODES: { id: ColorMode; label: string }[] = [
  { id: "dark", label: "Dark Glass" },
  { id: "light", label: "Light Glass" },
  { id: "auto", label: "Auto" },
];

function ColorWheel({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const size = 168;
  const radius = size / 2 - 6;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    for (let angle = 0; angle < 360; angle++) {
      const start = ((angle - 0.6) * Math.PI) / 180;
      const end = ((angle + 0.6) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.45, hslToHex(angle, 0.55, 0.72));
      grad.addColorStop(1, hslToHex(angle, 1, 0.5));
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Soft inner disc
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  useEffect(() => {
    paint();
  }, [paint]);

  const pick = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - size / 2;
    const y = clientY - rect.top - size / 2;
    const dist = Math.sqrt(x * x + y * y);
    if (dist > radius) return;
    let hue = (Math.atan2(y, x) * 180) / Math.PI;
    if (hue < 0) hue += 360;
    const sat = Math.min(1, dist / radius);
    const light = 0.5 + (1 - sat) * 0.28;
    onChange(hslToHex(hue, Math.max(0.15, sat), light));
  };

  const { r, g, b } = hexToRgb(value);
  const { h, s } = rgbToHsl(r, g, b);
  const markerAngle = (h * Math.PI) / 180;
  const markerDist = s * radius * 0.92;
  const mx = size / 2 + Math.cos(markerAngle) * markerDist;
  const my = size / 2 + Math.sin(markerAngle) * markerDist;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        className="cursor-crosshair rounded-full shadow-[0_0_40px_rgba(var(--primary-rgb),0.25)]"
        style={{ width: size, height: size }}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          pick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          pick(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      />
      <div
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_12px_rgba(0,0,0,0.45)]"
        style={{ left: mx, top: my, background: value }}
      />
    </div>
  );
}

function GlassSlider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </span>
        <span className="tabular-nums text-[11px] text-foreground/80">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-slider w-full"
      />
    </label>
  );
}

export function ColorCustomizer() {
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    prefs,
    setAccent,
    setMode,
    setTransparency,
    setBlur,
    setGlow,
    setBorderBrightness,
    setRadius,
    generateBalancedTheme,
    save,
    reset,
    isDirty,
  } = useAppearance();

  useEffect(() => {
    setHexDraft(prefs.accent);
  }, [prefs.accent]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (panelRef.current.contains(target)) return;
      const trigger = document.getElementById("sv-appearance-trigger");
      if (trigger?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const commitHex = () => {
    setAccent(normalizeHex(hexDraft));
  };

  return (
    <>
      <button
        id="sv-appearance-trigger"
        type="button"
        aria-label="Customize appearance"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed top-4 right-4 z-[80] flex size-11 items-center justify-center rounded-full transition-all duration-500 md:top-8 md:right-8",
          "border border-white/20 bg-white/8 shadow-[0_12px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.22)]",
          "backdrop-blur-[22px] saturate-150 hover:-translate-y-0.5 hover:border-white/35 hover:shadow-[0_16px_48px_rgba(0,0,0,0.35),0_0_24px_rgba(var(--primary-rgb),0.2)]",
          open && "border-[rgba(var(--primary-rgb),0.45)] shadow-[0_0_28px_rgba(var(--primary-rgb),0.35)]",
        )}
      >
        <Palette className="size-[18px] text-primary" strokeWidth={1.5} />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Customize Appearance"
          className="customizer-panel fixed top-[4.5rem] right-4 z-[80] w-[min(100vw-2rem,360px)] overflow-hidden md:top-24 md:right-8"
        >
          <div className="customizer-panel-inner max-h-[min(78vh,720px)] overflow-y-auto p-5 md:p-6">
            <header className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="size-3.5 text-primary" strokeWidth={1.5} />
                  <h2 className="text-[15px] font-semibold tracking-tight">Customize Appearance</h2>
                </div>
                <p className="text-[13px] font-light text-muted-foreground">Make SkillVector yours.</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                <X className="size-3.5" strokeWidth={1.5} />
              </button>
            </header>

            <section className="space-y-4">
              <p className="eyebrow">Accent Color</p>
              <ColorWheel value={prefs.accent} onChange={setAccent} />
              <div className="flex items-center gap-3">
                <div
                  className="size-9 shrink-0 rounded-full border border-white/25 shadow-[0_0_20px_rgba(var(--primary-rgb),0.45)]"
                  style={{ background: prefs.accent }}
                />
                <div className="relative flex-1">
                  <input
                    value={hexDraft}
                    onChange={(e) => setHexDraft(e.target.value)}
                    onBlur={commitHex}
                    onKeyDown={(e) => e.key === "Enter" && commitHex()}
                    className="glass-input !rounded-2xl py-2.5 font-mono text-sm tracking-wide"
                    spellCheck={false}
                    aria-label="Hex color"
                  />
                  <input
                    type="color"
                    value={normalizeHex(prefs.accent)}
                    onChange={(e) => setAccent(e.target.value)}
                    className="absolute top-1/2 right-3 size-6 -translate-y-1/2 cursor-pointer appearance-none overflow-hidden rounded-full border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                    aria-label="Pick any color"
                  />
                </div>
              </div>
            </section>

            <section className="mt-7 space-y-3">
              <p className="eyebrow">Recommended</p>
              <div className="grid grid-cols-5 gap-2.5">
                {RECOMMENDED_THEMES.map((t) => {
                  const active = normalizeHex(prefs.accent) === normalizeHex(t.color);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      title={t.name}
                      aria-label={t.name}
                      onClick={() => setAccent(t.color)}
                      className={cn(
                        "group relative flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition duration-300",
                        active ? "bg-white/10" : "hover:bg-white/5",
                      )}
                    >
                      <span
                        className={cn(
                          "size-9 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_16px_rgba(0,0,0,0.25)] transition duration-300 group-hover:scale-110",
                          active && "ring-2 ring-white/70 ring-offset-2 ring-offset-transparent",
                        )}
                        style={{ background: t.gradient }}
                      />
                      <span className="max-w-[62px] truncate text-[9px] font-medium tracking-wide text-muted-foreground">
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-7 space-y-3">
              <p className="eyebrow">Appearance</p>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "rounded-xl px-2 py-2.5 text-[11px] font-medium tracking-wide transition duration-300",
                      prefs.mode === m.id
                        ? "bg-primary/20 text-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.25)]"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={generateBalancedTheme}
              className="btn-glass mt-5 w-full gap-2 !rounded-2xl text-[13px]"
            >
              <Wand2 className="size-3.5 text-primary" strokeWidth={1.5} />
              Generate Theme
            </button>

            <section className="mt-5">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left transition hover:bg-white/[0.06]"
              >
                <span className="text-[12px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  Advanced Appearance
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition duration-300",
                    advancedOpen && "rotate-180",
                  )}
                  strokeWidth={1.5}
                />
              </button>
              {advancedOpen && (
                <div className="mt-3 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <GlassSlider
                    label="Glass Transparency"
                    value={prefs.transparency}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={setTransparency}
                  />
                  <GlassSlider
                    label="Background Blur"
                    value={prefs.blur}
                    min={0}
                    max={40}
                    unit="px"
                    onChange={setBlur}
                  />
                  <GlassSlider
                    label="Glass Glow"
                    value={prefs.glow}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={setGlow}
                  />
                  <GlassSlider
                    label="Border Brightness"
                    value={prefs.borderBrightness}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={setBorderBrightness}
                  />
                  <GlassSlider
                    label="UI Radius"
                    value={prefs.radius}
                    min={8}
                    max={32}
                    unit="px"
                    onChange={setRadius}
                  />
                </div>
              )}
            </section>

            <footer className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                onClick={reset}
                className="btn-glass flex-1 gap-1.5 !rounded-2xl !px-3 text-[12px]"
              >
                <RotateCcw className="size-3.5" strokeWidth={1.5} />
                Reset to SkillVector
              </button>
              <button
                type="button"
                onClick={() => {
                  save();
                }}
                className="btn-primary flex-1 !rounded-2xl !px-3 text-[12px]"
              >
                Save Appearance
                {isDirty ? " ·" : ""}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
