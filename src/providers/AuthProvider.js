"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
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

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [initialize]);

  // Listen for auth changes
  useEffect(() => {
    if (!isInitialized) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      try {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          console.log("Auth state: SIGNED_IN or TOKEN_REFRESHED");
          await setSession(session);
          router.refresh();
        } else if (event === "SIGNED_OUT") {
          console.log("Auth state: SIGNED_OUT, clearing session...");
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
        console.error("Auth state change error:", error);
      }
    });

    return () => {
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

  if (isLoading) {
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
