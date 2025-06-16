"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Auth messages
const AUTH_MESSAGES = {
  VERIFICATION_EMAIL_SENT: "auth.verificationEmailSent",
  LOGIN_SUCCESS: "auth.loginSuccess",
  LOGOUT_SUCCESS: "auth.logoutSuccess",
  AUTHENTICATION_ERROR: "auth.authenticationError",
  PROFILE_UPDATED: "auth.profileUpdated",
  RATE_LIMIT_ERROR: "auth.rateLimitError",
  SESSION_EXPIRED: "auth.sessionExpired",
  NETWORK_ERROR: "auth.networkError",
};

// Rate limit throttle
const throttle = {
  lastAttempt: 0,
  minInterval: 2000,
  isThrottled() {
    const now = Date.now();
    if (now - this.lastAttempt < this.minInterval) {
      return true;
    }
    this.lastAttempt = now;
    return false;
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => {
      const supabase = createClientComponentClient();

      const handleAuthError = (error, toastError) => {
        console.error("Auth error:", error);

        // Rate limit
        if (error.status === 429) {
          toastError?.(AUTH_MESSAGES.RATE_LIMIT_ERROR);
          return { success: false, error };
        }

        // Session/token errors
        if (error.status === 401 || error.message?.includes("token")) {
          set({ user: null, session: null });
          if (window.location.pathname !== "/") {
            window.location.href = "/";
          }
          toastError?.(AUTH_MESSAGES.SESSION_EXPIRED);
          return { success: false, error };
        }

        // Network errors
        if (error.message?.includes("network")) {
          toastError?.(AUTH_MESSAGES.NETWORK_ERROR);
          return { success: false, error };
        }

        // Other errors
        toastError?.(error.message || AUTH_MESSAGES.AUTHENTICATION_ERROR);
        return { success: false, error };
      };

      return {
        user: null,
        session: null,
        isLoading: true,
        error: null,

        // Initialize auth state (no toast here)
        initialize: async () => {
          try {
            set({ isLoading: true, error: null });

            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            if (session) {
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();
              if (userError) throw userError;
              set({ user, session, isLoading: false });
            } else {
              set({ user: null, session: null, isLoading: false });
            }
          } catch (error) {
            set({ error, isLoading: false });
            console.error("Auth initialization error:", error);
          }
        },

        // Sign in - accepts toast functions as arguments
        signIn: async ({ email, password, toastSuccess, toastError }) => {
          try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) throw error;

            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();
            if (userError) throw userError;

            set({ user, session: data.session, isLoading: false });
            toastSuccess?.(AUTH_MESSAGES.LOGIN_SUCCESS);
            return { success: true };
          } catch (error) {
            return handleAuthError(error, toastError);
          } finally {
            set({ isLoading: false });
          }
        },

        // Sign up - accepts toast functions as arguments
        signUp: async ({ email, password, toastSuccess, toastError }) => {
          try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });

            if (error) throw error;

            set({ user: data.user, session: data.session, isLoading: false });
            toastSuccess?.(AUTH_MESSAGES.VERIFICATION_EMAIL_SENT);
            return { success: true };
          } catch (error) {
            return handleAuthError(error, toastError);
          } finally {
            set({ isLoading: false });
          }
        },

        // Sign out - accepts toast functions as arguments
        signOut: async ({ toastSuccess, toastError }) => {
          try {
            set({ isLoading: true, error: null });
            console.log("Attempting to sign out...");

            // First clear the local state
            set({ user: null, session: null });

            // Then sign out from Supabase
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error("Supabase signOut error:", error);
              throw error;
            }

            console.log("Supabase signOut successful.");
            set({ isLoading: false });
            toastSuccess?.(AUTH_MESSAGES.LOGOUT_SUCCESS);

            // Force a page reload to clear any remaining state
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }

            return { success: true };
          } catch (error) {
            console.error("Sign out failed:", error);
            return handleAuthError(error, toastError);
          } finally {
            set({ isLoading: false });
          }
        },

        // Update session - accepts toastError as argument for errors
        setSession: async (session, toastError) => {
          try {
            if (!session) {
              set({ user: null, session: null });
              console.log("Session cleared in store.");
              return { success: true };
            }

            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();
            if (userError) throw userError;

            set({ user, session });
            return { success: true };
          } catch (error) {
            console.error("Error setting session:", error);
            return handleAuthError(error, toastError);
          }
        },

        // Update profile - accepts toast functions as arguments
        updateProfile: async (updates, { toastSuccess, toastError }) => {
          try {
            set({ isLoading: true });
            const { user } = get();

            if (!user) throw new Error("User not authenticated");

            const { data, error } = await supabase.auth.updateUser({
              data: updates,
            });

            if (error) throw error;

            set({
              user: {
                ...user,
                user_metadata: { ...user.user_metadata, ...updates },
              },
            });
            toastSuccess?.(AUTH_MESSAGES.PROFILE_UPDATED);
            return { success: true };
          } catch (error) {
            return handleAuthError(error, toastError);
          } finally {
            set({ isLoading: false });
          }
        },
      };
    },
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isLoading: state.isLoading,
        error: state.error,
      }),
    }
  )
);
