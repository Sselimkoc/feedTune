"use client";

/**
 * Simplified Auth Store
 * Client-side auth state management using Zustand
 *
 * Minimal state: user, session, isLoading, error
 * Direct Supabase integration - no mock users
 * Email verification enabled
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Auth Store - Minimal and clean
 * Only essential state for app functionality
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      error: null,

      /**
       * Initialize auth - check for existing session
       */
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          // Check if user has existing session
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error("[useAuthStore] Init error:", error);
            set({ user: null, session: null, isLoading: false, error });
            return;
          }

          // If session exists, set user and session
          if (data?.session) {
            set({
              user: data.session.user,
              session: data.session,
              isLoading: false,
              error: null,
            });
          } else {
            set({ user: null, session: null, isLoading: false, error: null });
          }
        } catch (error) {
          console.error("[useAuthStore] Initialize error:", error);
          set({ user: null, session: null, isLoading: false, error });
        }
      },

      /**
       * Sign in with email and password
       */
      signIn: async (email, password) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          set({
            user: data.user,
            session: data.session,
            isLoading: false,
            error: null,
          });

          return { success: true, error: null };
        } catch (error) {
          console.error("[useAuthStore] signIn error:", error);
          const errorMessage = error.message || "Login failed";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Sign up with email and password
       */
      signUp: async (email, password, displayName) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName || email.split("@")[0],
              },
            },
          });

          if (error) throw error;

          set({
            user: data.user,
            session: data.session,
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            error: null,
            needsVerification: !data.session,
          };
        } catch (error) {
          console.error("[useAuthStore] signUp error:", error);
          const errorMessage = error.message || "Sign up failed";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Sign out
       */
      signOut: async () => {
        try {
          set({ isLoading: true });

          const { error } = await supabase.auth.signOut();

          if (error) throw error;

          set({
            user: null,
            session: null,
            isLoading: false,
            error: null,
          });

          return { success: true, error: null };
        } catch (error) {
          console.error("[useAuthStore] signOut error:", error);
          set({ isLoading: false, error });
          return { success: false, error };
        }
      },

      /**
       * Update session from auth state listener
       */
      setSession: (user, session) => {
        set({ user, session, isLoading: false });
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-store",
      // Only persist user and session
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);

/**
 * useAuth Hook
 * Access current user and auth state
 */
export function useAuth() {
  const { user, session, isLoading } = useAuthStore();

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
  };
}

/**
 * useAuthActions Hook
 * Access auth action methods
 */
export function useAuthActions() {
  const { signIn, signUp, signOut, initialize, clearError } = useAuthStore();

  return {
    signIn,
    signUp,
    signOut,
    initialize,
    clearError,
  };
}
