import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { mockUser } from "@/lib/mockData";

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
    // Use mock user for demonstration
    console.log("[useSupabase] Initial user check: true");

    setUser(mockUser);

    // Create a mock session
    const mockSession = {
      access_token: "mock-token",
      refresh_token: "mock-refresh-token",
      user: mockUser,
    };

    setSession(mockSession);
    setIsAuthenticated(true);
    console.log("[useSupabase] Initial session set successfully");

    // Mock auth state change for demonstration
    console.log("[useSupabase] Auth state changed: true");
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
