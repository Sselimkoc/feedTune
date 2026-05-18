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
import { useSettingsStore } from "@/store/useSettingsStore";

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
          set({ user: null, session: null, isLoading: false, error });
        }
      },

      /**
       * Sign in with email and password
       */
      signIn: async ({ email, password, toastSuccess, toastError }) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({ email, password });

          if (error) throw error;

          set({ user: data.user, session: data.session, isLoading: false, error: null });
          if (toastSuccess) toastSuccess("auth.loginSuccess");
          return { success: true };
        } catch (error) {
          const code = error.code || "";
          const msg = error.message || "";
          set({ isLoading: false, error: msg });

          if (code === "email_not_confirmed" || msg.includes("Email not confirmed")) {
            return { success: false, status: "email_not_verified" };
          }
          if (
            code === "invalid_credentials" ||
            code === "user_not_found" ||
            msg.includes("Invalid login credentials") ||
            msg.includes("User not found")
          ) {
            if (toastError) toastError("auth.invalidCredentials");
            return { success: false, status: "invalid_credentials" };
          }
          if (code === "user_banned" || msg.includes("banned")) {
            if (toastError) toastError("auth.userBanned");
            return { success: false, status: "user_banned" };
          }
          if (code === "over_request_rate_limit" || msg.includes("rate limit") || msg.includes("429")) {
            if (toastError) toastError("auth.rateLimitError");
            return { success: false, status: "rate_limit" };
          }
          if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
            if (toastError) toastError("auth.networkError");
            return { success: false, status: "network_error" };
          }

          if (toastError) toastError("auth.loginError");
          return { success: false, status: "unknown" };
        }
      },

      /**
       * Sign up with email and password — routes through server API to bypass anon key rate limits
       */
      signUp: async ({ email, password, displayName, toastSuccess, toastError }) => {
        try {
          set({ isLoading: true, error: null });

          const lang = useSettingsStore.getState().settings.language || "tr";

          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, displayName, lang }),
          });

          const data = await res.json();
          set({ isLoading: false });

          if (!res.ok) {
            const errorMessage = data.error || "Sign up failed";
            set({ error: errorMessage });

            if (res.status === 409) {
              if (toastError) toastError("auth.emailAlreadyExists");
              return { success: false, error: errorMessage, status: "email_exists" };
            }

            if (toastError) toastError("auth.registerError");
            return { success: false, error: errorMessage };
          }

          if (toastSuccess) toastSuccess("auth.registerSuccess");
          return { success: true, error: null, needsVerification: true, status: "email_verification_needed" };
        } catch (error) {
          const errorMessage = error.message || "Sign up failed";
          set({ isLoading: false, error: errorMessage });
          if (toastError) toastError("auth.registerError");
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Update authenticated user profile (password, metadata)
       */
      updateProfile: async (updates, { toastSuccess, toastError } = {}) => {
        try {
          set({ isLoading: true, error: null });
          const { error } = await supabase.auth.updateUser(updates);
          if (error) throw error;
          set({ isLoading: false });
          if (toastSuccess) toastSuccess("auth.profileUpdated");
          return { success: true, error: null };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          if (toastError) toastError("auth.profileUpdateError");
          return { success: false, error: error.message };
        }
      },

      /**
       * Sign out
       */
      signOut: async ({ toastSuccess, toastError } = {}) => {
        try {
          const { error } = await supabase.auth.signOut();

          if (error) throw error;

          set({
            user: null,
            session: null,
            isLoading: false,
            error: null,
          });

          if (toastSuccess) toastSuccess("auth.logoutSuccess");

          return { success: true, error: null };
        } catch (error) {
          set({ error });
          if (toastError) toastError("auth.logoutError");
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
  const { signIn, signUp, signOut, initialize, clearError, updateProfile } = useAuthStore();

  return {
    signIn,
    signUp,
    signOut,
    initialize,
    clearError,
    updateProfile,
  };
}
