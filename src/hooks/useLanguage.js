"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/store/useSettingsStore";

// Supported languages
const supportedLanguages = {
  tr: {
    name: "Türkçe",
    nativeName: "Türkçe",
    flag: "fi fi-tr",
  },
  en: {
    name: "English",
    nativeName: "English",
    flag: "fi fi-gb",
  },
};

// Default language
const DEFAULT_LANGUAGE = "en";

/**
 * Custom hook for language management
 * Combines react-i18next with our custom language settings
 */
export function useLanguage() {
  const { i18n, t } = useTranslation();
  const { settings, setLanguage: setStoreLanguage } = useSettingsStore();

  const changeLanguage = useCallback((newLanguage) => {
    if (supportedLanguages[newLanguage]) {
      i18n.changeLanguage(newLanguage);
      setStoreLanguage(newLanguage);
    }
  }, [i18n, setStoreLanguage]);

  // Current language metadata
  const currentLanguageData =
    supportedLanguages[i18n.language] || supportedLanguages[DEFAULT_LANGUAGE];

  return {
    language: i18n.language,
    changeLanguage,
    t,
    languageName: currentLanguageData.name,
    nativeName: currentLanguageData.nativeName,
    flag: currentLanguageData.flag,
    supportedLanguages,
  };
}
