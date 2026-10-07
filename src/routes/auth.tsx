import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthPage } from "@/components/AuthPage";

export const Route = createFileRoute("/auth")({
  component: AuthRoute,
});

function AuthRoute() {
  return <AuthPage modeOverride="signin" />;
}
