import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="glass max-w-md space-y-3 p-6 text-center">
          <p className="eyebrow text-primary">System</p>
          <h1 className="text-2xl font-semibold tracking-tight">Loading SkillVector...</h1>
          <p className="text-sm text-muted-foreground">Preparing your workforce workspace.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
