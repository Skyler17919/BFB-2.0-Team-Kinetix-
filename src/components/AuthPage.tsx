import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const inputClass =
  "glass-input w-full rounded-[22px] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70";

export function AuthPage({ modeOverride }: { modeOverride?: "signin" | "signup" }) {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsGuest,
    resendVerificationEmail,
    resetPasswordForEmail,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(modeOverride ?? "signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate, user]);

  const statCards = [
    { label: "Skills forecasted", value: "12K+" },
    { label: "Cities tracked", value: "18" },
    { label: "AI risk signals", value: "98%" },
  ];

  const clearForm = () => {
    setFullName("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setFormState("error");
      setMessage("Email and password are required.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormState("error");
      setMessage("Please use a valid email address.");
      return;
    }

    setFormState("loading");
    setMessage(null);

    try {
      if (mode === "signin") {
        await signInWithEmail(trimmedEmail, password);
        setFormState("success");
        setMessage("Signed in successfully.");
        navigate({ to: "/" });
      } else {
        if (password.length < 8) {
          setFormState("error");
          setMessage("Please choose a stronger password with at least 8 characters.");
          return;
        }
        if (password !== confirmPassword) {
          setFormState("error");
          setMessage("Passwords do not match.");
          return;
        }
        if (!fullName.trim()) {
          setFormState("error");
          setMessage("Please enter your full name.");
          return;
        }

        await signUpWithEmail(fullName.trim(), trimmedEmail, password);
        setVerificationPendingEmail(trimmedEmail);
        setFormState("success");
        setMessage("Check your email to verify your account.");
        clearForm();
      }
    } catch (error) {
      setFormState("error");
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  };

  const handleGoogleLogin = async () => {
    setFormState("loading");
    setMessage(null);

    try {
      await signInWithGoogle();
      setFormState("success");
    } catch (error) {
      setFormState("error");
      setMessage(error instanceof Error ? error.message : "Google sign-in could not be completed.");
    }
  };

  const handleGuestLogin = async () => {
    setFormState("loading");
    setMessage(null);

    try {
      await signInAsGuest();
      setFormState("success");
      setMessage("Continuing as guest.");
      navigate({ to: "/" });
    } catch (error) {
      setFormState("error");
      setMessage(error instanceof Error ? error.message : "Guest access could not be enabled.");
    }
  };

  const handleResendVerification = async () => {
    if (!verificationPendingEmail) return;

    try {
      await resendVerificationEmail(verificationPendingEmail);
      setMessage("Verification email resent. Please check your inbox.");
      setFormState("success");
    } catch (error) {
      setFormState("error");
      setMessage(error instanceof Error ? error.message : "Unable to resend verification email.");
    }
  };

  const handleResetLink = async () => {
    if (!email.trim()) {
      setFormState("error");
      setMessage("Please enter your email address.");
      return;
    }

    try {
      await resetPasswordForEmail(email.trim());
      setFormState("success");
      setMessage("Check your email for a password reset link.");
    } catch (error) {
      setFormState("error");
      setMessage(error instanceof Error ? error.message : "Unable to send reset email.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="glass max-w-md space-y-3 p-6 text-center">
          <p className="eyebrow text-primary">Authentication</p>
          <h1 className="text-2xl font-semibold tracking-tight">Checking authentication...</h1>
          <p className="text-sm text-muted-foreground">Preparing your SkillVector workspace.</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="app-shell min-h-screen">
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob ambient-blob-a" />
        <div className="ambient-blob ambient-blob-b" />
        <div className="ambient-blob ambient-blob-c" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="glass w-full max-w-6xl overflow-hidden p-4 md:p-6">
          <div className="mb-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="text-center lg:text-left">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 lg:mx-0">
                <Sparkles className="size-5 text-primary" strokeWidth={1.5} />
              </div>
              <p className="eyebrow text-primary">SkillVector</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Intelligent workforce intelligence for your career.</h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Forecast role risk, identify skill decay hotspots, and map the best next move for your future-ready workforce.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {statCards.map((card) => (
                  <div key={card.label} className="glass rounded-[20px] p-3 text-left">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{card.label}</p>
                    <p className="mt-2 text-xl font-semibold text-foreground">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-glass-border bg-background/10 p-3">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80"
                alt="Workforce planning team"
                className="h-[280px] w-full rounded-[22px] object-cover"
              />
              <div className="absolute bottom-8 left-8 right-8 rounded-[22px] border border-white/10 bg-slate-950/70 p-3 shadow-2xl backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live insight</p>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground/90">AI exposure risk</span>
                  <span className="text-emerald-300">Low-risk uplift</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl rounded-[28px] border border-glass-border/80 bg-background/10 p-5 md:p-8">
            {verificationPendingEmail ? (
              <div className="space-y-5">
                <div className="glass p-5 text-center">
                  <p className="eyebrow text-primary">Verify your email</p>
                  <h2 className="mt-2 text-2xl font-semibold">We sent a verification link to</h2>
                  <p className="mt-2 text-base text-foreground">{verificationPendingEmail}</p>
                </div>

                <button type="button" className="btn-primary w-full justify-center" onClick={handleResendVerification}>
                  Resend email
                </button>

                <button
                  type="button"
                  className="btn-glass w-full justify-center"
                  onClick={() => {
                    setVerificationPendingEmail(null);
                    setMode("signin");
                    setMessage(null);
                  }}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex w-full rounded-full border border-glass-border bg-background/10 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${mode === "signin" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${mode === "signup" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
                  >
                    Create account
                  </button>
                </div>

                <div className="space-y-4">
                  {mode === "signup" && (
                    <label className="block">
                      <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Full Name</span>
                      <input
                        className={inputClass}
                        placeholder="Aarav Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Email</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" strokeWidth={1.7} />
                      <input
                        className={`${inputClass} pl-10`}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" strokeWidth={1.7} />
                      <input
                        className={`${inputClass} pl-10 pr-10`}
                        type={showPassword ? "text" : "password"}
                        placeholder={mode === "signin" ? "Enter your password" : "Create a secure password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button type="button" className="absolute right-3 top-3.5 text-muted-foreground" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </label>

                  {mode === "signup" && (
                    <label className="block">
                      <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Confirm Password</span>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" strokeWidth={1.7} />
                        <input
                          className={`${inputClass} pl-10 pr-10`}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button type="button" className="absolute right-3 top-3.5 text-muted-foreground" onClick={() => setShowConfirmPassword((v) => !v)} aria-label="Toggle confirm password visibility">
                          {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </label>
                  )}

                  {message && (
                    <div className={`rounded-[18px] border px-3 py-2 text-sm ${formState === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}>
                      {message}
                    </div>
                  )}

                  <button type="button" className="btn-primary w-full justify-center" onClick={handleEmailAuth} disabled={formState === "loading"}>
                    {formState === "loading" ? (mode === "signin" ? "Signing in..." : "Creating account...") : mode === "signin" ? "Sign In" : "Create Account"}
                  </button>

                  <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    <span>or</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <button type="button" className="btn-glass w-full justify-center" onClick={handleGoogleLogin} disabled={formState === "loading"}>
                    Continue with Google
                  </button>

                  <button type="button" className="btn-glass w-full justify-center" onClick={handleGuestLogin} disabled={formState === "loading"}>
                    Continue as Guest
                  </button>

                  {mode === "signin" && (
                    <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
                      <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={handleResetLink}>
                        Forgot password?
                      </button>
                      <p>
                        Don’t have an account?{" "}
                        <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => { setMode("signup"); setMessage(null); }}>
                          Create account
                        </button>
                      </p>
                    </div>
                  )}

                  {mode === "signup" && (
                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => { setMode("signin"); setMessage(null); }}>
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <Link to="/" className="text-primary underline-offset-4 hover:underline">
                Continue to app
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
