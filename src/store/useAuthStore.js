"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

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

        toast.error(error.message || "Authentication error occurred");
        return { success: false, error };
      };

      return {
        user: null,
        session: null,
        loading: false,
        lastChecked: null,

        setUser: (user) => set({ user }),

        setSession: async (session) => {
          try {
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

            toast.success("Verification email sent! Please check your inbox.");
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
            toast.success("Successfully signed in!");
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
            toast.success("Successfully signed out!");
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

              // Sayfa yenilendiğinde UI'ın güncellenmesi için
              if (typeof window !== "undefined") {
                // Client tarafında olduğumuzu kontrol et
                const event = new CustomEvent("auth-state-change", {
                  detail: { session },
                });
                window.dispatchEvent(event);
              }
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

        fetchUser: async () => {
          const { user, error } = await supabase.auth.getUser();
          if (error) {
            console.error("Error fetching user:", error);
            return null;
          }
          return user;
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
