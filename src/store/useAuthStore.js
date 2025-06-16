"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Not: Store içinde useLanguage hook'unu doğrudan kullanamayız çünkü hook'lar sadece React bileşenlerinde kullanılabilir.
// Bu nedenle toast mesajlarını doğrudan kullanıcı arayüzü bileşenlerinde çevireceğiz.

// Auth ile ilgili toast mesajları için sabit anahtarlar tanımlayalım
const AUTH_MESSAGES = {
  VERIFICATION_EMAIL_SENT: "auth.verificationEmailSent",
  LOGIN_SUCCESS: "auth.loginSuccess",
  LOGOUT_SUCCESS: "auth.logoutSuccess",
  AUTHENTICATION_ERROR: "auth.authenticationError",
  PROFILE_UPDATED: "auth.profileUpdated",
  RATE_LIMIT_ERROR: "auth.rateLimitError",
};

// Rate limit için basit bir throttle mekanizması
const throttle = {
  lastAttempt: 0,
  minInterval: 2000, // 2 saniye
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

      const handleAuthError = (error) => {
        console.error("Auth error:", error);

        // Rate limit hatası için özel mesaj
        if (error.status === 429) {
          toast.error(AUTH_MESSAGES.RATE_LIMIT_ERROR);
          return { success: false, error };
        }

        // Token/session hataları için sessiz yönlendirme
        if (error.status === 401 || error.message?.includes("token")) {
          set({ user: null, session: null });
          // Sadece korumalı bir sayfadaysa yönlendir
          if (window.location.pathname !== "/") {
            window.location.href = "/";
          }
          return { success: false, error };
        }

        toast.error(error.message || AUTH_MESSAGES.AUTHENTICATION_ERROR);
        return { success: false, error };
      };

      return {
        user: null,
        session: null,
        isLoading: true,
        error: null,

        initialize: async () => {
          try {
            set({ isLoading: true, error: null });

            // Güvenli user bilgisini al
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();
            if (userError) throw userError;

            // Session bilgisini al
            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            set({ user, session, isLoading: false });

            // Auth state değişikliklerini dinle
            const {
              data: { subscription },
            } = supabase.auth.onAuthStateChange(async (event, session) => {
              if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                const {
                  data: { user },
                  error,
                } = await supabase.auth.getUser();
                if (!error) {
                  set({ user, session });
                }
              } else if (event === "SIGNED_OUT") {
                set({ user: null, session: null });
              }
            });

            return subscription;
          } catch (error) {
            set({ error, isLoading: false });
            console.error("Auth initialization error:", error);
          }
        },

        signIn: async ({ email, password }) => {
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
          } catch (error) {
            set({ error, isLoading: false });
            throw error;
          }
        },

        signUp: async ({ email, password }) => {
          try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });

            if (error) throw error;

            set({ user: data.user, session: data.session, isLoading: false });
          } catch (error) {
            set({ error, isLoading: false });
            throw error;
          }
        },

        signOut: async () => {
          try {
            set({ isLoading: true, error: null });

            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            set({ user: null, session: null, isLoading: false });
          } catch (error) {
            set({ error, isLoading: false });
            throw error;
          }
        },

        resetPassword: async (email) => {
          try {
            set({ isLoading: true, error: null });

            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;

            set({ isLoading: false });
          } catch (error) {
            set({ error, isLoading: false });
            throw error;
          }
        },

        updatePassword: async (newPassword) => {
          try {
            set({ isLoading: true, error: null });

            const { error } = await supabase.auth.updateUser({
              password: newPassword,
            });

            if (error) throw error;
            set({ isLoading: false });
          } catch (error) {
            set({ error, isLoading: false });
            throw error;
          }
        },

        updateProfile: async (displayName, avatarUrl) => {
          try {
            set({ isLoading: true });
            const { user } = get();

            if (!user) throw new Error("User not authenticated");

            // Kullanıcı meta verilerini güncelle
            const { data, error } = await supabase.auth.updateUser({
              data: {
                display_name: displayName,
                avatar_url: avatarUrl,
              },
            });

            if (error) throw error;

            // Kullanıcı verisini güncelle
            const updatedUser = {
              ...user,
              user_metadata: {
                ...user.user_metadata,
                display_name: displayName,
                avatar_url: avatarUrl,
              },
            };

            set({ user: updatedUser });
            toast.success(AUTH_MESSAGES.PROFILE_UPDATED);
            return { success: true };
          } catch (error) {
            return handleAuthError(error);
          } finally {
            set({ isLoading: false });
          }
        },

        setSession: async (session) => {
          try {
            if (!session) {
              set({ user: null, session: null });
              return;
            }

            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();
            if (userError) throw userError;

            set({ user, session });
          } catch (error) {
            console.error("Error setting session:", error);
            set({ error });
            throw error;
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
