"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useThemeStore } from "@/store/useThemeStore";

export function ThemeProvider({ children }) {
  const { theme } = useThemeStore();

  // CSS değişkenlerini güncelle
  React.useEffect(() => {
    const root = document.documentElement;

    // Tema modunu güncelle
    if (theme.mode !== "system") {
      root.classList.remove("light", "dark");
      root.classList.add(theme.mode);
    }

    // Renkleri güncelle
    if (theme.primaryColor) {
      root.style.setProperty("--primary", theme.primaryColor);
    }
    if (theme.accentColor) {
      root.style.setProperty("--accent", theme.accentColor);
    }
    if (theme.backgroundColor) {
      root.style.setProperty("--background", theme.backgroundColor);
    }
    if (theme.textColor) {
      root.style.setProperty("--foreground", theme.textColor);
    }
  }, [theme]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={theme.mode}
      enableSystem={theme.mode === "system"}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
