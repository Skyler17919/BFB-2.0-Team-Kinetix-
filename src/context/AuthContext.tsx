import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAuthRedirectUrl, supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email?: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const GUEST_SESSION_KEY = "skillvector_guest_session";

const createGuestUser = (): User =>
  ({
    id: "guest-user",
    email: "guest@skillvector.local",
    app_metadata: { provider: "guest" },
    user_metadata: { full_name: "Guest User" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  }) as User;

const createGuestSession = (user: User): Session =>
  ({
    access_token: "guest-access-token",
    refresh_token: "guest-refresh-token",
    expires_in: 60 * 60 * 24,
    token_type: "bearer",
    user,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  }) as Session;

const AuthContext = createContext<AuthContextValue | null>(null);

export const getFriendlyAuthError = (error: { message?: string } | null, fallback: string) => {
  if (!error) return fallback;

  const message = error.message?.toLowerCase() ?? "";

  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "Email or password is incorrect.";
  }
  if (message.includes("email not confirmed") || message.includes("confirm your email")) {
    return "Please verify your email before continuing.";
  }
  if (message.includes("already registered") || message.includes("user already registered")) {
    return "An account with this email already exists.";
  }
  if (message.includes("weak password")) {
    return "Please choose a stronger password.";
  }
  if (message.includes("email signups are disabled") || message.includes("email signup") || message.includes("email provider") || message.includes("provider is disabled")) {
    return "Email sign-up is disabled in your Supabase project. Enable Email under Authentication > Providers, then try again.";
  }
  if (message.includes("redirect url") || message.includes("redirect") && message.includes("not allowed")) {
    return "Your Supabase redirect URL is not configured. Add http://localhost:4173/auth/callback and http://127.0.0.1:4173/auth/callback in Authentication > URL Configuration.";
  }
  if (message.includes("invalid api key") || message.includes("missing api key") || message.includes("invalid supabase url")) {
    return "Authentication is misconfigured. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.";
  }
  if (
    message.includes("failed to fetch") ||
    message.includes("err_name_not_resolved") ||
    message.includes("dns") ||
    message.includes("networkerror") ||
    message.includes("network")
  ) {
    return "Supabase could not be reached from this browser. Check your internet connection and verify the project URL in VITE_SUPABASE_URL.";
  }

  return fallback;
};

async function ensureProfileForUser(user: User | null) {
  if (!user) return;

  const fullName =
    (user.user_metadata?.["full_name"] as string | undefined) ||
    (user.user_metadata?.["name"] as string | undefined) ||
    user.email?.split("@")[0] ||
    "SkillVector User";

  const avatarUrl =
    (user.user_metadata?.["avatar_url"] as string | undefined) ||
    (user.user_metadata?.["picture"] as string | undefined) ||
    null;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.warn("Profile sync skipped:", error.message);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      if (typeof window !== "undefined") {
        const guestSessionEnabled = window.localStorage.getItem(GUEST_SESSION_KEY) === "true";
        if (guestSessionEnabled) {
          const guestUser = createGuestUser();
          if (!ignore) {
            setSession(createGuestSession(guestUser));
            setUser(guestUser);
            setLoading(false);
          }
          return;
        }
      }

      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!ignore) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          if (!ignore) {
            const nextUser = nextSession?.user ?? null;
            setSession(nextSession);
            setUser(nextUser);
            setLoading(false);

            if (nextUser) {
              await ensureProfileForUser(nextUser);
            }
          }
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        console.warn("Supabase session check failed, using guest mode fallback:", error);
        if (!ignore) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      ignore = true;
      unsubscribe?.();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(getFriendlyAuthError(error, "Unable to sign in. Please try again."));
    }
  }, []);

  const signUpWithEmail = useCallback(async (fullName: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      console.error("Supabase signup error:", error);
      throw new Error(getFriendlyAuthError(error, "Unable to create your account. Please try again."));
    }

    if (data.user) {
      await ensureProfileForUser(data.user);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      throw new Error(getFriendlyAuthError(error, "Google sign-in could not be completed. Please try again."));
    }
  }, []);

  const signInAsGuest = useCallback(async () => {
    const guestUser = createGuestUser();
    const guestSession = createGuestSession(guestUser);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUEST_SESSION_KEY, "true");
    }

    setSession(guestSession);
    setUser(guestUser);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(GUEST_SESSION_KEY);
    }

    if (session && user && user.id === "guest-user") {
      setSession(null);
      setUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(getFriendlyAuthError(error, "Unable to sign out. Please try again."));
    }
  }, [session, user]);

  const resendVerificationEmail = useCallback(async (email?: string) => {
    const targetEmail = email || user?.email;
    if (!targetEmail) {
      throw new Error("Please provide a valid email address.");
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
    });

    if (error) {
      throw new Error(getFriendlyAuthError(error, "Unable to resend verification email."));
    }
  }, [user?.email]);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl("/reset-password"),
    });

    if (error) {
      throw new Error(getFriendlyAuthError(error, "Unable to send a password reset email."));
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(getFriendlyAuthError(error, "Unable to update your password."));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(session && user),
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInAsGuest,
      signOut,
      resendVerificationEmail,
      resetPasswordForEmail,
      updatePassword,
    }),
    [loading, session, signInWithEmail, signInWithGoogle, signInAsGuest, signOut, signUpWithEmail, updatePassword, user, resendVerificationEmail, resetPasswordForEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
