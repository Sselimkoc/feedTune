"use client";

import { useLanguage as useLanguageFromContext } from "@/contexts/LanguageContext";

// Re-export the hook for better architecture
export function useLanguage() {
  return useLanguageFromContext();
}
