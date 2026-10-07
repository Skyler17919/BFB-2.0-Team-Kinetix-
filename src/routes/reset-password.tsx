import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const inputClass = "glass-input w-full rounded-[22px] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!password || !confirmPassword) {
      setError("Both password fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await updatePassword(password);
      setMessage("Password updated successfully. Redirecting to your workspace...");
      setTimeout(() => navigate({ to: "/" }), 1200);
    } catch (submittedError) {
      setError(submittedError instanceof Error ? submittedError.message : "Unable to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass w-full max-w-md p-6">
        <p className="eyebrow text-primary">Reset password</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Choose a new password</h1>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">New Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" strokeWidth={1.7} />
              <input
                className={`${inputClass} pl-10 pr-10`}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your new password"
              />
              <button type="button" className="absolute right-3 top-3.5 text-muted-foreground" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Confirm Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" strokeWidth={1.7} />
              <input
                className={`${inputClass} pl-10 pr-10`}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your new password"
              />
              <button type="button" className="absolute right-3 top-3.5 text-muted-foreground" onClick={() => setShowConfirmPassword((v) => !v)}>
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error && <div className="rounded-[18px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
          {message && <div className="rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div>}

          <button type="button" className="btn-primary w-full justify-center" onClick={onSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
