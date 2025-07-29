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

// Simple rate limiting with exponential backoff
const rateLimiter = {
  lastRequestTime: 0,
  minInterval: 1000, // 1 second minimum between requests
  retryCount: 0,
  maxRetries: 3,

  canMakeRequest() {
    const now = Date.now();
    if (now - this.lastRequestTime < this.minInterval) {
      return false;
    }
    this.lastRequestTime = now;
    return true;
  },

  reset() {
    this.retryCount = 0;
    this.minInterval = 1000;
  },

  increaseBackoff() {
    this.retryCount++;
    this.minInterval = Math.min(1000 * Math.pow(2, this.retryCount), 8000);
    return this.minInterval;
  },

  canRetry() {
    return this.retryCount < this.maxRetries;
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

        // Rate limit errors with retry logic
        if (error.message?.includes("rate limit") || error.status === 429) {
          if (rateLimiter.canRetry()) {
            const backoffTime = rateLimiter.increaseBackoff();
            console.log(
              `Rate limited, retrying in ${backoffTime}ms (attempt ${rateLimiter.retryCount}/${rateLimiter.maxRetries})`
            );

            return {
              success: false,
              error,
              status: "rate_limited_retry",
              retryAfter: backoffTime,
              retryCount: rateLimiter.retryCount,
            };
          } else {
            rateLimiter.reset();
            toastError?.(AUTH_MESSAGES.RATE_LIMIT_ERROR);
            return { success: false, error, status: "rate_limited_max" };
          }
        }

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
            console.log("[useAuthStore] Initializing auth state...");
            set({ isLoading: true, error: null });

            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();
            if (userError) throw userError;

            console.log("[useAuthStore] User check result:", !!user);
            console.log("[useAuthStore] User details:", {
              id: user?.id,
              email: user?.email,
              emailConfirmed: user?.email_confirmed_at,
            });

            if (user) {
              // Get session for additional session data if needed
              const {
                data: { session },
                error: sessionError,
              } = await supabase.auth.getSession();

              console.log("[useAuthStore] User found:", user?.id);
              set({ user, session, isLoading: false });
            } else {
              console.log("[useAuthStore] No user found");
              set({ user: null, session: null, isLoading: false });
            }
          } catch (error) {
            console.error("[useAuthStore] Auth initialization error:", error);
            set({ error, isLoading: false });
          }
        },

        // Sign in - accepts toast functions as arguments
        signIn: async ({ email, password, toastSuccess, toastError }) => {
          try {
            // Check rate limiting
            if (!rateLimiter.canMakeRequest()) {
              toastError?.(AUTH_MESSAGES.RATE_LIMIT_ERROR);
              return {
                success: false,
                error: "Rate limited",
                status: "rate_limited",
              };
            }

            set({ isLoading: true, error: null });

            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) throw error;

            // Reset rate limiter on success
            rateLimiter.reset();
            set({ user: data.user, session: data.session, isLoading: false });
            toastSuccess?.(AUTH_MESSAGES.LOGIN_SUCCESS);

            return { success: true };
          } catch (error) {
            const result = handleAuthError(error, toastError);

            // Handle retry logic for rate limits
            if (result.status === "rate_limited_retry") {
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve(
                    get().signIn({
                      email,
                      password,
                      toastSuccess,
                      toastError,
                    })
                  );
                }, result.retryAfter);
              });
            }

            return result;
          } finally {
            set({ isLoading: false });
          }
        },

        // Sign up - accepts toast functions as arguments
        signUp: async ({ email, password, toastSuccess, toastError }) => {
          try {
            // Check rate limiting
            if (!rateLimiter.canMakeRequest()) {
              toastError?.(AUTH_MESSAGES.RATE_LIMIT_ERROR);
              return {
                success: false,
                error: "Rate limited",
                status: "rate_limited",
              };
            }

            set({ isLoading: true, error: null });

            // Proceed with direct signup (no email verification required)
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });

            if (error) throw error;

            // Reset rate limiter on success
            rateLimiter.reset();

            // Set user and session if signup was successful
            if (data?.user && data?.session) {
              set({
                user: data.user,
                session: data.session,
                isLoading: false,
              });
              toastSuccess?.("auth.registerSuccess");
              return { success: true, status: "direct_signup" };
            }

            set({ isLoading: false });
            toastSuccess?.("auth.registerSuccess");
            return { success: true, status: "direct_signup" };
          } catch (error) {
            const result = handleAuthError(error, toastError);

            // Handle retry logic for rate limits
            if (result.status === "rate_limited_retry") {
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve(
                    get().signUp({
                      email,
                      password,
                      toastSuccess,
                      toastError,
                    })
                  );
                }, result.retryAfter);
              });
            }

            return result;
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
