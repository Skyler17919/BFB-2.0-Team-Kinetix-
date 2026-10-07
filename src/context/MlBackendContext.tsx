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
  fetchHealth,
  fetchModels,
  type AlgorithmInfo,
  type HealthResponse,
  type ModelsResponse,
  type TrainResult,
  mlBaseUrl,
} from "@/lib/mlApi";

interface MlBackendContextValue {
  online: boolean;
  checking: boolean;
  error: string | null;
  health: HealthResponse | null;
  models: ModelsResponse | null;
  baseUrl: string;
  refresh: () => Promise<void>;
  applyTrainResult: (result: TrainResult) => void;
  algorithmStatus: (key: string) => AlgorithmInfo | null;
  hasTrainedModel: boolean;
}

const defaultContextValue: MlBackendContextValue = {
  online: false,
  checking: false,
  error: null,
  health: null,
  models: null,
  baseUrl: mlBaseUrl(),
  refresh: async () => undefined,
  applyTrainResult: () => undefined,
  algorithmStatus: () => null,
  hasTrainedModel: false,
};

const MlBackendContext = createContext<MlBackendContextValue>(defaultContextValue);

export function MlBackendProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [models, setModels] = useState<ModelsResponse | null>(null);

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const [h, m] = await Promise.all([fetchHealth(), fetchModels()]);
      setHealth(h);
      setModels(m);
      setOnline(true);
      setError(null);
    } catch (e) {
      setOnline(false);
      setHealth(null);
      setError(e instanceof Error ? e.message : "ML backend unreachable");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const applyTrainResult = useCallback((result: TrainResult) => {
    if (!result.ok) return;
    void refresh();
  }, [refresh]);

  const algorithmStatus = useCallback(
    (key: string) => models?.algorithms?.[key] ?? health?.algorithms?.[key] ?? null,
    [models, health],
  );

  const hasTrainedModel = Boolean(models?.active_model_id || (models?.models?.length ?? 0) > 0);

  const value = useMemo(
    () => ({
      online,
      checking,
      error,
      health,
      models,
      baseUrl: mlBaseUrl(),
      refresh,
      applyTrainResult,
      algorithmStatus,
      hasTrainedModel,
    }),
    [
      online,
      checking,
      error,
      health,
      models,
      refresh,
      applyTrainResult,
      algorithmStatus,
      hasTrainedModel,
    ],
  );

  return <MlBackendContext.Provider value={value}>{children}</MlBackendContext.Provider>;
}

export function useMlBackend() {
  return useContext(MlBackendContext);
}
