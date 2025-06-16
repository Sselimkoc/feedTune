"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthChanges, checkSession } from "@/lib/auth/userUtils";
import { useAuthStore } from "@/store/useAuthStore";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Create auth context
const AuthContext = createContext(null);

/**
 * Auth Provider component
 * Manages authentication state across the application
 */
export function AuthProvider({ children }) {
  const supabase = createClientComponentClient();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial loading check
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError) throw userError;
          useAuthStore.setState({ user, session });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        useAuthStore.setState({ user: null, session: null });
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const subscription = subscribeToAuthChanges(async (event, session) => {
      console.log("Auth state changed:", event);

      try {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();
          if (error) throw error;
          useAuthStore.setState({ user, session });
        } else if (event === "SIGNED_OUT") {
          useAuthStore.setState({ user: null, session: null });
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        useAuthStore.setState({ user: null, session: null });
      }
    });

    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  // Auth context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth state
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
