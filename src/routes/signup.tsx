import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/AuthPage";

export const Route = createFileRoute("/signup")({
  component: () => <AuthPage modeOverride="signup" />,
});
