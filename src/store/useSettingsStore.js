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
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setLanguage: (language) =>
        set((state) => ({
          settings: { ...state.settings, language },
        })),
    }),
    {
      name: "settings-storage",
    }
  )
);
