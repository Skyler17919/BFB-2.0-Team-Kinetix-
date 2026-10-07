import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackRoute,
});

function AuthCallbackRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const completeOAuth = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const code = params.get("code") || new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("OAuth callback error:", error.message);
        }
      }

      navigate({ to: "/" });
    };

    void completeOAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass max-w-md space-y-3 p-6 text-center">
        <p className="eyebrow text-primary">Authentication</p>
        <h1 className="text-2xl font-semibold tracking-tight">Connecting your account...</h1>
        <p className="text-sm text-muted-foreground">You’ll be redirected to your workspace momentarily.</p>
      </div>
    </div>
  );
}
