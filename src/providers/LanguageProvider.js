"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";

export function LanguageProvider({ initialLanguage = "en", children }) {
  // Synchronously align i18n with the server-rendered language before children paint.
  // Because translations are pre-loaded, changeLanguage() is synchronous here.
  if (i18n.language !== initialLanguage) {
    i18n.changeLanguage(initialLanguage);
  }

  const language = useSettingsStore((state) => state.settings.language);

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    document.cookie = `language=${language}; path=/; max-age=31536000; SameSite=Lax`;
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
