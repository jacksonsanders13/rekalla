import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "./types";

interface SessionState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const SessionContext = createContext<SessionState>({
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error(`[session] profile load failed: ${error.message}`);
    }
    setProfile(data ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, next) => {
        setSession(next);
        await loadProfile(next?.user.id);
        setLoading(false);
      },
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        profile,
        loading,
        refreshProfile: () => loadProfile(session?.user.id),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
