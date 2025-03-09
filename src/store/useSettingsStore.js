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
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: "settings-storage",
    }
  )
);
