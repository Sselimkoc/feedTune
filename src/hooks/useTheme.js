"use client";

import { useTheme as useNextTheme } from "next-themes";

/**
 * Custom hook to access and manipulate theme settings
 * Wraps next-themes' useTheme with additional functionality
 * @returns {Object} Theme information and functions
 */
export function useTheme() {
  const { theme, setTheme, systemTheme, themes } = useNextTheme();

  /**
   * Gets the current active theme, accounting for system theme
   * @returns {string} The current theme
   */
  const currentTheme = theme === "system" ? systemTheme : theme;

  /**
   * Toggles between light and dark themes
   */
  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  /**
   * Checks if the current theme is dark
   * @returns {boolean} True if the current theme is dark
   */
  const isDarkTheme = currentTheme === "dark";

  return {
    theme,
    setTheme,
    systemTheme,
    themes,
    currentTheme,
    toggleTheme,
    isDarkTheme,
  };
}
