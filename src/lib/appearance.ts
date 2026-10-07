/** SkillVector appearance engine — generates balanced Liquid Glass themes from any accent. */

export type ColorMode = "dark" | "light" | "auto";

export interface AppearancePrefs {
  accent: string;
  mode: ColorMode;
  transparency: number;
  blur: number;
  glow: number;
  borderBrightness: number;
  radius: number;
}

export interface ThemeTokens {
  primary: string;
  secondary: string;
  background: string;
  navy: string;
  foreground: string;
  mutedForeground: string;
  success: string;
  warning: string;
  danger: string;
  steel: string;
  glassTint: string;
  borderColor: string;
  glowColor: string;
  chartColor: string;
  ambient1: string;
  ambient2: string;
  ambient3: string;
  primaryForeground: string;
}

export const STORAGE_KEY = "skillvector-appearance";

export const SKILLVECTOR_DEFAULT: AppearancePrefs = {
  accent: "#00D2FF",
  mode: "dark",
  transparency: 40,
  blur: 25,
  glow: 55,
  borderBrightness: 50,
  radius: 24,
};

export const RECOMMENDED_THEMES: {
  id: string;
  name: string;
  color: string;
  gradient: string;
}[] = [
  { id: "apple-blue", name: "Apple Blue", color: "#007AFF", gradient: "linear-gradient(135deg,#007AFF,#5AC8FA)" },
  { id: "liquid-cyan", name: "Liquid Cyan", color: "#00D2FF", gradient: "linear-gradient(135deg,#00D2FF,#4E79A7)" },
  { id: "deep-purple", name: "Deep Purple", color: "#8B5CF6", gradient: "linear-gradient(135deg,#8B5CF6,#C4B5FD)" },
  { id: "emerald", name: "Emerald", color: "#10B981", gradient: "linear-gradient(135deg,#10B981,#6EE7B7)" },
  { id: "ocean", name: "Ocean", color: "#0EA5E9", gradient: "linear-gradient(135deg,#0EA5E9,#38BDF8)" },
  { id: "aurora", name: "Aurora", color: "#6366F1", gradient: "linear-gradient(135deg,#6366F1,#A5B4FC)" },
  { id: "rose", name: "Rose", color: "#F43F5E", gradient: "linear-gradient(135deg,#F43F5E,#FB7185)" },
  { id: "amber", name: "Amber", color: "#F59E0B", gradient: "linear-gradient(135deg,#F59E0B,#FCD34D)" },
  { id: "arctic", name: "Arctic", color: "#38BDF8", gradient: "linear-gradient(135deg,#38BDF8,#E0F2FE)" },
  { id: "mint", name: "Mint", color: "#34D399", gradient: "linear-gradient(135deg,#34D399,#A7F3D0)" },
  { id: "sunset", name: "Sunset", color: "#F97316", gradient: "linear-gradient(135deg,#F97316,#FDBA74)" },
  { id: "neon-violet", name: "Neon Violet", color: "#A855F7", gradient: "linear-gradient(135deg,#A855F7,#E9D5FF)" },
  { id: "crimson", name: "Crimson", color: "#EF4444", gradient: "linear-gradient(135deg,#EF4444,#FCA5A5)" },
  { id: "gold", name: "Gold", color: "#EAB308", gradient: "linear-gradient(135deg,#EAB308,#FDE68A)" },
  { id: "monochrome", name: "Monochrome", color: "#A1A1AA", gradient: "linear-gradient(135deg,#E4E4E7,#71717A)" },
];

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function normalizeHex(hex: string): string {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return SKILLVECTOR_DEFAULT.accent;
  return `#${h.toUpperCase()}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s, l };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0,
    gp = 0,
    bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

export function contrastRatio(a: string, b: string): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Ensure accent stays readable on dark/light backgrounds by adjusting lightness. */
export function ensureReadableAccent(hex: string, darkBg: boolean): string {
  const { r, g, b } = hexToRgb(hex);
  let { h, s, l } = rgbToHsl(r, g, b);
  const bg = darkBg ? "#0B0F17" : "#F5F7FA";
  let candidate = hex;
  let guard = 0;
  while (contrastRatio(candidate, bg) < 3 && guard < 24) {
    l = darkBg ? Math.min(0.82, l + 0.04) : Math.max(0.28, l - 0.04);
    candidate = hslToHex(h, Math.max(0.35, s), l);
    guard++;
  }
  return candidate;
}

export function generateTheme(accentHex: string, mode: ColorMode, resolvedDark: boolean): ThemeTokens {
  const normalized = normalizeHex(accentHex);
  const isSkillVectorDefault = normalized === "#00D2FF";
  const accent = isSkillVectorDefault
    ? "#00D2FF"
    : ensureReadableAccent(normalized, resolvedDark);
  const { r, g, b } = hexToRgb(accent);
  const { h, s, l } = rgbToHsl(r, g, b);

  const secondary = isSkillVectorDefault
    ? "#4E79A7"
    : hslToHex((h + 28) % 360, clamp(s * 0.55, 0.25, 0.65), resolvedDark ? 0.48 : 0.42);
  const steel = isSkillVectorDefault
    ? "#4E79A7"
    : hslToHex((h + 12) % 360, clamp(s * 0.45, 0.2, 0.55), resolvedDark ? 0.72 : 0.45);
  const chart = accent;

  const success = hslToHex(152, 0.65, resolvedDark ? 0.55 : 0.42);
  const warning = hslToHex(40, 0.92, resolvedDark ? 0.58 : 0.48);
  const danger = hslToHex(350, 0.78, resolvedDark ? 0.68 : 0.52);

  const background = resolvedDark ? "#0B0F17" : "#F2F5F9";
  const navy = resolvedDark ? "#06101C" : "#E8EEF5";
  const foreground = resolvedDark ? "rgba(248, 250, 252, 0.94)" : "rgba(15, 23, 42, 0.92)";
  const mutedForeground = resolvedDark ? "rgba(186, 204, 222, 0.72)" : "rgba(71, 85, 105, 0.78)";

  const primaryForeground =
    contrastRatio(accent, "#0B0F17") > contrastRatio(accent, "#F8FBFF") ? "#0B0F17" : "#F8FBFF";

  const glassTint = resolvedDark
    ? `rgba(${r}, ${g}, ${b}, 0.06)`
    : `rgba(${r}, ${g}, ${b}, 0.08)`;
  const borderColor = resolvedDark
    ? `rgba(255, 255, 255, 0.12)`
    : `rgba(15, 23, 42, 0.1)`;
  const glowColor = `rgba(${r}, ${g}, ${b}, 0.35)`;

  const ambient1 = `rgba(${r}, ${g}, ${b}, ${resolvedDark ? 0.45 : 0.28})`;
  const shifted = hslToRgb((h + 40) % 360, s, l);
  const ambient2 = `rgba(${Math.round(shifted.r)}, ${Math.round(shifted.g)}, ${Math.round(shifted.b)}, ${resolvedDark ? 0.42 : 0.22})`;
  const light = hslToRgb(h, Math.min(1, s * 0.7), Math.min(0.9, l + 0.25));
  const ambient3 = `rgba(${Math.round(light.r)}, ${Math.round(light.g)}, ${Math.round(light.b)}, ${resolvedDark ? 0.35 : 0.2})`;

  // silence unused mode param when already resolved
  void mode;

  return {
    primary: accent,
    secondary,
    background,
    navy,
    foreground,
    mutedForeground,
    success,
    warning,
    danger,
    steel,
    glassTint,
    borderColor,
    glowColor,
    chartColor: chart,
    ambient1,
    ambient2,
    ambient3,
    primaryForeground,
  };
}

export function resolveDark(mode: ColorMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (typeof window === "undefined") return true;
  return !window.matchMedia("(prefers-color-scheme: light)").matches;
}

function rgbTriplet(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

export function applyAppearance(prefs: AppearancePrefs): ThemeTokens {
  const root = document.documentElement;
  const dark = resolveDark(prefs.mode);
  const tokens = generateTheme(prefs.accent, prefs.mode, dark);
  const { r, g, b } = hexToRgb(tokens.primary);
  const steelRgb = hexToRgb(tokens.steel);

  const glassAlpha = clamp(prefs.transparency, 0, 100) / 100;
  // Map 0–100 transparency: 0 = more opaque glass, 100 = more see-through
  const glassBgAlpha = dark
    ? 0.02 + (1 - glassAlpha) * 0.12
    : 0.35 + (1 - glassAlpha) * 0.45;
  const blurPx = clamp(prefs.blur, 0, 40);
  const glowStrength = clamp(prefs.glow, 0, 100) / 100;
  const borderAlpha = dark
    ? 0.06 + (clamp(prefs.borderBrightness, 0, 100) / 100) * 0.22
    : 0.08 + (clamp(prefs.borderBrightness, 0, 100) / 100) * 0.18;
  const radiusPx = clamp(prefs.radius, 8, 32);

  root.dataset["appearance"] = dark ? "dark" : "light";
  root.style.colorScheme = dark ? "dark" : "light";

  root.style.setProperty("--primary", tokens.primary);
  root.style.setProperty("--primary-rgb", `${r}, ${g}, ${b}`);
  root.style.setProperty("--primary-foreground", tokens.primaryForeground);
  root.style.setProperty("--steel", tokens.steel);
  root.style.setProperty("--steel-rgb", `${steelRgb.r}, ${steelRgb.g}, ${steelRgb.b}`);
  root.style.setProperty("--secondary-accent", tokens.secondary);
  root.style.setProperty("--secondary-accent-rgb", rgbTriplet(tokens.secondary));
  root.style.setProperty("--background", tokens.background);
  root.style.setProperty("--navy", tokens.navy);
  root.style.setProperty("--foreground", tokens.foreground);
  root.style.setProperty("--muted-foreground", tokens.mutedForeground);
  root.style.setProperty("--success", tokens.success);
  root.style.setProperty("--warning", tokens.warning);
  root.style.setProperty("--destructive", tokens.danger);
  root.style.setProperty("--ring", `rgba(${r}, ${g}, ${b}, 0.55)`);
  root.style.setProperty("--accent", `rgba(${r}, ${g}, ${b}, 0.16)`);
  root.style.setProperty("--accent-foreground", dark ? "#e0f2fe" : "#0c4a6e");
  root.style.setProperty("--glass", dark ? `rgba(255, 255, 255, ${glassBgAlpha})` : `rgba(255, 255, 255, ${0.45 + glassBgAlpha * 0.3})`);
  root.style.setProperty("--glass-border", dark ? `rgba(255, 255, 255, ${borderAlpha})` : `rgba(15, 23, 42, ${borderAlpha})`);
  root.style.setProperty("--border", dark ? `rgba(255, 255, 255, ${borderAlpha})` : `rgba(15, 23, 42, ${borderAlpha})`);
  root.style.setProperty("--input", dark ? `rgba(255, 255, 255, ${borderAlpha * 0.85})` : `rgba(15, 23, 42, ${borderAlpha * 0.7})`);
  root.style.setProperty("--card", dark ? `rgba(255, 255, 255, ${glassBgAlpha})` : `rgba(255, 255, 255, 0.55)`);
  root.style.setProperty("--popover", dark ? `rgba(8, 16, 28, 0.55)` : `rgba(255, 255, 255, 0.72)`);
  root.style.setProperty("--muted", dark ? `rgba(255, 255, 255, 0.055)` : `rgba(15, 23, 42, 0.05)`);
  root.style.setProperty("--secondary", dark ? `rgba(255, 255, 255, 0.06)` : `rgba(15, 23, 42, 0.06)`);

  root.style.setProperty("--glass-blur", `${blurPx}px`);
  root.style.setProperty("--glass-bg-alpha", String(glassBgAlpha));
  root.style.setProperty("--glass-border-alpha", String(borderAlpha));
  root.style.setProperty("--glow-strength", String(glowStrength));
  root.style.setProperty("--radius", `${radiusPx / 16}rem`);
  root.style.setProperty("--radius-px", `${radiusPx}px`);

  root.style.setProperty(
    "--shadow-glow",
    `0 10px 28px rgba(${r}, ${g}, ${b}, ${0.1 + glowStrength * 0.22}), inset 0 1px 0 rgba(255, 255, 255, ${dark ? 0.18 : 0.5})`,
  );
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.22), rgba(${steelRgb.r}, ${steelRgb.g}, ${steelRgb.b}, 0.1))`,
  );
  root.style.setProperty(
    "--gradient-text",
    dark
      ? `linear-gradient(180deg, #f8fbff 0%, rgba(${r}, ${g}, ${b}, 0.85) 70%, ${tokens.primary} 100%)`
      : `linear-gradient(180deg, #0f172a 0%, rgba(${r}, ${g}, ${b}, 0.9) 70%, ${tokens.primary} 100%)`,
  );
  root.style.setProperty(
    "--glass-edge",
    `linear-gradient(160deg, rgba(255,255,255,${dark ? 0.5 : 0.85}) 0%, rgba(255,255,255,0.08) 22%, rgba(${r},${g},${b},0.28) 52%, rgba(255,255,255,0.04) 76%, rgba(${steelRgb.r},${steelRgb.g},${steelRgb.b},0.22) 100%)`,
  );

  root.style.setProperty("--ambient-1", tokens.ambient1);
  root.style.setProperty("--ambient-2", tokens.ambient2);
  root.style.setProperty("--ambient-3", tokens.ambient3);
  root.style.setProperty("--chart-accent", tokens.chartColor);
  root.style.setProperty("--glass-tint", tokens.glassTint);

  // Soft highlight line tint
  root.style.setProperty("--glass-highlight", `rgba(${r}, ${g}, ${b}, 0.35)`);

  return tokens;
}

