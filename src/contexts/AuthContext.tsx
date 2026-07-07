import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** True until Supabase has restored (or confirmed absence of) a persisted session. */
  loading: boolean;
  /** True once the initial getSession() call has resolved at least once. */
  initialized: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  initialized: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Subscribe FIRST so we don't miss events that fire during getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        // Only flip "initialized" once the first event or getSession() lands.
        if (!initializedRef.current) {
          initializedRef.current = true;
          setInitialized(true);
        }
      }
    );

    // Then hydrate from storage. On iOS Capacitor / PWAs this can take a tick
    // longer than on desktop because storage access is async-ish.
    supabase.auth.getSession().then(({ data: { session: restored } }) => {
      setSession(restored);
      if (!initializedRef.current) {
        initializedRef.current = true;
        setInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("logout");
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading: !initialized,
        initialized,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
