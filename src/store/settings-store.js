import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettingsStore = create(
  persist(
    (set) => ({
      settings: {
        theme: "light",
        language: "en",
        updateInterval: "30",
        autoMarkAsRead: false,
        pushNotifications: false,
        emailNotifications: false,
      },
      updateSetting: (key, value) => {
        set((state) => {
          // Tema değiştiğinde DOM'u güncelle
          if (key === "theme") {
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(value);
          }

          return {
            settings: {
              ...state.settings,
              [key]: value,
            },
          };
        });
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.settings.theme === "light" ? "dark" : "light";
          const root = window.document.documentElement;
          root.classList.remove("light", "dark");
          root.classList.add(newTheme);
          return {
            settings: {
              ...state.settings,
              theme: newTheme,
            },
          };
        });
      },
      resetSettings: () => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add("light");

        set({
          settings: {
            theme: "light",
            language: "en",
            updateInterval: "30",
            autoMarkAsRead: false,
            pushNotifications: false,
            emailNotifications: false,
          },
        });
      },
    }),
    {
      name: "settings-storage",
      getStorage: () => localStorage,
    }
  )
);
