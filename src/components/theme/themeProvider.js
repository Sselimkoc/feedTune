"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useSettingsStore } from "@/store/useSettingsStore";

export function ThemeProvider({ children }) {
  const { settings } = useSettingsStore();

  return (
    <NextThemesProvider
      attribute="class"
      enableSystem={settings.theme === "system"}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
