/**
 * Accounts.
 *
 * An account is a backup, and nothing else: it unlocks no feature, gates no
 * practice, and is never required to use the app. Somebody can go on for
 * years without one and lose nothing but the safety net.
 *
 * Errors are turned into sentences that say what to do next. "Invalid login
 * credentials" tells somebody nothing they can act on, and this is an
 * audience that has been taught to read a blunt error as a sign they have
 * done something wrong.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";

export const MIN_PASSWORD_LENGTH = 8;

export interface AuthAttempt {
  ok: boolean;
  /** Shown as written. Always says what to do about it. */
  message?: string;
  /**
   * The account exists but the address has not been confirmed yet, so there
   * is no session. Nothing is blocked; the app carries on locally.
   */
  awaitingEmail?: boolean;
  userId?: string;
}

interface AuthApi {
  ready: boolean;
  session: Session | null;
  userId: string | null;
  email: string | null;
  signUp(email: string, password: string): Promise<AuthAttempt>;
  signIn(email: string, password: string): Promise<AuthAttempt>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

export function useAuth(): AuthApi {
  const api = useContext(AuthContext);
  if (!api) throw new Error("useAuth was called outside AuthProvider");
  return api;
}

/** Supabase's wording, rewritten as something a person can act on. */
function explain(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "That email and password do not go together. Check the password, and that the email is the one you signed up with.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "There is already an account with that email. Try signing in to it instead.";
  }
  if (text.includes("email") && text.includes("invalid")) {
    return "That does not look like an email address. It needs an @ in it.";
  }
  if (text.includes("password") && text.includes("least")) {
    return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (text.includes("email not confirmed")) {
    return "This account still needs confirming. Look for the email we sent, then come back and sign in.";
  }
  if (text.includes("network") || text.includes("fetch")) {
    return "Could not reach the internet just now. Your practice is safe on this phone, and you can try again later.";
  }
  if (text.includes("rate") || text.includes("many")) {
    return "That has been tried a few times in a row. Leave it a minute and try again.";
  }
  return "That did not work. Your practice is safe on this phone, and you can try again later.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setSession(data.session);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const api = useMemo<AuthApi>(
    () => ({
      ready,
      session,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,

      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) return { ok: false, message: explain(error.message) };

        // With email confirmation switched on there is a user but no
        // session. That is not a failure and it does not stop anything:
        // practice carries on locally and the backup starts when they
        // confirm and sign in.
        if (!data.session) {
          return { ok: true, awaitingEmail: true, userId: data.user?.id };
        }
        return { ok: true, userId: data.session.user.id };
      },

      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) return { ok: false, message: explain(error.message) };
        return { ok: true, userId: data.session?.user.id };
      },

      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [ready, session],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}
