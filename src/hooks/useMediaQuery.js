"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for responsive media queries
 * @param {string} query - The media query to match against
 * @returns {boolean} Whether the media query matches
 */
export function useMediaQuery(query) {
  // Initialize with null to avoid hydration mismatch
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Create media query
    const media = window.matchMedia(query);

    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Create event listener
    const listener = () => setMatches(media.matches);

    // Add listener
    media.addEventListener("change", listener);

    // Clean up
    return () => media.removeEventListener("change", listener);
  }, [query, matches]);

  // Return false during SSR to avoid hydration mismatch
  return mounted ? matches : false;
}

/**
 * Pre-defined media queries for common breakpoints
 */
export const mediaQueries = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
  dark: "(prefers-color-scheme: dark)",
  light: "(prefers-color-scheme: light)",
  portrait: "(orientation: portrait)",
  landscape: "(orientation: landscape)",
};
