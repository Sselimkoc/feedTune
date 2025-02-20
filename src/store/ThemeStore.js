import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set) => ({
      isDarkMode: false,
      setIsDarkMode: (value) => set({ isDarkMode: value }),
    }),
    {
      name: "theme-storage",
    }
  )
);
