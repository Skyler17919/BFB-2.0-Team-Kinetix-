import { createContext, useContext, type ReactNode } from "react";

const DemoModeContext = createContext(true);

export function DemoModeProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
