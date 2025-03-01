"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useSettingsStore } from "@/store/useSettingsStore";

export function ThemeProvider({ children }) {
  const { settings } = useSettingsStore();
  const [mounted, setMounted] = React.useState(false);
  const [themeTransition, setThemeTransition] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState(null);

  // Tema değişikliğini izle
  const handleThemeChange = React.useCallback(
    (newTheme) => {
      if (currentTheme !== newTheme && mounted) {
        setThemeTransition(true);

        // Tema değişim animasyonunu göster
        const timer = setTimeout(() => {
          setThemeTransition(false);
        }, 800);

        // Mevcut temayı güncelle
        setCurrentTheme(newTheme);

        return () => clearTimeout(timer);
      }
    },
    [currentTheme, mounted]
  );

  // Komponent mount olduktan sonra
  React.useEffect(() => {
    setMounted(true);

    // Başlangıç temasını al
    const initialTheme = document.documentElement.classList.contains("dark")
      ? "dark"
      : document.documentElement.classList.contains("light")
      ? "light"
      : "system";

    setCurrentTheme(initialTheme);

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={settings.theme === "system"}
      disableTransitionOnChange={false}
      themes={["light", "dark"]}
      onChangeTheme={(theme) => {
        // Tema değişikliği olduğunda animasyonu tetikle
        handleThemeChange(theme);
      }}
    >
      {/* Tema geçiş efekti */}
      {mounted && themeTransition && (
        <div className="fixed inset-0 z-[9999] pointer-events-none theme-transition">
          <div className="absolute inset-0 bg-background opacity-0 animate-theme-fade" />
        </div>
      )}
      {children}
    </NextThemesProvider>
  );
}
