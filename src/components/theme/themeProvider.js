"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useSettingsStore } from "@/store/useSettingsStore";

export function ThemeProvider({ children }) {
  const { settings } = useSettingsStore();
  const [mounted, setMounted] = React.useState(false);
  const [themeTransition, setThemeTransition] = React.useState(false);

  // Tema değişikliğini izle
  const handleThemeChange = React.useCallback(() => {
    setThemeTransition(true);
    const timer = setTimeout(() => {
      setThemeTransition(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Komponent mount olduktan sonra
  React.useEffect(() => {
    setMounted(true);

    // Tema değişikliğini dinle
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, [handleThemeChange]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={settings.theme === "system"}
      disableTransitionOnChange={false}
      themes={["light", "dark"]}
      onChangeTheme={() => {
        // Tema değişikliği olduğunda özel event tetikle
        window.dispatchEvent(new Event("theme-change"));
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
