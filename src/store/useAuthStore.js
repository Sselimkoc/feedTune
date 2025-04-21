"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

// Not: Store içinde useLanguage hook'unu doğrudan kullanamayız çünkü hook'lar sadece React bileşenlerinde kullanılabilir.
// Bu nedenle toast mesajlarını doğrudan kullanıcı arayüzü bileşenlerinde çevireceğiz.

// Auth ile ilgili toast mesajları için sabit anahtarlar tanımlayalım
const AUTH_MESSAGES = {
  VERIFICATION_EMAIL_SENT: "auth.verificationEmailSent",
  LOGIN_SUCCESS: "auth.loginSuccess",
  LOGOUT_SUCCESS: "auth.logoutSuccess",
  AUTHENTICATION_ERROR: "auth.authenticationError",
  PROFILE_UPDATED: "auth.profileUpdated",
};

export const useAuthStore = create(
  persist(
    (set, get) => {
      const supabase = createClientComponentClient();

      const handleAuthError = (error) => {
        console.error("Auth error:", error);

        if (error.status === 401 || error.message?.includes("token")) {
          set({ user: null, session: null });
          window.location.href = "/";
        }

        toast.error(error.message || AUTH_MESSAGES.AUTHENTICATION_ERROR);
        return { success: false, error };
      };

      return {
        user: null,
        session: null,
        loading: false,
        lastChecked: null,

        setSession: async (session) => {
          try {
            if (session) {
              // Kullanıcı bilgilerini state'e kaydet
              set({
                user: session.user,
                session,
                lastChecked: new Date().toISOString(),
              });
              // Artık kullanıcı kontrol etmeye gerek yok, Supabase'in kendi tablolarını kullanıyoruz
            } else {
              set({
                user: null,
                session: null,
                lastChecked: new Date().toISOString(),
              });
            }
          } catch (error) {
            handleAuthError(error);
          }
        },

        signUp: async (email, password) => {
          try {
            set({ loading: true });
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });

            if (error) throw error;

            toast.success(AUTH_MESSAGES.VERIFICATION_EMAIL_SENT);
            return { success: true };
          } catch (error) {
            return handleAuthError(error);
          } finally {
            set({ loading: false });
          }
        },

        signIn: async (email, password) => {
          try {
            set({ loading: true });
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) throw error;

            set({
              user: data.user,
              session: data.session,
              lastChecked: new Date().toISOString(),
            });
            toast.success(AUTH_MESSAGES.LOGIN_SUCCESS);
            return { success: true };
          } catch (error) {
            return handleAuthError(error);
          } finally {
            set({ loading: false });
          }
        },

        signOut: async () => {
          try {
            set({ loading: true });
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            set({
              user: null,
              session: null,
              lastChecked: new Date().toISOString(),
            });
            toast.success(AUTH_MESSAGES.LOGOUT_SUCCESS);
            window.location.href = "/";
          } catch (error) {
            handleAuthError(error);
          } finally {
            set({ loading: false });
          }
        },

        checkSession: async () => {
          try {
            // Son kontrolden 1 dakika geçmediyse tekrar kontrol etme
            const lastChecked = get().lastChecked;
            if (lastChecked) {
              const timeSinceLastCheck = new Date() - new Date(lastChecked);
              if (timeSinceLastCheck < 60000) {
                // 1 dakika
                return get().session;
              }
            }

            const {
              data: { session },
              error,
            } = await supabase.auth.getSession();

            if (error) throw error;

            if (session) {
              set({
                user: session.user,
                session,
                lastChecked: new Date().toISOString(),
              });
            } else {
              set({
                user: null,
                session: null,
                lastChecked: new Date().toISOString(),
              });
            }

            return session;
          } catch (error) {
            handleAuthError(error);
            return null;
          }
        },

        updateProfile: async (displayName, avatarUrl) => {
          try {
            set({ loading: true });
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
            set({ loading: false });
          }
        },
      };
    },
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        lastChecked: state.lastChecked,
      }),
    }
  )
);
