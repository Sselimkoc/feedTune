import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useSupabase() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get auth state from the store
  const { user: storeUser, session: storeSession } = useAuthStore();

  useEffect(() => {
    // Get initial user securely
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      console.log("[useSupabase] Initial user check:", !!user);

      if (error) {
        console.error("[useSupabase] Error getting initial user:", error);
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      setUser(user);

      if (user) {
        // Get session for additional session data if needed
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setIsAuthenticated(true);
          console.log("[useSupabase] Initial session set successfully");
        });
      } else {
        setSession(null);
        setIsAuthenticated(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[useSupabase] Auth state changed:", !!session);
      setSession(session);

      // Verify authentication by getting user securely
      if (session) {
        try {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();
          if (error) {
            console.error("[useSupabase] Error getting user:", error);
            setUser(null);
            setIsAuthenticated(false);
          } else {
            console.log("[useSupabase] User authenticated:", user?.id);
            setUser(user);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("[useSupabase] Error in auth state change:", error);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync with auth store
  useEffect(() => {
    if (storeUser && storeSession) {
      console.log(
        "[useSupabase] Syncing with auth store - user found:",
        storeUser.id
      );
      setUser(storeUser);
      setSession(storeSession);
      setIsAuthenticated(true);
    } else if (!storeUser && !storeSession) {
      console.log("[useSupabase] Syncing with auth store - no user");
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    }
  }, [storeUser, storeSession]);

  // Update isAuthenticated when user changes
  useEffect(() => {
    if (user) {
      console.log(
        "[useSupabase] User available, setting authenticated to true"
      );
      setIsAuthenticated(true);
    } else {
      console.log("[useSupabase] No user, setting authenticated to false");
      setIsAuthenticated(false);
    }
  }, [user]);

  return {
    supabase,
    session,
    user,
    isAuthenticated,
  };
}
