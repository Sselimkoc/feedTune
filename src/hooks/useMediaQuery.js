"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for responsive media queries
 * @param {string} query - The media query to match against
 * @returns {boolean} Whether the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (e) => setMatches(e.matches);

    // Add listener
    media.addEventListener("change", listener);

    // Clean up
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
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
