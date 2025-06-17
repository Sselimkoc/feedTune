"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

// Create and export the context
export const AuthContext = createContext({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
});

/**
 * Auth Provider component
 * Manages authentication state across the application
 */
export function AuthProvider({ children }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    user,
    session,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    initialize,
    setSession,
  } = useAuthStore();

  console.log("[AuthProvider] Initial state:", {
    isInitialized,
    user,
    session,
    isLoading,
    error,
  });

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      console.log("[AuthProvider] Initializing auth state...");
      try {
        await initialize();
        setIsInitialized(true);
        console.log("[AuthProvider] Auth state initialized successfully");
      } catch (error) {
        console.error("[AuthProvider] Auth initialization error:", error);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [initialize]);

  // Listen for auth changes
  useEffect(() => {
    if (!isInitialized) {
      console.log(
        "[AuthProvider] Not initialized yet, skipping auth state change listener"
      );
      return;
    }

    console.log("[AuthProvider] Setting up auth state change listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthProvider] Auth state changed:", { event, session });

      try {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          console.log(
            "[AuthProvider] Handling SIGNED_IN or TOKEN_REFRESHED event"
          );
          await setSession(session);
          router.refresh();
        } else if (event === "SIGNED_OUT") {
          console.log("[AuthProvider] Handling SIGNED_OUT event");
          await setSession(null);
          // Clear any remaining state
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth-storage");
          }
          router.refresh();
          // Force redirect to home page
          router.push("/");
        }
      } catch (error) {
        console.error("[AuthProvider] Auth state change error:", error);
      }
    });

    return () => {
      console.log("[AuthProvider] Cleaning up auth state change listener");
      subscription?.unsubscribe();
    };
  }, [isInitialized, setSession, router]);

  const value = {
    user,
    session,
    isLoading: isLoading || !isInitialized,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  console.log("[AuthProvider] Current value:", value);

  if (isLoading) {
    console.log("[AuthProvider] Loading state, showing spinner");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth state
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
