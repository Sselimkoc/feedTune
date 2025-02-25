import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // Tema ayarları
      theme: {
        mode: "system", // system, light, dark
        primaryColor: null,
        accentColor: null,
        backgroundColor: null,
        textColor: null,
        customColors: {}, // Kanal/feed bazlı özel renkler
      },
      // Renk ağırlıkları (kullanıcı etkileşimine göre)
      colorWeights: {},
      // Tema geçmişi
      themeHistory: [],

      // Actions
      setThemeMode: (mode) =>
        set((state) => ({
          theme: { ...state.theme, mode },
        })),

      setPrimaryColor: (color) =>
        set((state) => ({
          theme: { ...state.theme, primaryColor: color },
        })),

      setAccentColor: (color) =>
        set((state) => ({
          theme: { ...state.theme, accentColor: color },
        })),

      setCustomColor: (feedId, color) =>
        set((state) => ({
          theme: {
            ...state.theme,
            customColors: {
              ...state.theme.customColors,
              [feedId]: color,
            },
          },
        })),

      updateColorWeight: (feedId, weight) =>
        set((state) => ({
          colorWeights: {
            ...state.colorWeights,
            [feedId]: (state.colorWeights[feedId] || 0) + weight,
          },
        })),

      saveTheme: () =>
        set((state) => ({
          themeHistory: [
            ...state.themeHistory,
            {
              ...state.theme,
              timestamp: new Date().toISOString(),
            },
          ].slice(-5), // Son 5 temayı sakla
        })),

      resetTheme: () =>
        set({
          theme: {
            mode: "system",
            primaryColor: null,
            accentColor: null,
            backgroundColor: null,
            textColor: null,
            customColors: {},
          },
          colorWeights: {},
        }),
    }),
    {
      name: "theme-storage",
      version: 1,
    }
  )
);
