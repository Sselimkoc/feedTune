import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettingsStore = create(
  persist(
    (set) => ({
      settings: {
        refreshInterval: 30,
        compactMode: false,
        autoMarkAsRead: false,
        pushNotifications: false,
        emailNotifications: false,
        language: "tr",
        theme: "system",
        categoryColors: {
          youtube: {
            light: "#f87171",
            dark: "#ef4444",
          },
          rss: {
            light: "#60a5fa",
            dark: "#3b82f6",
          },
        },
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setLanguage: (language) =>
        set((state) => ({
          settings: { ...state.settings, language },
        })),
      toggleTheme: () =>
        set((state) => {
          const currentTheme = state.settings.theme;
          const nextTheme =
            currentTheme === "dark"
              ? "light"
              : currentTheme === "light"
              ? "system"
              : "dark";

          return {
            settings: { ...state.settings, theme: nextTheme },
          };
        }),
      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),
    }),
    {
      name: "settings-storage",
    }
  )
);
