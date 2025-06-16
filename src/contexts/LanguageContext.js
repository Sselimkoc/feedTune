"use client";

import { createContext, useContext, useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

// Supported languages
const supportedLanguages = {
  tr: {
    name: "Türkçe",
    nativeName: "Türkçe",
    flag: "🇹🇷",
  },
  en: {
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
};

// Default language
const DEFAULT_LANGUAGE = "en";

// Create context
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { settings, setLanguage: setStoreLanguage } = useSettingsStore();
  const { i18n: i18nInstance } = useTranslation();

  // Initialize language from store or browser preference
  useEffect(() => {
    const initLanguage = () => {
      if (settings.language && supportedLanguages[settings.language]) {
        i18nInstance.changeLanguage(settings.language);
      } else {
        // Check browser language
        const browserLanguage = navigator.language.split("-")[0];
        if (supportedLanguages[browserLanguage]) {
          i18nInstance.changeLanguage(browserLanguage);
          setStoreLanguage(browserLanguage);
        } else {
          // Set default language if not supported
          i18nInstance.changeLanguage(DEFAULT_LANGUAGE);
          setStoreLanguage(DEFAULT_LANGUAGE);
        }
      }
    };

    initLanguage();
  }, [settings.language, setStoreLanguage, i18nInstance]);

  // Change language function
  const changeLanguage = (newLanguage) => {
    if (supportedLanguages[newLanguage]) {
      i18nInstance.changeLanguage(newLanguage);
      setStoreLanguage(newLanguage);
    } else {
      console.warn(`Unsupported language: ${newLanguage}`);
    }
  };

  // Current language metadata
  const currentLanguageData =
    supportedLanguages[i18nInstance.language] ||
    supportedLanguages[DEFAULT_LANGUAGE];

  return (
    <LanguageContext.Provider
      value={{
        language: i18nInstance.language,
        changeLanguage,
        languageName: currentLanguageData.name,
        nativeName: currentLanguageData.nativeName,
        flag: currentLanguageData.flag,
        supportedLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
