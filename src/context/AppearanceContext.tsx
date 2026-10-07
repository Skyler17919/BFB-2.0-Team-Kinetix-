import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyAppearance,
  clearAppearanceStorage,
  generateTheme,
  loadAppearance,
  resolveDark,
  saveAppearance,
  SKILLVECTOR_DEFAULT,
  type AppearancePrefs,
  type ColorMode,
  type ThemeTokens,
} from "@/lib/appearance";

interface AppearanceContextValue {
  prefs: AppearancePrefs;
  tokens: ThemeTokens;
  setAccent: (hex: string) => void;
  setMode: (mode: ColorMode) => void;
  setTransparency: (v: number) => void;
  setBlur: (v: number) => void;
  setGlow: (v: number) => void;
  setBorderBrightness: (v: number) => void;
  setRadius: (v: number) => void;
  generateBalancedTheme: () => void;
  save: () => void;
  reset: () => void;
  isDirty: boolean;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function computeTokens(prefs: AppearancePrefs): ThemeTokens {
  return generateTheme(prefs.accent, prefs.mode, resolveDark(prefs.mode));
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppearancePrefs>(() =>
    typeof window !== "undefined" ? loadAppearance() : { ...SKILLVECTOR_DEFAULT },
  );
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    JSON.stringify(typeof window !== "undefined" ? loadAppearance() : SKILLVECTOR_DEFAULT),
  );

  useEffect(() => {
    applyAppearance(prefs);
  }, [prefs]);

  useEffect(() => {
    if (prefs.mode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyAppearance(prefs);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs]);

  const patch = useCallback((partial: Partial<AppearancePrefs>) => {
    setPrefs((p) => ({ ...p, ...partial }));
  }, []);

  const setAccent = useCallback((hex: string) => patch({ accent: hex }), [patch]);
  const setMode = useCallback((mode: ColorMode) => patch({ mode }), [patch]);
  const setTransparency = useCallback((transparency: number) => patch({ transparency }), [patch]);
  const setBlur = useCallback((blur: number) => patch({ blur }), [patch]);
  const setGlow = useCallback((glow: number) => patch({ glow }), [patch]);
  const setBorderBrightness = useCallback(
    (borderBrightness: number) => patch({ borderBrightness }),
    [patch],
  );
  const setRadius = useCallback((radius: number) => patch({ radius }), [patch]);

  const generateBalancedTheme = useCallback(() => {
    setPrefs((p) => {
      const dark = resolveDark(p.mode);
      const tokens = generateTheme(p.accent, p.mode, dark);
      // Balanced defaults: readable accent + premium glass tuning
      return {
        ...p,
        accent: tokens.primary,
        transparency: dark ? 48 : 62,
        blur: 28,
        glow: 62,
        borderBrightness: dark ? 55 : 42,
        radius: 24,
      };
    });
  }, []);

  const save = useCallback(() => {
    saveAppearance(prefs);
    setSavedSnapshot(JSON.stringify(prefs));
  }, [prefs]);

  const reset = useCallback(() => {
    const next = { ...SKILLVECTOR_DEFAULT };
    setPrefs(next);
    clearAppearanceStorage();
    setSavedSnapshot(JSON.stringify(next));
    applyAppearance(next);
  }, []);

  const tokens = useMemo(() => computeTokens(prefs), [prefs]);
  const isDirty = JSON.stringify(prefs) !== savedSnapshot;

  const value = useMemo(
    () => ({
      prefs,
      tokens,
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
    }),
    [
      prefs,
      tokens,
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
    ],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}
