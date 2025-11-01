/**
 * Auth Provider
 * Client-side auth context and listeners
 *
 * - Sets up Supabase auth state listener
 * - Updates global auth state
 * - Handles session changes
 */

"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthStore } from "@/store/useAuthStore";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * AuthProvider Component
 * Initializes auth system and listens for session changes
 */
export function AuthProvider({ children }) {
  const { initialize, setSession } = useAuthStore();

  useEffect(() => {
    // Initialize app auth state
    initialize();

    // Listen for Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug("[AuthProvider] Auth state changed:", event);

      if (session) {
        // User logged in
        setSession(session.user, session);
      } else {
        // User logged out
        setSession(null, null);
      }
    });

    // Cleanup: unsubscribe from listener
    return () => {
      subscription?.unsubscribe();
    };
  }, [initialize, setSession]);

  return <>{children}</>;
}
