"use client";

// TEMPORARY MODIFICATION: Email verification has been temporarily disabled
// Users can now register and login directly without email verification
// To re-enable email verification:
// 1. Set enable_confirmations = true in supabase/config.toml
// 2. Uncomment the email verification logic in this file
// 3. Uncomment the email verification handling in AuthModal.js

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserClient } from "@supabase/ssr";
import { useFeedStore } from "@/store/useFeedStore";
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

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const useAuthStore = create(
  persist(
    (set, get) => {
      // Handle auth errors with appropriate messages and actions
      const handleAuthError = (error, toastError) => {
        console.error("Auth error:", error);
        set({ isLoading: false, error });

        // Rate limit errors
        if (error.message?.includes("rate limit")) {
          toastError?.(AUTH_MESSAGES.RATE_LIMIT_ERROR);
          return { success: false, error };
        }

        // TEMPORARILY COMMENTED OUT - Email verification errors disabled
        // // Email verification errors
        // if (error.message?.includes("email not confirmed")) {
        //   toastError?.("auth.emailVerificationRequired");
        //   return { success: false, error, status: "email_not_verified" };
        // }

        // Email already exists errors
        if (error.message?.includes("already registered")) {
          toastError?.("auth.emailAlreadyExists");
          return { success: false, error, status: "email_exists" };
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
        isLoggingOut: false,

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

            set({ user: data.user, session: data.session, isLoading: false });
            toastSuccess?.(AUTH_MESSAGES.LOGIN_SUCCESS);
            return { success: true };
          } catch (error) {
            return handleAuthError(error, toastError);
          } finally {
            set({ isLoading: false });
          }
        },

        // Sign up - accepts toast functions as arguments
        // TEMPORARILY MODIFIED - Email verification disabled, direct registration allowed
        signUp: async ({ email, password, toastSuccess, toastError }) => {
          try {
            set({ isLoading: true, error: null });

            // TEMPORARILY COMMENTED OUT - Email verification check disabled
            // // First check if the email exists
            // const checkResponse = await fetch("/api/auth/check-email", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({ email }),
            // });

            // if (!checkResponse.ok) {
            //   throw new Error("Failed to check email");
            // }

            // const { exists, verified } = await checkResponse.json();

            // // If email exists and is verified, show error and prevent signup
            // if (exists && verified) {
            //   set({ isLoading: false });
            //   toastError?.("auth.emailAlreadyExists");
            //   return {
            //     success: false,
            //     error: "Email already exists",
            //     status: "email_exists",
            //   };
            // }

            // // If email exists but not verified, resend verification email
            // if (exists && !verified) {
            //   const { error: resendError } = await supabase.auth.resend({
            //     type: "signup",
            //     email,
            //   });

            //   if (resendError) throw resendError;

            //   set({ isLoading: false });
            //   toastSuccess?.("auth.verification.emailResent");
            //   return { success: true, status: "verification_resent" };
            // }

            // Proceed with direct signup (no email verification required)
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              // TEMPORARILY REMOVED - Email verification options disabled
              // options: {
              //   // Force email verification even if email confirmations are disabled in Supabase
              //   emailRedirectTo: `${window.location.origin}/auth/callback`,
              //   // Disable auto confirmation
              //   data: {
              //     confirmed_at: null,
              //   },
              // },
            });

            if (error) throw error;

            // TEMPORARILY COMMENTED OUT - Allow auto-login for new signups
            // // Clear any session that might have been created
            // // This prevents auto-login for new signups
            // if (data?.session) {
            //   await supabase.auth.signOut();
            // }

            // Set user and session if signup was successful
            if (data?.user && data?.session) {
              set({ user: data.user, session: data.session, isLoading: false });
              toastSuccess?.("auth.registerSuccess");
              return { success: true, status: "direct_signup" };
            }

            set({ isLoading: false });
            toastSuccess?.("auth.registerSuccess");

            // Return success with direct signup status
            return { success: true, status: "direct_signup" };
          } catch (error) {
            return handleAuthError(error, toastError);
          } finally {
            set({ isLoading: false });
          }
        },

        // Sign out - accepts toast functions as arguments
        signOut: async ({ toastSuccess, toastError }) => {
          try {
            set({ isLoading: true, isLoggingOut: true, error: null });
            console.log("Attempting to sign out...");

            // Sign out from Supabase first
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error("Supabase signOut error:", error);
              throw error;
            }

            console.log("Supabase signOut successful.");

            // Clear all state at once
            set({
              user: null,
              session: null,
              isLoading: false,
              isLoggingOut: false,
              error: null,
            });
            // Clear feed store as well
            useFeedStore.getState().clearStore();

            toastSuccess?.(AUTH_MESSAGES.LOGOUT_SUCCESS);
            return { success: true, isLoggingOut: false };
          } catch (error) {
            console.error("Sign out failed:", error);
            set({ isLoggingOut: false, isLoading: false });
            return handleAuthError(error, toastError);
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