export function loadAppearance(): AppearancePrefs {
  if (typeof window === "undefined") return { ...SKILLVECTOR_DEFAULT };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...SKILLVECTOR_DEFAULT };
    const parsed = JSON.parse(raw) as Partial<AppearancePrefs>;
    return {
      accent: normalizeHex(parsed.accent ?? SKILLVECTOR_DEFAULT.accent),
      mode: parsed.mode === "light" || parsed.mode === "auto" || parsed.mode === "dark" ? parsed.mode : "dark",
      transparency: clamp(Number(parsed.transparency ?? SKILLVECTOR_DEFAULT.transparency), 0, 100),
      blur: clamp(Number(parsed.blur ?? SKILLVECTOR_DEFAULT.blur), 0, 40),
      glow: clamp(Number(parsed.glow ?? SKILLVECTOR_DEFAULT.glow), 0, 100),
      borderBrightness: clamp(Number(parsed.borderBrightness ?? SKILLVECTOR_DEFAULT.borderBrightness), 0, 100),
      radius: clamp(Number(parsed.radius ?? SKILLVECTOR_DEFAULT.radius), 8, 32),
    };
  } catch {
    return { ...SKILLVECTOR_DEFAULT };
  }
}

export function saveAppearance(prefs: AppearancePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function clearAppearanceStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
